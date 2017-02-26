import json
from time import sleep
import django
import sys
import requests
import os
from datetime import *
import urllib
from django.utils.encoding import smart_str, smart_unicode
import umich_courses
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from amazonproduct import API 
api = API(locale='us')

is_required = True
class umich_textbook_parser():
	def __init__(self):
		#super(umich_textbook_parser,self).__init__()
		''' 
			Hardcoded fields for testing
			Use inherited values from umich_parser when integrated
		'''
		self.terms = '2110'
		self.schools = {'SchoolCode': 'ENG'}
		self.subject = {'SubjectCode': 'EECS'}
		self.cat_num = ['311']
		self.section = '001'
		self.create_count = 0
		self.identified_count = 0
		self.book_request_count = 0
		self.max_textbooks = 100
		self.textbook_link = TextbookLink
		self.url = "http://api-gw.it.umich.edu/Curriculum/SOC/v1/Terms"
		self.header = { "Authorization" : "Bearer " + "5562e94b39dccc2eaaab181e0c4ee", \
						"Accept": 'application/json', "User-Agent": "curl/7.35.0"}

	def get_textbooks(self, term, school, subject, cat_num, section):
		textbook_url = self.url + "/" + str(term) + "/Schools/" + str(school) + "/Subjects/" + \
						str(subject) + "/CatalogNbrs/" + str(cat_num) + "/Sections/" + str(section) + \
						"/Textbooks"
		resp = self.get_url(textbook_url)
		if(resp == []):
			return resp		
		try:
			textbook_info = json.loads(resp)['getSOCTextbooksResponse']['Textbook']
			if(type(textbook_info) == list):
				textbook_info = textbook_info[0]
			# No textbook information returned from API
			if((textbook_info == 'null') or (textbook_info is None)):
				return 'TBD'
			# Course uses Zybooks online
			elif((textbook_info["ISBN"] == None)):
				return 'ZyBooks'
		except KeyError:
			return 'No textbook information found'
		return textbook_info

	def get_detail_page(self, result):
		try:
			return smart_str(result.Items.Item.DetailPageURL)
		except:
			return "Cannot Be Found"

	def get_image_url(self, result):
		try:
			return smart_str(result.Items.Item.MediumImage.URL)
		except:
			return "Cannot Be Found"

	def get_author(self,result):
		try:
			return smart_str(result.Items.Item.ItemAttributes.Author)
		except:
			return "Cannot Be Found"

	def get_title(self,result):
		try:
			return smart_str(result.Items.Item.ItemAttributes.Title)
		except:
			return "Cannot Be Found"

	def get_amazon_fields(self,isbn):
		try:
			result = api.item_lookup(isbn.strip(), IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
			info = {
				"DetailPageURL" : self.get_detail_page(result),
				"ImageURL" : self.get_image_url(result),
				"Author" : self.get_author(result),
				"Title" : self.get_title(result)
			}
		except:
			import traceback
			traceback.print_exc()
			info = {
				"DetailPageURL" : "Cannot be found",
				"ImageURL" : "Cannot be found",
				"Author" : "Cannot be found",
				"Title" : "Cannot be found"
			}
		return info

	def make_textbook(self, required, isbn_number, cat_num, section):
		try:
			course = Course.objects.filter(code__contains = cat_num, school = 'umich')[0]
		except IndexError:
			print("index error (course does not exist): " + cat_num)
			return
		sections = Section.objects.filter(course = course, meeting_section = section)
		info = self.get_amazon_fields(isbn_number)

		# update/create textbook
		textbook_data = {
			'detail_url': info['DetailPageURL'],
			'image_url': info["ImageURL"],
			'author': info["Author"],
			'title': info["Title"]
		}
		textbook, created = Textbook.objects.update_or_create(
			isbn=isbn_number,
			defaults=textbook_data
		)

		self.create_count += int(created)

		# link to all course offerings
		for section in sections:
			section, created = self.textbook_link.objects.update_or_create(
				is_required = is_required,
				section = section,
				textbook = textbook
			)

		# print results
		if created:
			try:
				print "Textbook created: " + str(textbook.title)
			except UnicodeEncodeError:
				pass
		else:
			self.identified_count += 1
			try:
				print "Textbook found, not created: " + str(textbook.title)
			except UnicodeEncodeError:
				pass
