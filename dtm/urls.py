from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin

urlpatterns = patterns('',
    #polls, down to meet, meeting maker
	url(r'availability/*$', 'dtm.views.get_availability'),
	url(r'share/(?P<ref>.+)/*$', 'dtm.views.share_availability'),
    url(r'^$', 'dtm.views.view_dtm_root'),
)