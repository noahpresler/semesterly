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

    if not student.emails_enabled or not student.user.email or student.class_year < 2018:
        continue

    client.send_mail(student, "Registration Starts Tomorrow", "email_registration_deadline.html", {'freshman': student.class_year == 2020, 
    'sophomore': student.class_year == 2019, 'junior': student.class_year == 2018})
client.cleanup()
