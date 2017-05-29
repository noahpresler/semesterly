from django.conf.urls import patterns, url
from django.contrib import admin
from django.views.generic import TemplateView


admin.autodiscover()

urlpatterns = patterns('',
                       url(r'termsofservice/*$',
                           TemplateView.as_view(template_name="termsofservice.html")),
                       url(r'privacypolicy/*$',
                           TemplateView.as_view(template_name="privacypolicy.html")),
                       )
