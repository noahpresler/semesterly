from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.context_processors import csrf
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import hashlib, hmac, json, os, subprocess


# Compare the HMAC hash signature
def verify_hmac_hash(data, signature):
    SECRET_TOKEN = bytes(os.environ.get('SECRET_TOKEN'), 'UTF-8')
    mac = hmac.new(SECRET_TOKEN, msg=data, digestmod=hashlib.sha1)
    return hmac.compare_digest('sha1=' + mac.hexdigest(), signature)
 

@csrf_exempt
def deploy_staging(request):

    if not os.environ.get('SECRET_TOKEN') or not getattr(settings, 'STAGING', False):
        return HttpResponse("Invalid URL", status=404)

    signature = request.META['X-Hub-Signature']
    data = request.DATA
    if verify_hmac_hash(data, signature):
        event_type = request.META['X-Github-Event']
        if event_type == "ping":
            return HttpResponse("ok")
        elif event_type == "push":
            return HttpResponse("push")

    else:
        raise Http404
