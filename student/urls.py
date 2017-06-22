from django.conf.urls import patterns, url
from django.contrib import admin

import student.views

admin.autodiscover()

urlpatterns = patterns('',
                       # profile management
                       url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
                       url(r'^unsubscribe/(?P<id>[\w.@+-]+)/(?P<token>[\w.:\-_=]+)/$', student.views.unsubscribe),
                       url(r'^user/settings/$', student.views.UserView.as_view()),

                       # timetable management
                       url(r'^user/timetables/$', student.views.UserTimetableView.as_view()),
                       url(r'^user/timetables/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/$',
                           student.views.UserTimetableView.as_view()),
                       url(r'^user/timetables/(?P<sem_name>.+)/(?P<year>[0-9]{4})/(?P<tt_name>.+)/$',
                           student.views.UserTimetableView.as_view()),
                       # social
                       url(r'^user/classmates/(?P<sem_name>.+)/(?P<year>[0-9]{4})',
                           student.views.ClassmateView.as_view()),
                       url(r'^user/gcal/?$', student.views.GCalView.as_view()),
                       url(r'^user/reactions/?$', student.views.ReactionView.as_view()),

                       # for accepting TOS.
                       url(r'^tos/accept/', 'student.views.accept_tos'),
                       )
