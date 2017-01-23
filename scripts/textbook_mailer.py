import django, os, json
import traceback
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import smtplib
from email.mime.text import MIMEText
from django.template.loader import render_to_string
from student.models import *
from student.views import create_unsubscribe_link
from timetable.models import *
from django.db.models import Q
from django.forms.models import model_to_dict

if len(sys.argv) < 2:
    print("Please specify a school.")
    exit(0)
school = sys.argv[1]

students = PersonalTimetable.objects.filter(school=school, semester='S').values_list("student", flat=True).distinct()

# Create server object with SSL option
server = smtplib.SMTP_SSL('email-smtp.us-east-1.amazonaws.com')
server.login('AKIAJWXCNDO3CMYAIC6A', 'AonOaLbp9FjBkyhP9ihHBge92CEqgMPMbgrUweYxT9Ar')

blacklist = {}

# Define to
sender = 'textbooks@semester.ly'

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email or student.user.email in blacklist:
        continue

    try:
        unsub_link = "https://semester.ly" + create_unsubscribe_link(student)
        tt = student.personaltimetable_set.filter(semester='S').order_by('last_updated').last()
        textbook_json = map(lambda c:
                        {
                            "textbooks": map(lambda t: model_to_dict(Textbook.objects.get(isbn=t)), tt.sections.filter(~Q(textbooks=None), course=c).values_list("textbooks", flat=True).distinct()),
                            "course_name": c.name,
                            "course_code": c.code,
                        }, tt.courses.all())

        # Go through textbooks. If all empty lists (no textbooks), go to next student.
        have_textbooks = False
        for dic in textbook_json:
            if dic["textbooks"]:
                have_textbooks = True
                break

        if not have_textbooks:
            continue

        student.user.first_name = student.user.first_name.encode('utf-8')
        student.user.last_name = student.user.last_name.encode('utf-8')

        msg_html = render_to_string('email_textbooks.html', {
            'user': student,
            'unsub_link': unsub_link,
            'textbooks_json': textbook_json
        })

        # Create message
        recipient = student.user.email
        msg = MIMEText(msg_html.encode('utf-8'),'html')

        msg['Subject'] = "Your Textbooks from Semester.ly"
        msg['From'] = sender
        msg['To'] = recipient
        print "Sending to: " + str(recipient)

        # Perform operations via server
        # TODO: Ping their email address to make sure it's fine
        server.sendmail(sender, [recipient], msg.as_string())
    except:
        e = sys.exc_info()[0]
        print("skipped " + str(student.user.email))
	traceback.print_exc()

        server = smtplib.SMTP_SSL('email-smtp.us-east-1.amazonaws.com')
        server.login('AKIAJWXCNDO3CMYAIC6A', 'AonOaLbp9FjBkyhP9ihHBge92CEqgMPMbgrUweYxT9Ar')
server.quit()
