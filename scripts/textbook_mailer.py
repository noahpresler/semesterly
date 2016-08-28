import django, os, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import smtplib
from email.mime.text import MIMEText
from django.template.loader import render_to_string
from student.models import *
from timetable.models import *
from django.db.models import Q
from django.forms.models import model_to_dict

#TODO: Take school as command line.
school = "jhu"

#TODO: Only students that have personal time tables with courses with textbooks.
students = PersonalTimetable.objects.filter(school=school).values_list("student", flat=True).distinct()
for student_id in students:
    student = Student.objects.get(id=student_id)
    tt = student.personaltimetable_set.order_by('last_updated').last()
    textbook_json = map(lambda c:
                    {
                        "textbooks": map(lambda t: model_to_dict(Textbook.objects.get(isbn=t)), tt.sections.filter(~Q(textbooks=None), course=c).values_list("textbooks", flat=True).distinct()),
                        "course_name": c.name,
                        "course_code": c.code
                    }, tt.courses.all())

    # Go through textbooks. If all empty lists (no textbooks), go to next student.
    have_textbooks = False
    for dic in textbook_json:
        if dic["textbooks"]:
            have_textbooks = True

    if not have_textbooks:
        continue

    msg_html = render_to_string('email_textbooks.html', {
        'user':student,
        'textbooks': json.dumps(textbook_json)
    })



# student = Student.objects.get(user__first_name="Eric")

# # Gets the textbook for the given student
# textbooks = map(lambda s: s.textbooks.all(),student.personaltimetable_set.order_by('last_updated').last().sections.filter(~Q(textbooks=None)).all())


# Define to/from
sender = 'textbooks@semester.ly'
recipient = student.user.email

# Create message
msg = MIMEText(msg_html,'html')
msg['Subject'] = "Your Textbooks from Semester.ly"
msg['From'] = sender
msg['To'] = recipient

# Create server object with SSL option
# server = smtplib.SMTP_SSL('smtp.zoho.com', 465)

# # Perform operations via server
# server.login('textbooks@semester.ly', '***REMOVED***')

# # TODO: Ping their email address to make sure it's fine
# server.sendmail(sender, [recipient], msg.as_string())
# server.quit()