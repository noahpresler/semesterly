import os

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import PersonalTimetable
from timetable.models import Section
from mailer import Mailer

class WaitlistMailer(Mailer):
    def __init__(self, school, semester, test_students):
        super(WaitlistMailer, self).__init__()
        self.school = school
        self.semester = semester
        self.test_students = test_students

    def send_emails(self):
        if self.test_students:
            print("Currently not supported.")

        d = {}
        sections = Section.objects.filter(course__school=self.school)
        for section in sections:
            if not section.was_full and (section.size <= section.enrolment):
                section.was_full = True
                section.save()
                try:
                    timetables = PersonalTimetable.objects.filter(
                        sections__id__contains=section.id, semester=self.semester)
                except:
                    print("Problem with getting section with id = " + str(section.id))
                for student, timetable in zip(map(lambda t: t.student, timetables), timetables):
                    if timetable != student.personaltimetable_set.filter(
                        semester=self.semester).order_by('last_updated').last():
                        # Only applies for the student's last modified schedule.
                        continue
                    # NOTIFIY STUDENT
                    if student not in d:
                        d[student] = []
                    d[student].append(section)

            elif section.was_full and section.enrolment < section.size:
                section.was_full = False
                section.save()

        for student, sections in d.items():
            super(WaitlistMailer, self).send(student,
                "Course Waitlist Notification from Semester.ly", "email_waitlist.html",
                {'sections': sections})


        super(WaitlistMailer, self).cleanup()
