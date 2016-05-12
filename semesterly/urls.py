from django.conf.urls import patterns, include, url

from django.contrib import admin

# from haystack.views import SearchView

# from haystack.query import SearchQuerySet

admin.autodiscover()

# custom 404 page
handler404 = 'timetable.views.custom_404'

	# for sorting search results by course code
	# sqs = SearchQuerySet().order_by('code')

urlpatterns = patterns('',
	# url(r'^admin/', include(admin.site.urls)),
	url('', include('social.apps.django_app.urls', namespace='social')),
	url('', include('django.contrib.auth.urls', namespace='auth')),
	url(r'^complete/facebook/.*$', 'timetable.views.view_timetable'),
	url(r'^$', 'timetable.views.view_timetable'),

	# index
	url(r'^timetable/*$', 'timetable.views.redirect_to_home'),
	url(r'^timetable/.+$', 'timetable.views.redirect_to_home'),

	url(r'^exit/*$', 'analytics.views.handle_exit'),

	url(r'^analytics/*$', 'analytics.views.view_analytics_dashboard'),
	url(r'^analytics/get_num_generated$', 'analytics.views.get_num_generated'),

	url(r'^analytics_data/*$', 'analytics.views.get_analytics_data'),
	url(r'^timetable_data/*$', 'analytics.views.get_timetable_data'),

	#User,Auth,User Info
	url(r'^user/info.+$', 'student.views.get_user'),
	url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
	url(r'^user/save_timetable/$', 'student.views.save_timetable'),
	url(r'^user/save_settings/$', 'student.views.save_settings'),
	url(r'^user/get_classmates/$', 'student.views.get_classmates'),

	url(r'^live_user_data/*$', 'analytics.views.get_live_user_data'),
	url(r'^courses/(?P<school>.+?)/(?P<sem>[fFsS]{1}?)/code/(?P<course_id>.+)/*$', 'timetable.views.get_course_id'),
	url(r'^reason/*$', 'analytics.views.verify_password'),
	url(r'^jhu/countdown/*$', 'timetable.views.jhu_timer'),
	url(r'^courses/(?P<school>.+?)/(?P<sem>[fFsS]{1}?)/*$', 'timetable.views.get_courses'),
	url(r'^courses/(?P<school>.+?)/(?P<sem>[fFsS]{1}?)/id/(?P<id>[0-9]+)/*$', 'timetable.views.get_course'),
	url(r'^$', 'timetable.views.view_timetable'),
	url(r'^get_timetables/$', 'timetable.views.get_timetables'),

	url(r'search/(?P<school>.+?)/(?P<sem>.+?)/(?P<query>.+?)/', 'timetable.views.course_search'),
	url(r'c/(?P<code>.+?)$', 'timetable.views.course_page')
)
