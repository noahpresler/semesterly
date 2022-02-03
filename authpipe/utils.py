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

import json
from urllib.request import Request, urlopen
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from hashids import Hashids

from student.models import Student
from semesterly.settings import get_secret

hashids = Hashids(salt=get_secret("HASHING_SALT"))


def check_student_token(student, token):
    """
    Validates a token: checks that it is at most 2 days old and that it
    matches the currently authenticated student.
    """
    try:
        key = "%s:%s" % (student.id, token)
        TimestampSigner().unsign(key, max_age=60 * 60 * 48)  # Valid for 2 days
    except (BadSignature, SignatureExpired):
        return False
    return True


def associate_students(strategy, details, response, user, *args, **kwargs):
    """
    Part of our custom Python Social Auth authentication pipeline. If a user
    already has an account associated with an email, associates that user with
    the new backend.
    """
    try_associate_email(**kwargs)
    try_associate_jhed(response, **kwargs)
    try_associate_token(strategy, **kwargs)
    return kwargs


def try_associate_email(**kwargs):
    try:
        email = kwargs["details"]["email"]
        kwargs["user"] = User.objects.get(email=email)
    except BaseException:
        pass


def try_associate_jhed(response, **kwargs):
    try:
        jhed = response["unique_name"]
        student = Student.objects.get(jhed=jhed)
        kwargs["user"] = student.user
    except BaseException:
        pass


def try_associate_token(strategy, **kwargs):
    try:
        token = strategy.session_get("student_token")
        ref = strategy.session_get("login_hash")
        student = Student.objects.get(id=hashids.decrypt(ref)[0])
        if check_student_token(student, token):
            kwargs["user"] = student.user
    except BaseException:
        pass


def create_student(strategy, details, response, user, *args, **kwargs):
    """
    Part of the Python Social Auth pipeline which creates a student upon
    signup. If student already exists, updates information from Facebook
    or Google (depending on the backend).
    Saves friends and other information to fill database.
    """
    backend_name = kwargs["backend"].name
    student, _ = Student.objects.get_or_create(user=user)
    social_user = user.social_auth.filter(provider=backend_name).first()
    hasFacebook = user.social_auth.filter(provider="facebook").exists()
    if backend_name == "facebook":
        update_student_facebook(student, social_user)
    elif backend_name == "azuread-tenant-oauth2":
        update_student_jhed(student, response)
    elif backend_name == "google-oauth2":
        update_student_google(student, social_user, hasFacebook)
    student.save()
    return kwargs


def update_student_facebook(student, social_user):
    try:
        access_token = social_user.extra_data["access_token"]
    except TypeError:
        access_token = json.loads(social_user.extra_data)["access_token"]

    student.img_url = (
        f"https://graph.facebook.com/v9.0/{social_user.uid}/picture?type=normal"
    )
    student.fbook_uid = social_user.uid
    friends = get_facebook_friends(social_user, access_token)
    update_facebook_friends(student, friends)


def get_facebook_friends(social_user, access_token):
    url = (
        f"https://graph.facebook.com/{social_user.uid}"
        f"/friends?fields=id&access_token={access_token}"
    )
    request = Request(url)
    return json.loads(urlopen(request).read().decode("utf-8")).get("data")


def update_facebook_friends(student, friends):
    for friend in friends:
        if Student.objects.filter(fbook_uid=friend["id"]).exists():
            friend_student = Student.objects.get(fbook_uid=friend["id"])
            if not student.friends.filter(user=friend_student.user).exists():
                student.friends.add(friend_student)
                friend_student.save()


def update_student_jhed(student, response):
    student.jhed = response["unique_name"]
    student.preferred_name = response["name"]


def update_student_google(student, social_user, hasFacebook):
    try:
        access_token = social_user.extra_data["access_token"]
    except TypeError:
        access_token = json.loads(social_user.extra_data)["access_token"]
    # prioritize facebook picture if available
    if not hasFacebook:
        set_img_url_google(student, social_user, access_token)


def set_img_url_google(student, social_user, access_token):
    response = requests.get(
        "https://www.googleapis.com/userinfo/v2/me".format(
            social_user.uid, get_secret("GOOGLE_API_KEY")
        ),
        params={"access_token": access_token},
    )
    student.img_url = response.json()["picture"]
