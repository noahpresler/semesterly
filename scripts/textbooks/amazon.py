import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from django.utils.encoding import smart_str, smart_unicode
from timetable.models import Textbook, TextbookLink
from amazonproduct import API
api = API(locale='us')

# NOTE: (mostly) copied from base bn parser, need to do full integration
def make_textbook(is_required, isbn_number, section):

	info = get_amazon_fields(isbn_number)

	# invalid isbn
	if not info:
		return

	# update/create textbook
	textbook_data = {
		'detail_url': info['DetailPageURL'],
		'image_url': info["ImageURL"],
		'author': info["Author"],
		'title': info["Title"]
	}

	textbook, created = Textbook.objects.update_or_create(isbn=isbn_number, defaults=textbook_data)

	# link to course section
	section, created = TextbookLink.objects.update_or_create(
		is_required = is_required,
		section = section,
		textbook = textbook
	)

	# print results
	if created:
		print "\t\tTextbook created: " + textbook.title
	else:
		print "\t\tTextbook found, not created: " + textbook.title


# NOTE: (mostly) copied from base bn parser, need to do full integration
def get_amazon_fields(isbn):
	try:
		response = None
		if len(isbn) == 9:
			response = api.item_lookup('0840049420', IdType='ISBN', SearchIndex='Book', ResponseGroup='Large')
		elif len(isbn) == 13:
			response = api.item_lookup(isbn, IdType='EAN', SearchIndex='All', ResponseGroup='Large')
		else:
			return None # invalid isbn

		info = {
			"DetailPageURL" : get_detail_page(response),
			"ImageURL" : get_image_url(response),
			"Author" : get_author(response),
			"Title" : get_title(response)
		}
	except:

		print '\t\tTextbook NOT FOUND for', isbn

		info = {
			"DetailPageURL" : "Cannot be found",
			"ImageURL" : "Cannot be found",
			"Author" : "Cannot be found",
			"Title" : "Cannot be found"
		}

	return info

def get_detail_page(result):
	return smart_str(result.Items.Item.DetailPageURL)

def get_image_url(result):
	return smart_str(result.Items.Item.MediumImage.URL)

def get_author(result):
	return smart_str(result.Items.Item.ItemAttributes.Author)

def get_title(result):
	return smart_str(result.Items.Item.ItemAttributes.Title)
