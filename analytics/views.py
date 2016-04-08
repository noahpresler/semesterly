from django.shortcuts import render_to_response, render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt

from django.db.models import Q

import datetime, json, urllib2
from datetime import timedelta

from analytics.models import *
from dateutil import tz

to_zone = tz.gettz('America/New_York')


def view_analytics_dashboard(request):
	return render_to_response('analytics_dashboard.html', {}, 
		context_instance=RequestContext(request))

@csrf_exempt
def verify_password(request):
	try:
		r = request.GET
		if r['x'] != "7noAh11": 
			return HttpResponse("fail", status=200)

		return HttpResponse("success", status=200)
	except:
		raise Http404


@csrf_exempt
def create_session_for_request(request, sid):
	# get ip address and information about the address
	try:
		try:
			s = Session.objects.get(session_id=sid)
		except:
			# did not exist
			ip = request.META.get('REMOTE_ADDR')

			ip_info = json.loads(urllib2.urlopen("http://ipinfo.io/" + ip + "/json").read())

			session = Session(session_id=sid,
				ip=ip_info.get('ip', "N/A"),
				lat_long=ip_info.get('loc', "N/A"),
				city=ip_info.get('city', "N/A"),
				country=ip_info.get('country', "N/A"))

			session.save()
	except Exception as e:
		pass

def get_analytics_models(school):
	if school == "jhu":
		return (HopkinsSearchQuery, HopkinsTimetable)
	else:
		return (SearchQuery, Timetable)

def save_timetable_data(sid, school, courses, count):
	SchoolQuery, SchoolTimetable = get_analytics_models(school)	
	try:
		analytics_tt = SchoolTimetable(session=Session.objects.get(session_id=sid))
		analytics_tt.save()
		for c in courses: 
			analytics_tt.courses.add(c)
		analytics_tt.is_conflict = count == 0 # change this
		analytics_tt.num_generated = count
		analytics_tt.save()
	except:
		pass



@csrf_exempt
def handle_exit(request):
	try:
		session = Session.objects.get(session_id=request.POST['sid'])
		session.end_time=datetime.datetime.now()
		session.save()
		return HttpResponse(status=200)
	except:
		return HttpResponse(status=200)

def get_approx_live_users():
	last_week = datetime.datetime.today()-timedelta(days=1)
	return Session.objects.filter(Q(end_time=None), Q(time__gt=last_week))

@csrf_exempt
def get_analytics_data(request):
	result = []
	analytics_data = {}

	uoft_tts = Timetable.objects.all().count()
	hopkins_tts = HopkinsTimetable.objects.all().count()
	users_live = get_approx_live_users().order_by('ip').distinct('ip').count()

	all_sessions = Session.objects.all()
	bounced_sessions = 0
	for session in all_sessions:
		if session.end_time == None: continue
		time_stayed_minutes = (session.end_time - session.time)/60 
		if (time_stayed_minutes < datetime.timedelta(minutes=1)):
			bounced_sessions += 1
	bounce_rate = bounced_sessions/all_sessions.count()*100

	unique_users = Session.objects.order_by('ip').distinct('ip').count()

	analytics_data['users_live'] = users_live
	analytics_data['uoft_tts'] = uoft_tts
	analytics_data['hopkins_tts'] = hopkins_tts
	analytics_data['bounce_rate'] = bounce_rate
	analytics_data['unique_users'] = unique_users

	result.append(analytics_data)

	return HttpResponse(json.dumps(result), content_type="application/json")

def get_num_generated(request):
	result = {
		'jhu_generated': HopkinsTimetable.objects.all().count(), 
		'uoft_generated': Timetable.objects.all().count()
	}

	return HttpResponse(json.dumps(result), content_type="application/json")

	pass
@csrf_exempt
def get_timetable_data(request):
	return_obj = {'recent_tt_data': []}
	try:
		filtered_ip = request.GET['ip']
		school = request.GET['school']
		if (school == 'uoft'):
			SchoolTimetable = Timetable
		else:
			SchoolTimetable = HopkinsTimetable
		if len(filtered_ip) == 1: # in case query is too short, just retrieve all?
			recent = SchoolTimetable.objects.all().order_by('-time')[:20]
		else:
			recent = SchoolTimetable.objects.filter(session__ip__startswith=filtered_ip).order_by('-time')[:20]
	except:
		recent = Timetable.objects.all().order_by('-time')[:20]

	for tt in recent:
		this_tt = {}
		courses_str = ""
		for c in tt.courses.all():
			courses_str += c.code + " "
		this_tt['ip'] = tt.session.ip
		this_tt['location'] = tt.session.city + ", " + tt.session.country
		this_tt['time'] = tt.time.astimezone(to_zone).strftime("%Y-%m-%d %I:%M:%S %p")
		this_tt['courses'] = courses_str
		this_tt['conflict'] = "Yes" if tt.is_conflict == True else "No"
		return_obj['recent_tt_data'].append(this_tt)

	# return_obj['course_data'] = []

	return HttpResponse(json.dumps([return_obj]), content_type="application/json")


@csrf_exempt
def get_live_user_data(request):
	data = []
	live_user_sessions = get_approx_live_users().order_by('ip').distinct('ip')
	for session in live_user_sessions:
		user_data = {}
		user_data['ip'] = session.ip
		user_data['location'] = session.city + ", " + session.country

		user_data['time_arrived'] = session.time.astimezone(to_zone).strftime("%Y-%m-%d %I:%M:%S %p")



		data.append(user_data)

	return HttpResponse(json.dumps(data), content_type="application/json")


