import django, os, json
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from mailer import Mailer

if len(sys.argv) < 3:
    print("Please specify a school and a semester (F or S).")
    exit(0)
school = sys.argv[1]
semester = sys.argv[2]

students = PersonalTimetable.objects.filter(school=school).values_list("student", flat=True).distinct()
client = Mailer()

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email:
        continue

    client.send_mail(student, "Spring 2017 Classes on Semester.ly", "email_classes_released.html", {'freshman': student.class_year == 2020,
            'senior': student.class_year == 2017})
client.cleanup()
