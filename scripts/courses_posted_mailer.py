import django, os, json
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from timetable.models import Semester
from mailer import Mailer

if len(sys.argv) < 4:
    print("Please specify a school, a term (e.g. Fall), and a year (e.g. 2017).")
    exit(0)
school = sys.argv[1]
term = sys.argv[2]
year = int(sys.argv[3])

semester = Semester.objects.filter(name=term, year=year)

students = PersonalTimetable.objects.filter(school=school, semester=semester).values_list("student", flat=True).distinct()
client = Mailer()

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email:
        continue

    client.send_mail(student, "Spring 2017 Classes on Semester.ly", "email_classes_released.html", {'freshman': student.class_year == 2020,
            'senior': student.class_year == 2017})
client.cleanup()
