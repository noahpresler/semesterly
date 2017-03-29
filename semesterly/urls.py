from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin

# from haystack.views import SearchView
# from haystack.query import SearchQuerySet


admin.autodiscover()

# custom 404 page
handler404 = 'timetable.views.custom_404'
# custom 500 page
handler500 = 'timetable.views.custom_500'

    # for sorting search results by course code
    # sqs = SearchQuerySet().order_by('code')

urlpatterns = patterns('',
    # url(r'^admin/', include(admin.site.urls)),

    #finding frandsssss
    url(r'^find_friends/$', 'timetable.views.find_friends'),
    url('', include('social.apps.django_app.urls', namespace='social')),
    url('', include('django.contrib.auth.urls', namespace='auth')),
    url(r'^complete/facebook/.*$', 'timetable.views.view_timetable'),

    # home
    url(r'^$', 'timetable.views.view_timetable'),

    # sharing course
    url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$', 'timetable.views.view_timetable'),

    # request sharing timetable link
    url(r'share/link/*$', 'timetable.views.create_share_link'),

    # view shared timetable
    url(r'share/(?P<ref>.+)/*$', 'timetable.views.share_timetable'),

    # index
    url(r'^timetable/*$', 'timetable.views.redirect_to_home'),
    url(r'^timetable/.+$', 'timetable.views.redirect_to_home'),

    # analytics
    url(r'^analytics/*$', 'analytics.views.view_analytics_dashboard'),

    # Robots.txt
    url(r'^robots.txt*$', 'analytics.views.view_analytics_dashboard'),

    #User,Auth,User Info
    url(r'^signup/*', 'timetable.views.launch_user_acq_modal'),
    url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
    url(r'^user/save_timetable/$', 'student.views.save_timetable'),
    url(r'^user/duplicate_timetable/$', 'student.views.duplicate_timetable'),
    url(r'^user/delete_timetable/$', 'student.views.delete_timetable'),
    url(r'^user/save_settings/$', 'student.views.save_settings'),
    url(r'^user/get_classmates/$', 'student.views.get_classmates'),
    #TODO WILL CREATE A GET CLASSMATES_COUNT ENDPOINT
    url(r'^user/get_most_classmates_count/$', 'student.views.get_most_classmate_count'),
    url(r'^user/find_friends/*$', 'student.views.find_friends'),
    url(r'^callback/google_calendar/*$', 'timetable.views.google_calendar_callback'),
    url(r'^textbooks*$', 'timetable.views.view_textbooks'),
    url(r'^export_calendar/*$', 'timetable.views.export_calendar'),
    url(r'^notifyme/*$', 'timetable.views.enable_notifs'),
    url(r'^user/get_saved_timetables/(?P<school>.+)/(?P<sem_name>.+)/(?P<year>[0-9]{4})', 'student.views.get_student_tts_wrapper'),
    url(r'^user/add_to_gcal/*$', 'student.views.add_tt_to_gcal'),
    url(r'^user/log_ical/*$', 'student.views.log_ical_export'),
    url(r'^user/log_final_exam/*$', 'timetable.views.log_final_exam_view'),
    url(r'^user/log_fb_alert_click/*$', 'analytics.views.log_facebook_alert_click'),
    url(r'^user/log_fb_alert_view/*$', 'analytics.views.log_facebook_alert_view'),

    
    url(r'^courses/(?P<school>.+?)/code/(?P<course_id>.+)/*$', 'timetable.views.get_course_id'),
    url(r'^courses/(?P<school>.+?)/(?P<sem_name>.+)/(?P<year>[0-9]{4})/id/(?P<id>[0-9]+)/*$', 'timetable.views.get_course'),
    url(r'^jhu/countdown/*$', 'timetable.views.jhu_timer'),
    url(r'^get_timetables/$', 'timetable.views.get_timetables'),
    url(r'^search/(?P<school>.+?)/(?P<sem_name>.+?)/(?P<year>[0-9]{4})/(?P<query>.+?)/', 'timetable.views.course_search'),
    url(r'^advanced_search/', 'timetable.views.advanced_course_search'),
    url(r'^school_info/(?P<school>.+?)/', 'timetable.views.school_info'),
    url(r'react/*', 'student.views.react_to_course'),
    
    # course pages and course listings
    url(r'c/(?P<code>.+?)$', 'timetable.views.course_page'),
    url(r'courses/*', 'timetable.views.all_courses'),
    # about page
    url(r'about/*', 'timetable.views.about'),

    # press page
    url(r'press/*', 'timetable.views.press'),

    # Automatic deployment endpoint
    url(r'deploy_staging/', 'semesterly.views.deploy_staging'),

    # profile page
    url(r'me/*', 'timetable.views.profile'),
    
    url(r'^unsubscribe/(?P<id>[\w.@+-]+)/(?P<token>[\w.:\-_=]+)/$', 'student.views.unsubscribe'),

    url(r'^setRegistrationToken/', 'student.views.set_registration_token'),
    url(r'^deleteRegistrationToken/', 'student.views.delete_registration_token'),
    url(r'^sw(.*.js)$', 'timetable.views.sw_js', name='sw_js'),
    url(r'^manifest(.*.json)$', 'timetable.views.manifest_json', name='manifest_json'),

    # Integration
    url(r'^integration/get/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/', 'timetable.views.get_integration'),
    url(r'^integration/del/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/', 'timetable.views.delete_integration'),    
    url(r'^integration/add/(?P<integration_id>.+?)/course/(?P<course_id>.+?)/', 'timetable.views.add_integration'),

    # for testing 404, so i don't have to turn off debug
	url(r'^404testing/', 'timetable.views.custom_404'),
    url(r'^500testing/', 'timetable.views.custom_500'),

    # final exam scheduler
    (r'^get_final_exams/*$', 'timetable.views.final_exam_scheduler'),
    url(r'^final_exams/*$', 'timetable.views.view_final_exams'),
)

if getattr(settings, 'STAGING', False):
    urlpatterns += patterns('', url(r'^robots.txt$', lambda r: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain")) )
else:
    urlpatterns += patterns('', url(r'^robots.txt$', lambda r: HttpResponse("User-agent: *\nDisallow:", content_type="text/plain")) )
