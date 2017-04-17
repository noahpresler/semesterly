from django.conf.urls import include, patterns, url
from django.contrib import admin

import student.views

admin.autodiscover()

urlpatterns = patterns('',
                       # auth
                       url('', include('social.apps.django_app.urls', namespace='social')),
                       url('', include('django.contrib.auth.urls', namespace='auth')),

                       # registration
                       url(r'^setRegistrationToken/', student.views.set_registration_token),
                       url(r'^deleteRegistrationToken/', student.views.delete_registration_token),
                       )
