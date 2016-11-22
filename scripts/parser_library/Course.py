# @what     Parsing library Course Object
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/22/16

import django
import os, datetime, requests, cookielib, re, sys

class Course:

	def __init__(self):
		self.course = {}
	