import sys, traceback, django, os, base64
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import requests, json, argparse
from timetable.models import *
from student.models import *
from pprint import pprint
from pywebpush import WebPusher

FCM_KEY = "AIzaSyAtyW5t0ApWhz_neMTQp48OkFphLyA8A5g"
FCM_URL = "https://fcm.googleapis.com/fcm/send"  

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--school', dest='school', default=None, help='the school to send the message to')
parser.add_argument('--message', dest='message', help='the school to send the message to')
parser.add_argument('--title', dest='title', help='the school to send the message to', default="Semester.ly")

args = parser.parse_args()

if not args.message: 
	print "Please provide a message"
	exit()
else:
	print "\nMessage: " + args.message
	print "Title: " + args.title

if not args.school:
	print "Sending to all schools"
	students = Student.objects.all()
else:
	students = Student.objects.filter(personaltimetable__courses__school=args.school).distinct() | Student.objects.filter(school=args.school).distinct()
	print "Sending to <" + args.school + "> student(s)"
tokens = RegistrationToken.objects.filter(student__in=students)
print "This will send to ", tokens.count(), "device(s)"

confirmation = raw_input("Would you like to send?  (Y/n)")
if confirmation.lower() != "y":
	print "Quitting...\n"
	exit()

for token in tokens:
	subscription_info = {"endpoint":"https://android.googleapis.com/gcm/send/fuKkKlzSEEE:APA91bFKiuJ3LEx7Ke3xOEJ…Lx-t8INikH97ewASUn6OSzRAGeGf8Eu1B5Q7Lju_7QBj5VeGjwCePUufhiSzFXqEogaJ4esAqA","keys":{"p256dh":token.p256dh,"auth":token.auth}}
	data = '{"data": {"message":"'  + args.message + '","title":"' + args.title + '"}}'
	encoded = WebPusher(subscription_info).encode(data)
	crypto_key = "dh=" + encoded["crypto_key"]
	salt = "salt=" + encoded['salt']
	headers = {'Authorization': 'key=' + FCM_KEY, 'Content-Type': 'application/json', }
	headers.update({'crypto-key': crypto_key, 'content-encoding': 'aesgcm', 'encryption': salt})    
	fcm_data = {"raw_data": base64.b64encode(encoded.get('body')), "registration_ids": [token.endpoint[40:]]}
	resp = requests.post(FCM_URL, data=json.dumps(fcm_data), headers=headers)
