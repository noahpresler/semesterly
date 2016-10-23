import sys, traceback, django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import requests, json, argparse
from timetable.models import *
from student.models import *

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--school', dest='school', default=None, help='the school to send the message to')
parser.add_argument('--message', dest='message', help='the school to send the message to')
args = parser.parse_args()

if not args.message: 
	print "Please provide a message"
	exit()
else:
	print "\nMessage: " + args.message

if not args.school:
	print "Sending to all schools"
	students = Student.objects.all()
else:
	students = Student.objects.filter(personaltimetable__courses__school=args.school).distinct() | Student.objects.filter(school=args.school).distinct()
	print "Sending to <" + args.school + "> student(s)"
tokens = RegistrationToken.objects.filter(student__in=students)
tokens = map(lambda t: t.token, tokens)
print "This will send to ", len(tokens), "device(s)"
tokens = '[' + ','.join('"{0}"'.format(w) for w in tokens) + ']'

confirmation = raw_input("Would you like to send?  (Y/n)")
if confirmation.lower() != "y":
	print "Quitting...\n"
	exit()

headers = {
	'Content-Type': "application/json",
	'Authorization': "key=AIzaSyAtyW5t0ApWhz_neMTQp48OkFphLyA8A5g",
}
data = '{"registration_ids":' + str(tokens) + ',"notification":{"title":"' + str(args.message) + '"}}'

r = requests.post('https://android.googleapis.com/gcm/send', headers=headers, data=data)
response = json.loads(r.text)
print "\nSuccesses ", response['success']
print "Failures ", response['failure']
# print "Results", response['results']