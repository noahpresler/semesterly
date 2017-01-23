import django, os, json
import traceback
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import smtplib
from email.mime.text import MIMEText
from django.template.loader import render_to_string
from student.models import *
from student.views import create_unsubscribe_link
from timetable.models import *
from django.db.models import Q
from django.forms.models import model_to_dict

if len(sys.argv) < 2:
    print("Please specify a school.")
    exit(0)
school = sys.argv[1]

students = PersonalTimetable.objects.filter(school=school, semester='S').values_list("student", flat=True).distinct()

# Create server object with SSL option
server = smtplib.SMTP_SSL('email-smtp.us-east-1.amazonaws.com')
server.login('AKIAJWXCNDO3CMYAIC6A', 'AonOaLbp9FjBkyhP9ihHBge92CEqgMPMbgrUweYxT9Ar')

blacklist = {"jmsusas@yahoo.com"
,"clara.liff@gmail.com"
,"muffinman1117@gmail.com"
,"rebekah.kirkwood@gmail.com"
,"awax1@jhu.edu"
,"tfitzg12@jhu.edu"
,"tlranger96@gmail.com"
,"mcola22@gmail.com"
,"gaby776@gmail.com"
,"chaudrey84@gmail.com"
,"hstwitter@hotmail.com"
,"sanjayel@hotmail.com"
,"dandoherty97@gmail.com"
,"toxikjumper@gmail.com"
,"serfineokeyo@gmail.com"
,"ixoxhershey@yahoo.com"
,"jswokay@gmail.com"
,"krazykat1001@hotmail.com"
,"ogunnaike1998@gmail.com"
,"chensamuel76@yahoo.com"
,"aphal1@jhu.edu"
,"98devin@gmail.com"
,"roadrunnersurvivalla@gmail.com"
,"namratach98@gmail.com"
,"pinkperson247@gmail.com"
,"samc526@gmail.com"
,"jcjoshuachoi@gmail.com"
,"emyw123@gmail.com"
,"sps401@gmail.com"
,"richardshy1995@aim.com"
,"g1997p@gmail.com"
,"hawkinsredfoxresearch@gmail.com"
,"nehaabby@gmail.com"
,"miketush@gmail.com"
,"regan1017@gmail.com"
,"dtigersfries7@gmail.com"
,"calvinprofessional@hotmail.com"
,"maddymaddie411@yahoo.com"
,"leevincent1427@gmail.com"
,"hriggott@aol.com"
,"aurinx@yahoo.com"
,"slugger1997@hotmail.com"
,"zz.khan@hotmail.com"
,"crosset2@jhu.edu"
,"2013d4@gmail.com"
,"reecegriffith98@gmail.com"
,"wackoscackos@optonline.net"
,"faceswilliam@gmail.com"
,"yovell98@gmail.com"
,"crazy4candy24@gmail.com"
,"briankidd62@gmail.com"
,"cassidy.quiros@yahoo.com"
,"colin.thrasher97@gmail.com"
,"tosin_foreverslife@yahoo.com"
,"swimmergirl1708@yahoo.com"
,"sdesilva@farragut2.org"
,"kevinreyes.cal@gmail.com"
,"lina.kim@apis.seoul.kr"
,"crazy4soccerandtennis@gmail.com"
,"kasim102691@yahoo.com"
,"madeleine.guell@yahoo.com"
,"sammyb404@gmail.com"
,"lucbrenaux@gmail.com"
,"sinjia2007@hotmail.com"
,"jerricamarie.li@gmail.com"
,"snjy9182@gmail.com"
,"defineciks@hotmail.com"
,"aarowkid1235@gmail.com"
,"julbull97@gmail.com"
,"afang151@gmail.com"
,"christian.cosgrove@gmail.com"
,"msnmanmonkey@gmail.com"
,"jj_cangri123@hotmail.com"
,"evanthomas212@aol.com"
,"andyli111@yahoo.com"
,"clarice.h.lee@gmail.com"
,"daltonmatthewchu@gmail.com"
,"diego.arevalo7@gmail.com"
,"diegoforlangd@gmail.com"
,"lalu1998@gmail.com"
,"jaredmac32@verizon.net"
,"ryanbhowmik@gmail.com"
,"zgs1997@gmail.com"
,"ultramandrew@yahoo.com"
,"aleck.zhao1114@gmail.com"
,"s.supapat@hotmail.com"
,"vanessa11558@yahoo.com"
,"aundreee7@yahoo.com"
,"tiffanyhou317@gmail.com"
,"roblee909@gmail.com"
,"danny.blessing0@gmail.com"
,"onlykabirr@gmail.com"
,"shahmirali1098@gmail.com"
,"penguins.r.osm@gmail.com"
,"krishnantaran@gmail.com"
,"pboches6@gmail.com"
,"tomlado@verizon.net"
,"kittensomg335@gmail.com"
,"jackelyn.navar@gmail.com"
,"neha@onteeru.com"
,"melissaeustache@yahoo.com"
,"tellriya@msn.com"
,"azhao@webb.org"
,"beobgwan@gmail.com"
,"rkl2907@gmail.com"
,"jr9917@hotmail.com"
,"outingting0526@gmail.com"
,"kevin.wu690@yahoo.com"}

# Define to
sender = 'textbooks@semester.ly'

for student_id in students:
    student = Student.objects.get(id=student_id)

    if not student.emails_enabled or not student.user.email or student.user.email in blacklist:
        continue

    try:
        unsub_link = "https://semester.ly" + create_unsubscribe_link(student)
        tt = student.personaltimetable_set.order_by('last_updated').last()
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

        student.user.first_name = student.user.first_name.encode('utf-8')
        student.user.last_name = student.user.last_name.encode('utf-8')

        msg_html = render_to_string('email_textbooks.html', {
            'user': student,
            'unsub_link': unsub_link,
            'textbooks_json': textbook_json
        })

        # Create message
        recipient = student.user.email
        msg = MIMEText(msg_html.encode('utf-8'),'html')

        msg['Subject'] = "Your Textbooks from Semester.ly"
        msg['From'] = sender
        msg['To'] = recipient
        print "Sending to: " + str(recipient)

        # Perform operations via server
        # TODO: Ping their email address to make sure it's fine
        server.sendmail(sender, [recipient], msg.as_string())
    except:
        e = sys.exc_info()[0]
        print("skipped " + str(student.user.email))
	traceback.print_exc()

        server = smtplib.SMTP_SSL('email-smtp.us-east-1.amazonaws.com')
        server.login('AKIAJWXCNDO3CMYAIC6A', 'AonOaLbp9FjBkyhP9ihHBge92CEqgMPMbgrUweYxT9Ar')
server.quit()
