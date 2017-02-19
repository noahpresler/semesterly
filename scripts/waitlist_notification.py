import django, os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from student.models import *
from timetable.models import *
from mailer import Mailer

if len(sys.argv) < 3:
    print("Please specify a school (e.g. jhu) and a semester (F or S).")
    exit(0)
school = sys.argv[1]
semester = sys.argv[2]

client = Mailer()
d = {}

sections = Section.objects.all()
for section in sections:
    if not section.was_full and (section.size <= section.enrolment):
        section.was_full = True
        section.save()
        try:
            timetables = PersonalTimetable.objects.filter(sections__id__contains=section.id, semester=semester)
        except:
            print("Problem with getting section with id = " + str(section.id))
        for student, timetable in zip(map(lambda t: t.student, timetables), timetables):
            if timetable != student.personaltimetable_set.filter(semester=semester).order_by('last_updated').last():
                # Only applies for the student's last modified schedule.
                continue
            # NOTIFIY STUDENT
            d[student] = section

    elif section.was_full and section.enrolment < section.size:
        section.was_full = False
        section.save()

for student, section in d.items():
    print ("Sending email to: " + str(student.user.username))
    client.send_mail(student, "Course Waitlist Notification from Semester.ly", "email_waitlist.html", {'section': section})


client.cleanup()
