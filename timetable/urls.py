from django.conf.urls import patterns, url
from django.contrib import admin

import timetable.views
from timetable.utils import FeatureFlowView

admin.autodiscover()

urlpatterns = patterns('',
                       # TODO: remove unused endpoint or use TemplateView instead
                       url(r'^jhu/countdown/*$', timetable.views.jhu_timer),

                       # feature flows
                       url(r'^signin/*$',
                           FeatureFlowView.as_view(feature_name='USER_ACQ')),
                       url(r'^signup/*$',
                           FeatureFlowView.as_view(feature_name='SIGNUP')),
                       url(r'^textbooks/*$',
                           FeatureFlowView.as_view(feature_name='VIEW_TEXTBOOKS')),
                       url(r'^export_calendar/*$',
                           FeatureFlowView.as_view(feature_name='EXPORT_CALENDAR')),
                       url(r'^notifyme/*$',
                           FeatureFlowView.as_view(feature_name='ENABLE_NOTIFS')),
                       url(r'^find_friends/$',
                           FeatureFlowView.as_view(feature_name='FIND_FRIENDS')),
                       url(r'^callback/google_calendar/*$',
                           FeatureFlowView.as_view(feature_name='GCAL_CALLBACK')),

                       # TODO: move to analytics
                       url(r'^user/log_final_exam/*$', timetable.views.log_final_exam_view),

                       # redirects
                       url(r'^timetable/*$', timetable.views.redirect_to_home),
                       url(r'^timetable/.+$', timetable.views.redirect_to_home),
                       url(r'^complete/facebook/.*$', FeatureFlowView.as_view()),

                       # timetables
                       url(r'^timetables/?$', timetable.views.TimetableView.as_view()),

                       # sharing
                       url(r'^timetables/links/$', timetable.views.TimetableLinkView.as_view()),
                       url(r'^timetables/links/(?P<slug>.+)/$',
                           timetable.views.TimetableLinkView.as_view()),

                       # maintain backwards compatibility TODO: change to redirect
                       url(r'share/(?P<slug>.+)/*$', timetable.views.TimetableLinkView.as_view())
                       )
