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

import django, os, json, traceback, sys, smtplib
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from email.mime.text import MIMEText
from django.template.loader import render_to_string
from student.models import *
from student.views import create_unsubscribe_link
from semesterly.settings import get_secret

class Mailer():
    def __init__(self):
        # Create server object with SSL option
        self.server = smtplib.SMTP_SSL(get_secret('MAILER_SERVER'))
        self.server.login(get_secret('MAILER_USER'), get_secret('MAILER_PASSWORD'))

        # Define to
        self.sender = 'textbooks@semester.ly'

    def cleanup(self):
        self.server.quit()

    def send_mail(self, student, subject, template, params={}):
        '''
        Sends email to a student
        Parameters:
            student: Student to send email to 
            subject: Subject of the email
            params: Dictionary of things to go into template
            template: HTML email template
        '''
        if not student.emails_enabled or not student.user.email:
            return

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
        msg['From'] = self.sender
        msg['To'] = recipient
        print(("Sending to: " + str(recipient)))

        try:
            # Perform operations via server
            # TODO: Ping their email address to make sure it's fine
            self.server.sendmail(self.sender, [recipient], msg.as_string())
        except:
            e = sys.exc_info()[0]
            print(("skipped " + str(student.user.email)))
            traceback.print_exc()

        self.server = smtplib.SMTP_SSL(MAILER_SERVER)
        self.server.login(MAILER_USER, MAILER_PASSWORD)