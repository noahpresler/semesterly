from django.conf.urls import patterns, url
from django.contrib import admin

import searches.views


admin.autodiscover()


urlpatterns = patterns('',
                       url(r'^search/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.*?)/?$',
                           searches.views.CourseSearchList.as_view()),
                       )
