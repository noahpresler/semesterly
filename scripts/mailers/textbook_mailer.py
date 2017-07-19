import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import Student
from timetable.models import Textbook
from django.db.models import Q
from django.forms.models import model_to_dict
from mailer import Mailer
from utils import all_students_with_timetables

class TextbookMailer(Mailer):
    def __init__(self, school, semester, test_students):
        super(TextbookMailer, self).__init__()
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

            if not student.emails_enabled or not student.user.email:
                continue

            tt = student.personaltimetable_set.filter(semester=self.semester).\
                order_by('last_updated').last()

            try:
                textbook_json = [{
                    "textbooks": [model_to_dict(Textbook.objects.get(isbn=t))
                                  for t in tt.sections.filter(~Q(textbooks=None), course=c)\
                                            .values_list("textbooks", flat=True).distinct()],
                    "course_name": c.name,
                    "course_code": c.code,
                } for c in tt.courses.all()]
            except AttributeError:
                # The student does not have any timetable
                print("Student " + str(student.id) + " does not have any valid timetable.")
                continue

            # Go through textbooks. If all empty lists (no textbooks), go to next student.
            have_textbooks = False
            for dic in textbook_json:
                if dic["textbooks"]:
                    have_textbooks = True
                    break

            if not have_textbooks:
                continue

            super(TextbookMailer, self).send(student,\
            "Happy First Day of Classes - Textbooks from Semester.ly",\
             "email_textbooks.html", {'textbooks_json': textbook_json})
        super(TextbookMailer, self).cleanup()
