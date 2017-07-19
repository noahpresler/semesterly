import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import Student
from mailer import Mailer
from utils import all_students_with_timetables

class CoursesPostedMailer(Mailer):
    def __init__(self, school, semester, test_students):
        super(CoursesPostedMailer, self).__init__()
        self.school = school
        self.semester = semester
        self.test_students = test_students

    def send_emails(self):
        recipents = []
        if self.test_students:
            recipents = self.test_students
        else:
            recipents = all_students_with_timetables(self.school, self.semester)

        for student_id in recipents:
            student = Student.objects.get(id=student_id)

            if not student.emails_enabled or not student.user.email or student.class_year < 2018:
                continue

            super(CoursesPostedMailer, self).send(student, "Registration Starts Tomorrow",\
                "email_registration_deadline.html", {'freshman': student.class_year == 2020,\
                'sophomore': student.class_year == 2019, 'junior': student.class_year == 2018})
        super(CoursesPostedMailer, self).cleanup()
