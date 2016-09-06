# # @what	Vanderbilt Course Eval Parser
# # @org	Semeseter.ly
# # @author	Michael N. Miller
# # @date	9/4/16

# import django, os, datetime
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
# django.setup()
# from timetable.models import *
# from fake_useragent import UserAgent
# from bs4 import BeautifulSoup
# import requests, cookielib, re, sys

# class VandyEvalParser:

# 	def __init__(self, sem="Fall 2016"):
# 		self.session = requests.Session()
# 		self.headers = {'User-Agent' : 'My User Agent 1.0'}
# 		self.cookies = cookielib.CookieJar()
# 		self.school = 'vandy'
# 		self.semester = sem
# 		self.departments = {}
# 		self.course = {}

# 	def get_html(self, url, payload=''):
# 		html = None
# 		while html is None:
# 			try:
# 				r = self.session.get(
# 					url,
# 					params = payload,
# 					cookies = self.cookies,
# 					headers = self.headers,
# 					verify = True)

# 				if r.status_code == 200:
# 					html = r.text

# 			except (requests.exceptions.Timeout,
# 				requests.exceptions.ConnectionError):
# 				print "Unexpected error: ", sys.exc_info()[0]
# 				continue

# 		return html.encode('utf-8')

# 	def login:
# 		pass

# 	def parse:
# 		pass

# def main():
# 	vep = VandyEvalParser()
# 	vep.parse()

# if __name__ == "__main__":
# 	main()