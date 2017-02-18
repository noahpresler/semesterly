import django, os, json, traceback, sys, smtplib
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from email.mime.text import MIMEText
from django.template.loader import render_to_string
from student.models import *
from student.views import create_unsubscribe_link

class Mailer():
    def send_mail(students, template, subject, params={}):
        '''
        Sends emails with students
        Parameters:
            students: Students to send email to 
            subject: Subject of the email
            params: Dictionary of things to go into template
            template: HTML email template
        '''
        # Create server object with SSL option
        server = smtplib.SMTP_SSL('email-smtp.us-east-1.amazonaws.com')
        server.login('AKIAJWXCNDO3CMYAIC6A', 'AonOaLbp9FjBkyhP9ihHBge92CEqgMPMbgrUweYxT9Ar')

        # Define to
        sender = 'textbooks@semester.ly'

        for student_id in self.students:
            student = Student.objects.get(id=student_id)

            if not student.emails_enabled or not student.user.email:
                continue

            try:
                unsub_link = "https://semester.ly" + create_unsubscribe_link(student)
                student.user.first_name = student.user.first_name.encode('utf-8')
                student.user.last_name = student.user.last_name.encode('utf-8')

                params.update({
                    'user': student,
                    'unsub_link': unsub_link,
                })

                msg_html = render_to_string(template, params)

                # Create message
                recipient = student.user.email
                msg = MIMEText(msg_html.encode('utf-8'),'html')

                msg['subject'] = subject
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
