import django, os, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import smtplib
from email.mime.text import MIMEText
from django.template.loader import render_to_string

#HANDLE IF THEY HAVE NO TT
student = Student.objects.get(user__first_name="Noah")
textbooks = map(lambda s: s.textbooks.all(),student.personaltimetable_set.order_by('last_updated').last().sections.filter(~Q(textbooks=None)).all())
msg_html = render_to_string('email_textbooks.html', {
	'user':json.dumps(student.user),
	'textbooks': json.dumps(textbooks)
})

# Define to/from
sender = 'textbooks@semester.ly'
recipient = student.user.email

# Create message
msg = MIMEText(msg_html,'html')
msg['Subject'] = "Your Textbooks from Semester.ly"
msg['From'] = sender
msg['To'] = recipient

# Create server object with SSL option
server = smtplib.SMTP_SSL('smtp.zoho.com', 465)

# Perform operations via server
server.login('textbooks@semester.ly', '***REMOVED***')
server.sendmail(sender, [recipient], msg.as_string())
server.quit()