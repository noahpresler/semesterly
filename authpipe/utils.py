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
import urllib.request, urllib.error, urllib.parse

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from hashids import Hashids

from student.models import Student
from semesterly.settings import get_secret

hashids = Hashids(salt=get_secret('HASHING_SALT'))


def check_student_token(student, token):
    """
    Validates a token: checks that it is at most 2 days old and that it
    matches the currently authenticated student.
    """
    try:
        key = '%s:%s' % (student.id, token)
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
    try:
        email = kwargs['details']['email']
        kwargs['user'] = User.objects.get(email=email)
    except BaseException:
        pass
    try:
        token = strategy.session_get('student_token')
        ref = strategy.session_get('login_hash')
        student = Student.objects.get(id=hashids.decrypt(ref)[0])
        if check_student_token(student, token):
            kwargs['user'] = student.user
    except BaseException:
        pass
    return kwargs


def create_student(strategy, details, response, user, *args, **kwargs):
    """
    Part of the Python Social Auth pipeline which creates a student upon
    signup. If student already exists, updates information from Facebook
    or Google (depending on the backend).
    Saves friends and other information to fill database.
    """
    backend_name = kwargs['backend'].name
    if Student.objects.filter(user=user).exists():
        new_student = Student.objects.get(user=user)
    else:
        new_student = Student(user=user)
        new_student.save()
    social_user = user.social_auth.filter(
        provider=backend_name,
    ).first()

    if backend_name == 'google-oauth2' and not user.social_auth.filter(
            provider='facebook').exists():
        try:
            access_token = social_user.extra_data["access_token"]
        except TypeError:
            access_token = json.loads(social_user.extra_data)["access_token"]
        response = requests.get(
            'https://www.googleapis.com/userinfo/v2/me'.format(
                social_user.uid,
                get_secret('GOOGLE_API_KEY')),
            params={'access_token': access_token}
        )
        new_student.img_url = response.json()['picture']
        new_student.save()

    elif backend_name == 'facebook':

        try:
            access_token = social_user.extra_data["access_token"]
        except TypeError:
            access_token = json.loads(social_user.extra_data)["access_token"]

        if social_user:
            new_student.img_url = 'https://graph.facebook.com/v9.0/' + social_user.uid + '/picture?type=normal'
            url = 'https://graph.facebook.com/v9.0/{0}/' \
                  '&access_token={1}'.format(
                      social_user.uid,
                      access_token,
                  )
            request = urllib.request.Request(url)
            new_student.fbook_uid = social_user.uid
            new_student.save()
            url = 'https://graph.facebook.com/{0}/' \
                  'friends?fields=id' \
                  '&access_token={1}'.format(
                      social_user.uid,
                      access_token,
                  )
            request = urllib.request.Request(url)
            friends = json.loads(urllib.request.urlopen(request).read().decode('utf-8')).get('data')

            for friend in friends:
                if Student.objects.filter(fbook_uid=friend['id']).exists():
                    friend_student = Student.objects.get(
                        fbook_uid=friend['id'])
                    if not new_student.friends.filter(
                            user=friend_student.user).exists():
                        new_student.friends.add(friend_student)
                        new_student.save()
                        friend_student.save()

    return kwargs
    