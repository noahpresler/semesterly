from django.conf.urls import patterns, url
from django.contrib import admin

import student.views

admin.autodiscover()

urlpatterns = patterns('',
                       url(r'^react/*', student.views.react_to_course),

                       # profile management
                       url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
                       url(r'^unsubscribe/(?P<id>[\w.@+-]+)/(?P<token>[\w.:\-_=]+)/$', student.views.unsubscribe),
                       url(r'^user/settings/$', student.views.UserView.as_view()),

                       # timetable management
                       url(r'^user/save_timetable/$', student.views.save_timetable),
                       url(r'^user/duplicate_timetable/$', student.views.duplicate_timetable),
                       url(r'^user/delete_timetable/$', student.views.delete_timetable),
                       url(r'^user/get_saved_timetables/(?P<school>.+)/(?P<sem_name>.+)/(?P<year>[0-9]{4})',
                           student.views.get_student_tts_wrapper),
                       # social
                       url(r'^user/get_classmates/$', student.views.get_classmates),
                       url(r'^user/get_most_classmates_count/$', student.views.get_most_classmate_count),
                       url(r'^user/find_friends/*$', student.views.find_friends),
                       url(r'^user/add_to_gcal/*$', student.views.add_tt_to_gcal),

                       # api:
                       url(r'^user/timetables/$', student.views.UserTimetableView.as_view()),
                       # post (create, and duplicate)
                       url(r'^user/timetables/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/$',
                           student.views.UserTimetableView.as_view()),  # get all
                       url(r'^user/timetables/(?P<sem_name>.+)/(?P<year>[0-9]{4})/(?P<tt_name>.+)/$',
                           student.views.UserTimetableView.as_view()),  # delete

                       # # social
                       url(r'^user/classmates/(?P<sem_name>.+)/(?P<year>[0-9]{4})',
                           student.views.ClassmateView.as_view()),
                       url(r'^user/gcal/$', student.views.GCalView.as_view()),  # post
                       )
