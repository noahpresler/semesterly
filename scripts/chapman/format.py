import django, os, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
import requests, cookielib, re, sys
import dryscrape, urllib

data = ''
with open('scripts/chapman/desc.html') as myfile:
	data=''.join(line.rstrip() for line in myfile)

print BeautifulSoup(data).prettify()