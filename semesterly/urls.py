from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin

import analytics.views
import student.views
import timetable.views

admin.autodiscover()

# custom 404 page
handler404 = 'timetable.views.custom_404'
# custom 500 page
handler500 = 'timetable.views.custom_500'

    # for sorting search results by course code
    # sqs = SearchQuerySet().order_by('code')

urlpatterns = patterns('',
    # url(r'^admin/', include(admin.site.urls)),

    # app urls
    url('', include('timetable.urls')),

    #finding friends
    url('', include('social.apps.django_app.urls', namespace='social')),
    url('', include('django.contrib.auth.urls', namespace='auth')),

    # home
    url(r'^$', 'timetable.views.view_timetable'),

    # analytics
    url(r'^analytics/*$', 'analytics.views.view_analytics_dashboard'),
        # Robots.txt
    url(r'^robots.txt*$', 'analytics.views.view_analytics_dashboard'),
    url(r'^user/log_fb_alert_click/*$', 'analytics.views.log_facebook_alert_click'),
    url(r'^user/log_fb_alert_view/*$', 'analytics.views.log_facebook_alert_view'),
    url(r'^user/log_ical/*$', student.views.log_ical_export),

    # student
        # registration
    url(r'^setRegistrationToken/', student.views.set_registration_token),
    url(r'^deleteRegistrationToken/', student.views.delete_registration_token),
        # profile management
    url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
    url(r'^unsubscribe/(?P<id>[\w.@+-]+)/(?P<token>[\w.:\-_=]+)/$', student.views.unsubscribe),
    url(r'^user/save_settings/$', student.views.save_settings),
    url(r'me/*', timetable.views.profile),
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

    # about page
    url(r'about/*', 'timetable.views.about'),

    # press page
    url(r'press/*', 'timetable.views.press'),

    # Automatic deployment endpoint
    url(r'deploy_staging/', 'semesterly.views.deploy_staging'),

    url(r'^sw(.*.js)$', 'timetable.views.sw_js', name='sw_js'),
    url(r'^manifest(.*.json)$', 'timetable.views.manifest_json', name='manifest_json'),

    # for testing 404, so i don't have to turn off debug
	url(r'^404testing/', 'timetable.views.custom_404'),
    url(r'^500testing/', 'timetable.views.custom_500'),

    # final exam scheduler
    (r'^get_final_exams/*$', 'timetable.views.final_exam_scheduler'),
    url(r'^final_exams/*$', 'timetable.views.view_final_exams'),
)

#profiling
urlpatterns += [url(r'^silk/', include('silk.urls', namespace='silk'))]

if getattr(settings, 'STAGING', False):
    urlpatterns += patterns('', url(r'^robots.txt$', lambda r: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain")) )
else:
    urlpatterns += patterns('', url(r'^robots.txt$', lambda r: HttpResponse("User-agent: *\nDisallow:", content_type="text/plain")) )
