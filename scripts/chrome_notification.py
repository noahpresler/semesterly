import os

import base64
import requests
import json

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from student.models import *
from pprint import pprint
from pywebpush import WebPusher
from utils import all_students_with_timetables

class ChromeNotification(object):
    def __init__(self, school, semester):
        self.FCM_KEY = "AIzaSyAtyW5t0ApWhz_neMTQp48OkFphLyA8A5g"
        self.FCM_URL = "https://fcm.googleapis.com/fcm/send"
        self.school = school
        self.semester = semester

    def send_message(self, message, title, test_students):
        students = []
        if test_students:
            students = Student.object.filter(pk__in=test_students)
        else:
            students = Student.object.filter(pk__in=all_students_with_timetables(self.school, self.semester))
        print "Sending to <" + self.school + "> student(s)"
        tokens = RegistrationToken.objects.filter(student__in=students)
        print "This will send to ", tokens.count(), "device(s)"

        confirmation = raw_input("Would you like to send?  (Y/n)")
        if confirmation.lower() != "y":
            print "Quitting...\n"
            exit()

        for token in tokens:
            subscription_info = {"endpoint":"https://android.googleapis.com/gcm/send/fuKkKlzSEEE:APA91bFKiuJ3LEx7Ke3xOEJ…Lx-t8INikH97ewASUn6OSzRAGeGf8Eu1B5Q7Lju_7QBj5VeGjwCePUufhiSzFXqEogaJ4esAqA","keys":{"p256dh":token.p256dh,"auth":token.auth}}
            data = '{"data": {"message":"'  + self.message + '","title":"' + self.title + '"}}'
            encoded = WebPusher(subscription_info).encode(data)
            crypto_key = "dh=" + encoded["crypto_key"]
            salt = "salt=" + encoded['salt']
            headers = {'Authorization': 'key=' + self.FCM_KEY, 'Content-Type': 'application/json', }
            headers.update({'crypto-key': crypto_key, 'content-encoding': 'aesgcm', 'encryption': salt})    
            fcm_data = {"raw_data": base64.b64encode(encoded.get('body')), "registration_ids": [token.endpoint[40:]]}
            resp = requests.post(self.FCM_URL, data=json.dumps(fcm_data), headers=headers)
