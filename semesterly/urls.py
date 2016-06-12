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
	# home
	url(r'^$', 'timetable.views.view_timetable'),
	# sharing course
	url(r'course/(?P<code>.+?)/(?P<sem>[fFsS]{1}?)/*$', 'timetable.views.view_timetable'),
	# request sharing timetable link
	url(r'share/link/*$', 'timetable.views.create_share_link'),
	# view shared timetable 
	url(r'share/(?P<ref>.+)/*$', 'timetable.views.share_timetable'),
	# index
	url(r'^timetable/*$', 'timetable.views.redirect_to_home'),
	url(r'^timetable/.+$', 'timetable.views.redirect_to_home'),

	#User,Auth,User Info
	url(r'^user/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
	url(r'^user/save_timetable/$', 'student.views.save_timetable'),
	url(r'^user/save_settings/$', 'student.views.save_settings'),
	url(r'^user/get_classmates/$', 'student.views.get_classmates'),
	url(r'^user/get_saved_timetables/(?P<school>.+)/(?P<sem>[fFsS]{1})', 'student.views.get_student_tts_wrapper'),
	url(r'^courses/(?P<school>.+?)/(?P<sem>[fFsS]{1}?)/code/(?P<course_id>.+)/*$', 'timetable.views.get_course_id'),
	url(r'^jhu/countdown/*$', 'timetable.views.jhu_timer'),
	url(r'^courses/(?P<school>.+?)/(?P<sem>[fFsS]{1}?)/id/(?P<id>[0-9]+)/*$', 'timetable.views.get_course'),
	url(r'^get_timetables/$', 'timetable.views.get_timetables'),
	url(r'^search/(?P<school>.+?)/(?P<sem>.+?)/(?P<query>.+?)/', 'timetable.views.course_search'),
	url(r'^advanced_search/', 'timetable.views.advanced_course_search'),
	url(r'^school_info/(?P<school>.+?)/', 'timetable.views.school_info'),
	url(r'c/(?P<code>.+?)$', 'timetable.views.course_page'),
	url(r'react/', 'student.views.react_to_course'),
	# Automatic deployment endpoint
	url(r'deploy_staging/', 'semesterly.views.deploy_staging'),
)
