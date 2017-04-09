import django, os, json
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from timetable.models import *
from django.db.models import Q
from django.forms.models import model_to_dict
from mailer import Mailer

if len(sys.argv) < 3:
    print("Please specify a school and a semester (F or S).")
    exit(0)
school = sys.argv[1]
semester = sys.argv[2]

client = Mailer()

students = PersonalTimetable.objects.filter(school=school, semester='S').values_list("student", flat=True).distinct()

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email:
        continue

    tt = student.personaltimetable_set.filter(semester=semester).order_by('last_updated').last()
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

    client.send_mail(student, "Happy First Day of Classes - Textbooks from Semester.ly", "email_textbooks.html", {'textbooks_json': textbook_json})
client.cleanup()
