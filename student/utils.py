from social import *
from student.models import *
import urllib2, json, pprint
from django.conf import settings
from django.db import models


def create_student(strategy, details, response, user, *args, **kwargs):
    if Student.objects.filter(user=user).exists():
    	new_student = Student.objects.get(user=user)
    else:
        new_student = Student(user=user)
        new_student.save()
    social_user = user.social_auth.filter(
        provider='facebook',
    ).first()
    if social_user:
        url = u'https://graph.facebook.com/{0}/' \
              u'?fields=picture&type=large' \
              u'&access_token={1}'.format(
                  social_user.uid,
                  social_user.extra_data['access_token'],
              )
        request = urllib2.Request(url)
        data = json.loads(urllib2.urlopen(request).read())
        new_student.img_url = data['picture']['data']['url']
        new_student.save()
        url = u'https://graph.facebook.com/{0}/' \
              u'friends?fields=id' \
              u'&access_token={1}'.format(
                  social_user.uid,
                  social_user.extra_data['access_token'],
              )
        request = urllib2.Request(url)
        friends = json.loads(urllib2.urlopen(request).read()).get('data')
        
        #TODO: how can I query Student by where has USER which has social user with uid?
        for friend in friends:
        	freind_student = Student.objects.filter(user__social_auth_user__uid="facebook_uid_here")
        	if not new_student.friends.filter(user=friend_student.user):
        		new_student.friends.add(friend_student)

    return kwargs