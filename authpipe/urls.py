from django.conf.urls import include, patterns, url
from django.contrib import admin

import authpipe.views


admin.autodiscover()

urlpatterns = patterns('',
                       # auth
                       url('', include('social.apps.django_app.urls', namespace='social')),
                       url('', include('django.contrib.auth.urls', namespace='auth')),

                       # device token registration
                       url(r'^setRegistrationToken/', authpipe.views.set_registration_token),
                       url(r'^deleteRegistrationToken/', authpipe.views.delete_registration_token),

                       # device token registration api
                       url(r'^registration-token/$', authpipe.views.RegistrationTokenView.as_view()),
                       url(r'^registration-token/(?P<endpoint>.+?)/', authpipe.views.RegistrationTokenView.as_view())
                       )
