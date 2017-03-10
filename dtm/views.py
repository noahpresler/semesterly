import json, pytz, datetime, copy
from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.serializers.json import DjangoJSONEncoder
from django.template import RequestContext

from timetable.models import *
from timetable.school_mappers import school_to_granularity, VALID_SCHOOLS, school_code_to_name, AM_PM_SCHOOLS, school_to_course_regex
from timetable.utils import *
from student.utils import *
from dtm.models import *
from student.models import Student
from student.views import get_student, get_user_dict, convert_tt_to_dict, get_classmates_from_course_id
from django.db.models import Count
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
import dateutil.parser

hashids = Hashids(salt="***REMOVED***")
tz = pytz.timezone('US/Eastern')

# Create your views here.
@validate_subdomain
def view_dtm_root(request, code=None, sem=None, share_availability=None):
  school = request.subdomain
  student = get_student(request)

  if not sem: # not loading a share course link
    if school in AM_PM_SCHOOLS:
	sem = 'S'
    else:
	sem = 'F'
  return render_to_response("dtm_root.html", {
    'school': school,
    'student': json.dumps(get_user_dict(school, student, sem)),
    'course': json.dumps(None),
    'semester': sem,
    'uses_12hr_time': school in AM_PM_SCHOOLS,
    'calendar_list': get_calendar_list(student),
    'share_availability': json.dumps(share_availability, cls=DjangoJSONEncoder),
    'is_poll': True
  },
  context_instance=RequestContext(request))

'''
Iterate over calendars in calendar list
Creates all GoogleCalendar models that DNE
'''
def make_unmade_calendars(calendar_list, student):
  for cal in calendar_list['items']:
    GoogleCalendar.objects.get_or_create(
      student=student,
      calendar_id=cal['id'],
      defaults={'name': cal['summary']}
    )

'''
Requests the users calendars from Google API
Creates all unmade calendar
Returns list of name/id pairs
'''
def get_calendar_list(student):
  if student and student.user.is_authenticated():
    credentials = get_google_credentials(student)
    http = credentials.authorize(httplib2.Http(timeout=100000000))
    service = discovery.build('calendar', 'v3', http=http)
    cal_list = service.calendarList().list(pageToken=None).execute()
    make_unmade_calendars(cal_list, student)
    return json.dumps(map(lambda cal: {
      'name': cal['summary'],
      'id': cal['id'],
      'color': cal['backgroundColor'],
      'visible': student.calendar_preferences.get(
        calendar=GoogleCalendar.objects.get(
          calendar_id=cal['id']
        )).visible if student.calendar_preferences.filter(
        calendar=GoogleCalendar.objects.get(
          calendar_id=cal['id']
        )).exists() else True,
    }, cal_list['items']))
  else:
    return []

'''
Given a student and list of calendar ids, return freebusy
Returns lists of time ranges where user is busy
week_offset acts as pagination: tells the function
  how many weeks away from today to start the query for

'''
@csrf_exempt
def get_free_busy_from_cals(cal_ids, student, week_offset=0):
  #TODO CHECK THAT THE CALENDAR BELONGS TO THEM
  if 'default' in cal_ids: cal_ids.remove('default')
  start = tz.localize(last_weekday(datetime.datetime.today(), 'U')) + datetime.timedelta(weeks=week_offset, minutes=5)
  end = tz.localize(next_weekday(datetime.datetime.today(), 'S')) + datetime.timedelta(weeks=week_offset)
  body = {
    "timeMin": start.replace(hour=0, minute=0).isoformat(),
    "timeMax": end.replace(hour=23, minute=59).isoformat(),
    "timeZone": 'US/Central',
    "items": map(lambda cid: {"id": cid}, cal_ids)
  }
  credentials = get_google_credentials(student)
  http = credentials.authorize(httplib2.Http(timeout=100000000))
  service = discovery.build('calendar', 'v3', http=http)
  result = service.freebusy().query(body=body).execute()
  return result


@csrf_exempt
def get_mutually_free(request):
  body = json.loads(request.body)
  freeBusyA, freeBusyB = body['A'], body['B']
  return HttpResponse(json.dumps(find_mutually_free(freeBusyA, freeBusyB),cls=DjangoJSONEncoder), content_type='application/json')

def find_mutually_free(freeBusyA, freeBusyB, week_offset=0):
  rotated_days = [6,0,1,2,3,4,5]

  #merge all the calendars of the individual user's agendas together
  busy = merge_free_busy(freeBusyA, merge_in_list=freeBusyB, keep_datetime=True)

  busy_by_day = {}
  free_by_day = {}

  for day in range(7):
    busy_by_day[day] = []

  print busy

  #intialize busy_by_day to be the times busy seperated by day
  for interval in busy:
    new_interval = copy.copy(interval)
    weekday = rotated_days.index(interval['start'].weekday())
    new_interval['start'] = new_interval['start'].time()
    new_interval['end'] = new_interval['end'].time()
    busy_by_day[weekday].append(new_interval)

  #initialize each day of the week to be completely free
  for day in range(7):
    free_by_day[day] = [{'start':datetime.time(0,00) ,'end': datetime.time(23,59)}]

  for day in range(7):
    for busy_slot in busy_by_day[day]:
      for free_slot in free_by_day[day]:
        # busy starts after and ends before - split free
        if busy_slot['start'] > free_slot['start'] and busy_slot['end'] < free_slot['end']:
          free_by_day[day].append({'start': free_slot['start'], 'end': busy_slot['start'] })
          free_by_day[day].append({'start': busy_slot['end'], 'end': free_slot['end'] })
          free_by_day[day].remove(free_slot)

        # if busy overlaps bottom of free
        elif busy_slot['start'] <= free_slot['start'] < busy_slot['end'] < free_slot['end']:
          free_by_day[day].remove(free_slot)
          free_slot['start'] = busy_slot['end']
          free_by_day[day].append(free_slot)

        #busy overlaps top of free
        elif free_slot['start'] < busy_slot['start'] < free_slot['end'] <= busy_slot['end']:
          free_by_day[day].remove(free_slot)
          free_slot['end'] = busy_slot['start']
          free_by_day[day].append(free_slot)

        #if busy larger than/equal to free on both ends remove free
        elif busy_slot['start'] <= free_slot['start'] and busy_slot['end'] >= free_slot['end']:
          free_by_day[day].remove(free_slot)

  # return reduce(lambda l,k: l + free_by_day[k] , free_by_day.keys(),[])
  return free_by_day

def merge_intervals(intervals):
  intervals.sort(key=lambda x: x['start'])
  result = [intervals[0]]
  for i in xrange(1, len(intervals)):
      prev, current = result[-1], intervals[i]
      if current['start'] - prev['end'] <= datetime.timedelta(minutes=5) and current['start'].date() == prev['end'].date(): 
          prev['end'] = max(prev['end'], current['end'])
      else:
          result.append(current)
  return result

'''
Reconstructs the free busy api call with merged intervals
NOTE THAT this returns to the calendar called "default"
'''
def merge_free_busy(free_busy_body, keep_datetime=False, merge_in_list=[]):
  free_busy_body = copy.deepcopy(free_busy_body)
  intervals = []
  for calid in free_busy_body['calendars']:
    #concatenate all ranges
    cal = free_busy_body['calendars'][calid]
    for interval in cal['busy']:
      #convert times to python types
      new_interval = {
        'start' : dateutil.parser.parse(interval['start']),
        'end' : dateutil.parser.parse(interval['end'])
      }
      
      #TODO if multi day split into single day

      intervals.append(new_interval)

  for interval in merge_in_list:
    new_interval = {
      'start' : dateutil.parser.parse(interval['start']),
      'end' : dateutil.parser.parse(interval['end'])
    }

    #TODO if multi day split into single day

    intervals.append(new_interval)

  if len(intervals) <= 1:
    return free_busy_body

  result = merge_intervals(intervals)

  if keep_datetime:
    return result
  else:
    return map(lambda i: {'start': i['start'].isoformat(), 'end': i['end'].isoformat()}, result)


def get_availability_share(request):
  student = get_student(request)
  cal_ids = json.loads(request.body)['cal_ids']
  week_offset = json.loads(request.body)['week_offset']
  return HttpResponse(json.dumps({
    'link': create_availability_share(cal_ids, student, week_offset),
    'merged_availability': merge_free_busy(get_free_busy_from_cals(cal_ids, student, week_offset=week_offset))
  }), content_type='application/json')

'''
Creates AvailabilityShare object for a student with calendarids and weekoffset
Returns encryped hash of the id for the share
'''
def create_availability_share(cal_ids, student, week_offset):
  if 'default' in cal_ids: cal_ids.remove('default')
  start_day = last_weekday(datetime.datetime.today(), 'U') + datetime.timedelta(weeks=week_offset, minutes=5)
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

def convert_share_to_dict(share):
  share_dict = model_to_dict(share,exclude=['id','student'])
  share_dict['google_calendars'] = map(lambda gc: model_to_dict(gc,exclude=['id','student']), share.google_calendars.all())
  return share_dict


'''
View shared availability
Requires url: /dtm/share/{hashed id}
'''
@validate_subdomain
def share_availability(request, ref):
  student = get_student(request)
  # try:
  share = AvailabilityShare.objects.get(id=hashids.decrypt(ref)[0])
  if not share.expiry and share.duration:
    share.expiry = datetime.datetime.today() + share.duration
    share.save()
  elif share.expiry and share.expiry < tz.localize(datetime.datetime.today()):
    return render(request, "expired.html")
  cal_ids = map(lambda gc: gc.calendar_id, share.google_calendars.all())
  week_offset = int(float((share.start_day - tz.localize(datetime.datetime.today())).days) / 7 )
  return view_dtm_root(request, share_availability=merge_free_busy(get_free_busy_from_cals(cal_ids, student, week_offset=week_offset)))
  # except Exception as e:
  #   raise Http404

'''
Returns the free busy availability from Google api
Rquires a JSON body POSTED to url: /dtm/availability
Must have 
  {
    cal_ids: [..list of calendar ids that are visible...],
    week_offset: int, how many weeks forward we are looking
  }
'''
@csrf_exempt
def get_availability(request):
  student = get_student(request)
  cal_ids = json.loads(request.body)['cal_ids']
  week_offset = json.loads(request.body)['week_offset']
  response = get_free_busy_from_cals(cal_ids,student,week_offset)
  return HttpResponse(json.dumps(response), content_type='application/json')

'''
For each calendar id get its corresponding model, update its visibility 
based on the request json which is a dictionary mapping id => visibility (bool)
'''
@csrf_exempt
def update_cal_prefs(request):
  visibility = json.loads(request.body)
  student = get_student(request)
  for cid in visibility:
    if cid != "default":
      cal = GoogleCalendar.objects.get(calendar_id=cid)
      student.calendar_preferences.update_or_create(  
              calendar = cal,
              defaults = {
                  'visible': visibility[cid]
              })
  return HttpResponse(json.dumps({"success":"200"}), content_type='application/json')
