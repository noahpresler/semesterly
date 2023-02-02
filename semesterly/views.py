# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template.context_processors import csrf
from django.template.loader import get_template
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
import datetime, hashlib, hmac, json, pprint, os, subprocess


@csrf_exempt
def deploy_staging(request):
    if not getattr(settings, "SECRET_TOKEN", False) or not getattr(
        settings, "STAGING", False
    ):
        return HttpResponse("Invalid URL", status=404)
    if not verify_hmac_hash(request):
        raise Http404

    event_type = request.META.get("HTTP_X_GITHUB_EVENT")
    if event_type == "ping":
        return HttpResponse("ok", status=200)

    elif event_type == "push":
        body = json.loads(request.body)
        ref = body["ref"]
        email_info = {"ref": ref, "link": body["compare"]}
        try:
            commit = body["commits"][0]
            set_commit_info(email_info, commit)
        except IndexError:
            set_merge_info(body, email_info)

        branch_name = ref.split("/")[-1]
        if branch_name != "staging":
            default_send_email(
                "Semester.ly Branch: " + branch_name + " Updated",
                pprint.pformat(email_info, indent=4),
            )
            return HttpResponse("200")

        default_send_email(
            "Semester.ly Staging Server Being Updated",
            pprint.pformat(email_info, indent=4),
        )
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=403)


def set_commit_info(email_info, commit):
    email_info.update(
        {
            "type": "Commit",
            "sender_username": commit["committer"]["username"],
            "commit_hash": commit["id"],
            "commit_link": commit["url"],
            "time": commit["timestamp"],
        }
    )


def set_merge_info(body, email_info):
    email_info.update(
        {
            "type": "Merge [?]",
            "sender_username": body["sender"]["login"],
            "time": str(datetime.datetime.now()),
        }
    )


# Compare the HMAC hash signature
def verify_hmac_hash(request):
    SECRET_TOKEN = getattr(settings, "SECRET_TOKEN", False)
    signature = request.META.get("HTTP_X_HUB_SIGNATURE")
    computed_signature = (
        "sha1=" + hmac.new(SECRET_TOKEN, request.body, hashlib.sha1).hexdigest()
    )
    return signature == computed_signature


def default_send_email(subject, message):
    send_mail(
        subject,
        message,
        getattr(settings, "DEFAULT_FROM_EMAIL"),
        getattr(settings, "STAGING_NOTIFIED_ADMINS"),
    )


def manifest_json(request, js):
    template = get_template("manifest.json")
    html = template.render()
    return HttpResponse(html, content_type="application/json")
