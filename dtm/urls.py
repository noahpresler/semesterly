from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin

urlpatterns = patterns('',
	url(r'test/*$', 'dtm.views.test'),
)