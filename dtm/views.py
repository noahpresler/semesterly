import json, pytz, datetime
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext

from timetable.models import *
from timetable.school_mappers import school_to_granularity, VALID_SCHOOLS, school_code_to_name, AM_PM_SCHOOLS, school_to_course_regex
from timetable.utils import *
from student.utils import *
from student.models import Student
from student.views import get_student, get_user_dict, convert_tt_to_dict, get_classmates_from_course_id
from django.db.models import Count

hashids = Hashids(salt="***REMOVED***")

# Create your views here.
@validate_subdomain
def view_dtm_root(request, code=None, sem=None, shared_timetable=None, find_friends=False, enable_notifs=False,signup=False,gcal_callback=False, export_calendar=False, view_textbooks=False):
  school = request.subdomain
  student = get_student(request)

  if not sem: # not loading a share course link
    if school in AM_PM_SCHOOLS:
	sem = 'S'
    else:
	sem = 'F'
  print get_free_busy_from_cals(['noah@presler.me'], student, 1)
  return render_to_response("dtm_root.html", {
    'school': school,
    'student': json.dumps(get_user_dict(school, student, sem)),
    'course': json.dumps(None),
    'semester': sem,
    'shared_timetable': json.dumps(shared_timetable),
    'find_friends': find_friends,
    'enable_notifs': enable_notifs,
    'uses_12hr_time': school in AM_PM_SCHOOLS,
    'student_integrations': json.dumps(None),
    'signup': signup,
    'gcal_callback': gcal_callback,
    'export_calendar': export_calendar,
    'view_textbooks': view_textbooks,
    'calendar_list': get_calendar_list(student),
    'is_poll': True
  },
  context_instance=RequestContext(request))

def make_unmade_calendars(calendar_list):
  for cal in calendar_list:
    GoogleCalendar.objects.get_or_create(
      student=student,
      calendar_id=cal['id'],
      defaults={'name': cal['summary']}
    )

def get_calendar_list(student):
  if student and student.user.is_authenticated():
    credentials = get_google_credentials(student)
    http = credentials.authorize(httplib2.Http(timeout=100000000))
    service = discovery.build('calendar', 'v3', http=http)
    cal_list = service.calendarList().list(pageToken=None).execute()
    make_unmade_calendars(cal_list)
    return json.dumps(map(lambda cal: {'name': cal['summary'], 'id': cal['id']}, cal_list['items']))
  else:
    return []

def get_free_busy_from_cals(cal_ids, student, week_offset=0):
  tz = pytz.timezone('US/Eastern')
  start = tz.localize(last_weekday(datetime.datetime.today(), 'sunday')) + datetime.timedelta(weeks=week_offset, minutes=5)
  end = tz.localize(next_weekday(datetime.datetime.today(), 'S')) + datetime.timedelta(weeks=week_offset)
  body = {
    "timeMin": start.isoformat(),
    "timeMax": end.isoformat(),
    "timeZone": 'US/Central',
    "items": map(lambda cid: {"id": cid}, cal_ids)
  }
  credentials = get_google_credentials(student)
  http = credentials.authorize(httplib2.Http(timeout=100000000))
  service = discovery.build('calendar', 'v3', http=http)
  return service.freebusy().query(body=body).execute()

def create_availability_share(cal_ids, student, week_offset):
  start_day = last_weekday(datetime.datetime.today(), 'sunday') + datetime.timedelta(weeks=week_offset, minutes=5)
  share = AvailabilityShare.objects.create(
    student=student,
    start_day=start_day,
    expiry=None,
  )
  for cid in cal_ids:
    share.google_calendars.add(
      GoogleCalendar.objects.get(
        student=student,
        calendar_id=cid
      )
    )
  share.save()
  return hashids.encrypt(share.id)

