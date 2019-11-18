from django.conf.urls import patterns, url
from django.contrib import admin

import pilot.views

app_name = 'pilot'
urlpatterns = patterns('', url('pilot/', pilot.views.index, name='home'))