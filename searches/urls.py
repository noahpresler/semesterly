from django.conf.urls import patterns, url
from django.contrib import admin

import searches.views


admin.autodiscover()

search_params = '(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.+?)/'

urlpatterns = patterns('',
                       url(r'^search/(?P<school>.+?)/' + search_params,
                           searches.views.course_search),
                       url(r'^advanced_search/', searches.views.advanced_course_search),

                       url(r'^api/search/' + search_params,
                           searches.views.CourseSearchList.as_view()),
                       url(r'^api/advanced_search/' + search_params,
                           searches.views.AdvancedCourseSearchList.as_view())
                       )
