from django.conf.urls import patterns, include, url
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin
from dashing.utils import router

from analytics.widgets import NumberTimetablesWidget
from analytics.widgets import NumberCalendarExportsWidget

# Note: for some reason, we cannot register long names for our dashing router.
#       For example, 'nt_widget' works, for 'number_timetables_widget' does
#       not. In the future, perhaps we can look into this.
router.register(NumberTimetablesWidget, 'nt_widget')
router.register(NumberCalendarExportsWidget, 'nce_widget')

admin.autodiscover()

# custom 404 page
handler404 = 'timetable.views.custom_404'
# custom 500 page
handler500 = 'timetable.views.custom_500'

# for sorting search results by course code
# sqs = SearchQuerySet().order_by('code')

urlpatterns = patterns('',
                       # url(r'^admin/', include(admin.site.urls)),

                           #finding friends
    url('', include('social.apps.django_app.urls', namespace='social')),
                       url('', include('django.contrib.auth.urls', namespace='auth')),

    # app urls
    url('', include('timetable.urls')),
                       url('', include('courses.urls')),
                       url('', include('integrations.urls')),
                       url('', include('exams.urls')),
                       url('', include('searches.urls')),
                       url('', include('student.urls')),
                       url('', include('analytics.urls')),

                       # home
                       url(r'^$', 'timetable.views.view_timetable'),

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
                       )

    # final exam scheduler
    (r'^get_final_exams/*$', 'timetable.views.final_exam_scheduler'),
    url(r'^final_exams/*$', 'timetable.views.view_final_exams'),

    # dashboard
    url(r'^dashboard/', include(router.urls), name='dashboard'),
)

# profiling
urlpatterns += [url(r'^silk/', include('silk.urls', namespace='silk'))]

if getattr(settings, 'STAGING', False):
    urlpatterns += patterns('', url(r'^robots.txt$',
                                    lambda r: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain")))
else:
    urlpatterns += patterns('', url(r'^robots.txt$',
                                    lambda r: HttpResponse("User-agent: *\nDisallow:", content_type="text/plain")))
