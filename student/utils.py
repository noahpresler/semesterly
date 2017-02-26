from social import *
from student.models import *
import urllib2, json, pprint, datetime
from django.conf import settings
from django.db import models
import json, requests, httplib2
from googleapiclient import discovery
from oauth2client import client
from oauth2client import tools
from oauth2client.file import Storage
from hashids import Hashids
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from googleapiclient.discovery import build
from oauth2client.client import GoogleCredentials


DAY_LIST = ['M','T','W','R','F','S','U'];
hashids = Hashids(salt="***REMOVED***")

def get_google_credentials(student):
  social_user = student.user.social_auth.filter(
      provider='google-oauth2',
  ).first()
  try:
      access_token = social_user.extra_data["access_token"]
      expires_at = social_user.extra_data["expires"]
      refresh_token = social_user.extra_data.get("refresh_token",None)
  except TypeError:
    access_token = json.loads(social_user.extra_data)["access_token"]
    refresh_token = json.loads(social_user.extra_data)["refresh_token"]
    expires_at = json.loads(social_user.extra_data)["expires"]
  return GoogleCredentials(access_token,settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,refresh_token,expires_at,"https://accounts.google.com/o/oauth2/token",'my-user-agent/1.0')

def check_student_token(student, token):
  try:
    key = '%s:%s' % (student.id, token)
    TimestampSigner().unsign(key, max_age=60 * 60 * 48) # Valid for 2 days
  except (BadSignature, SignatureExpired):
    return False
  return True

def associate_students(strategy, details, response, user, *args, **kwargs):
    try:
        email = kwargs['details']['email']
        kwargs['user'] = User.objects.get(email=email)
    except:
        pass
    try: 
        token = strategy.session_get('student_token')
        ref = strategy.session_get('login_hash')
        student = Student.objects.get(id=hashids.decrypt(ref)[0])
        if check_student_token(student,token):
          kwargs['user'] = student.user
    except: 
      pass
    return kwargs

def next_weekday(d, weekday):
    weekday = DAY_LIST.index(weekday)
    today = datetime.datetime.today()
    delta = weekday - today.weekday()
    week = 1 if delta < 0 else 1
    return today + datetime.timedelta(days=delta, weeks=week)

def last_weekday(d, weekday):
    weekday = DAY_LIST.index(weekday)
    today = datetime.datetime.today()
    if today.weekday() == weekday:
      return today
    return today - datetime.timedelta(days=today.weekday())

def create_student(strategy, details, response, user, *args, **kwargs):
    backend_name = kwargs['backend'].name
    if Student.objects.filter(user=user).exists():
    	new_student = Student.objects.get(user=user)
    else:
        new_student = Student(user=user)
        new_student.save()
    social_user = user.social_auth.filter(
        provider=backend_name,
    ).first()

    if backend_name == 'google-oauth2' and not user.social_auth.filter(provider='facebook').exists():
      try:
        access_token = social_user.extra_data["access_token"]
      except TypeError:
        access_token = json.loads(social_user.extra_data)["access_token"]
      response = requests.get(
          'https://www.googleapis.com/plus/v1/people/me'.format(
            social_user.uid,
            settings.GOOGLE_API_KEY),
          params={'access_token': access_token}
      )
      new_student.img_url = response.json()['image'].get('url','')
      new_student.gender = response.json().get('gender','')
      new_student.save()

    elif backend_name == 'facebook':

      try:
        access_token = social_user.extra_data["access_token"]
      except TypeError:
        access_token = json.loads(social_user.extra_data)["access_token"]

      if social_user:
          url = u'https://graph.facebook.com/{0}/' \
                u'?fields=picture&type=large' \
                u'&access_token={1}'.format(
                    social_user.uid,
                    access_token,
                )
          request = urllib2.Request(url)
          data = json.loads(urllib2.urlopen(request).read())
          new_student.img_url = data['picture']['data']['url']
          url = u'https://graph.facebook.com/{0}/' \
                u'?fields=gender' \
                u'&access_token={1}'.format(
                    social_user.uid,
                    access_token,
                )
          request = urllib2.Request(url)
          data = json.loads(urllib2.urlopen(request).read())
          try:
            new_student.gender = data.get('gender','')
          except:
            pass
          new_student.fbook_uid = social_user.uid
          new_student.save()
          url = u'https://graph.facebook.com/{0}/' \
                u'friends?fields=id' \
                u'&access_token={1}'.format(
                    social_user.uid,
                    access_token,
                )
          request = urllib2.Request(url)
          friends = json.loads(urllib2.urlopen(request).read()).get('data')
          
          for friend in friends:
            if Student.objects.filter(fbook_uid=friend['id']).exists():
              friend_student = Student.objects.get(fbook_uid=friend['id'])
              if not new_student.friends.filter(user=friend_student.user).exists():
                new_student.friends.add(friend_student)
                new_student.save()
                friend_student.save()

    return kwargs
    