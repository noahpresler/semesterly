from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.context_processors import csrf
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
import hashlib, hmac, json, pprint, os, subprocess

# Compare the HMAC hash signature
def verify_hmac_hash(request):
    SECRET_TOKEN = getattr(settings, 'SECRET_TOKEN', False)
    signature = request.META.get('HTTP_X_HUB_SIGNATURE')
    computed_signature = 'sha1=' + hmac.new(SECRET_TOKEN, request.body, hashlib.sha1).hexdigest()
    return signature == computed_signature
 
@csrf_exempt
def deploy_staging(request):

    if not getattr(settings, 'SECRET_TOKEN', False) or not getattr(settings, 'STAGING', False):
        return HttpResponse("Invalid URL", status=404)

    if verify_hmac_hash(request):
        event_type = request.META.get('HTTP_X_GITHUB_EVENT')
        if event_type == "ping":
            return HttpResponse("ok", status=200)
        elif event_type == "push":
            body = json.loads(request.body)
            commit = body['commits'][0]
            email_info = {
                'sender_name': commit['committer']['name'],
                'commit_hash': commit['id'],
                'time': commit['timestamp'],
                'compare_link': body['compare'],
            }
            send_mail("Staging Server Being Updated", pprint.pformat(email_info, indent=4), 
                            "semesterly.contact@gmail.com", ["rohan@semester.ly"])
            return_code = subprocess.call(getattr(settings, 'DEPLOY_COMMAND', ""), shell=True)

            return HttpResponse(status=200)
        else:
            return HttpResponse(status=403)

    else:
        raise Http404
