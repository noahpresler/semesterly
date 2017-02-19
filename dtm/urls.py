from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin

urlpatterns = patterns('',
    #polls, down to meet, meeting maker
    url(r'$', 'dtm.views.view_dtm_root'),
	url(r'share/(?P<ref>.+)/*$', 'dtm.views.share_availability'),
)