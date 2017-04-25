import json

import httplib2
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.db.models import Q, Count
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import get_object_or_404, render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from googleapiclient import discovery
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import *
from authpipe.utils import get_google_credentials, check_student_token
from student.models import *
from student.models import Student, Reaction, RegistrationToken
from student.utils import next_weekday, get_classmates_from_course_id, make_token, get_student_tts
from timetable.models import *
from timetable.models import Course
from timetable.utils import *
from timetable.utils import validate_subdomain
from timetable.views import view_timetable

DAY_MAP = {
    'M': 'mo',
    'T': 'tu',
    'W': 'we',
    'R': 'th',
    'F': 'fr',
    'S': 'sa',
    'U': 'su'
}

hashids = Hashids(salt="***REMOVED***")


def get_friend_count_from_course_id(school, student, course_id, semester):
    return PersonalTimetable.objects.filter(student__in=student.friends.all(), courses__id__exact=course_id) \
        .filter(Q(semester=semester)).distinct('student').count()


def create_unsubscribe_link(student):
    id, token = make_token(student).split(":", 1)
    return reverse('student.views.unsubscribe', kwargs={'id': id, 'token': token, })


def unsubscribe(request, id, token):
    student = Student.objects.get(id=id)

    if student and check_student_token(student, token):
        # Link is valid
        student.emails_enabled = False
        student.save()

        return render(request, 'unsubscribe.html')

    # Link is invalid. Redirect to homepage.
    return HttpResponseRedirect("/")


def get_semester_name_from_tt(tt):
    try:
        return Semester.objects.get(id=tt['semester']).name
    except KeyError:
        semester = 'Fall'
        for course in tt['courses']:
            for slot in course['slots']:
                semester_id = slot['semester']
                return Semester.objects.get(id=semester_id).name
        return semester


@csrf_exempt
@validate_subdomain
def log_ical_export(request):
    try:
        student = Student.objects.get(user=request.user)
    except:
        student = None
    school = request.subdomain
    analytic = CalendarExport.objects.create(
        student=student,
        school=school,
        is_google_calendar=False
    )
    analytic.save()
    return HttpResponse(json.dumps({}), content_type="application/json")


class UserView(APIView):

    def get(self, request):
        logged = request.user.is_authenticated()
        if logged and Student.objects.filter(user=request.user).exists():
            student = Student.objects.get(user=request.user)
            reactions = Reaction.objects.filter(student=student).values('title').annotate(count=Count('title'))
            if student.user.social_auth.filter(provider='google-oauth2').exists():
                hasGoogle = True
            else:
                hasGoogle = False
            if student.user.social_auth.filter(provider='facebook').exists():
                social_user = student.user.social_auth.filter(provider='facebook').first()
                img_url = 'https://graph.facebook.com/' + student.fbook_uid + '/picture?width=700&height=700'
                hasFacebook = True
            else:
                social_user = student.user.social_auth.filter(provider='google-oauth2').first()
                img_url = student.img_url.replace('sz=50', 'sz=700')
                hasFacebook = False
            hasNotificationsEnabled = RegistrationToken.objects.filter(student=student).exists()
            context = {
                'name': student.user,
                'major': student.major,
                'class': student.class_year,
                'student': student,
                'total': 0,
                'img_url': img_url,
                'hasGoogle': hasGoogle,
                'hasFacebook': hasFacebook,
                'notifications': hasNotificationsEnabled
            }
            for r in reactions:
                context[r['title']] = r['count']
            for r in Reaction.REACTION_CHOICES:
                if r[0] not in context:
                    context[r[0]] = 0
                context['total'] += context[r[0]]
            return render_to_response("profile.html", context, context_instance=RequestContext(request))
        else:
            return signup(request)

    def patch(self, request):
        student = Student.objects.get(user=request.user)
        settings = 'social_offerings social_courses social_all major class_year emails_enabled'.split()
        for setting in settings:
            default_val = getattr(student, setting)
            new_val = request.data.get(setting, default_val)
            setattr(student, setting, new_val)
        student.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserTimetableView(APIView):

    def get(self, request, sem_name, year):
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)
        response = get_student_tts(student, request.subdomain, sem)
        return Response(response, status=status.HTTP_200_OK)

    def post(self, request):
        if 'source' in request.data:  # duplicate existing timetable
            school = request.subdomain
            name = request.data['source']
            semester = Semester.objects.get(**request.data['semester'])
            student = Student.objects.get(user=request.user)
            new_name = request.data['name']

            duplicate = get_object_or_404(PersonalTimetable, student=student, name=name, school=school, semester=semester)
            courses, sections = duplicate.courses.all(), duplicate.sections.all()

            duplicate.pk = None # creates duplicate of object
            duplicate.name = new_name
            duplicate.save()
            duplicate.courses = courses
            duplicate.sections = sections

            timetables = get_student_tts(student, school, semester)
            saved_timetable = (x for x in timetables if x['id'] == duplicate.id).next()
            response = {'timetables': timetables, 'saved_timetable': saved_timetable}

            # TODO: should respond only with created object
            return Response(response, status=status.HTTP_201_CREATED)
        else:
            school = request.subdomain
            has_conflict = request.data['has_conflict']
            name = request.data['name']
            semester, _ = Semester.objects.get_or_create(**request.data['semester'])
            student = Student.objects.get(user=request.user)
            params = {'school': school, 'name': name, 'semester': semester, 'student': student}

            courses = request.data['courses']
            tt_id = request.data.get('id') # id is None if this is a new timetable

            if PersonalTimetable.objects.filter(~Q(id=tt_id), **params):
                return Response(status=status.HTTP_409_CONFLICT)

            personal_timetable = PersonalTimetable.objects.create(**params) if tt_id is None else \
                PersonalTimetable.objects.get(id=tt_id)
            self.update_tt(personal_timetable, name, has_conflict, courses, semester)

            timetables = get_student_tts(student, school, semester)
            saved_timetable = (x for x in timetables if x['id'] == personal_timetable.id).next()
            response = {'timetables': timetables, 'saved_timetable': saved_timetable}

            # TODO: should respond only with created object
            return Response(response, status=status.HTTP_201_CREATED if tt_id is None else status.HTTP_200_OK)

    def delete(self, request, sem_name, year, tt_name):
        school = request.subdomain
        name = tt_name
        semester = Semester.objects.get(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)

        PersonalTimetable.objects.filter(
            student=student, name=name, school=school, semester=semester).delete()

        timetables = get_student_tts(student, school, semester)
        response = {'timetables': timetables}

        # TODO: should respond with deleted object
        return Response(response, status=status.HTTP_200_OK)

    def update_tt(self, tt, new_name, new_has_conflict, new_courses, semester):
        tt.name = new_name
        tt.has_conflict = new_has_conflict

        tt.courses.clear()
        tt.sections.clear()
        for course in new_courses:
            course_obj = Course.objects.get(id=course['id'])
            tt.courses.add(course_obj)
            enrolled_sections = course['enrolled_sections']
            for section in enrolled_sections:
                tt.sections.add(
                    course_obj.section_set.get(meeting_section=section, semester=semester))
        tt.save()


class ClassmateView(APIView):
    def get(self, request, sem_name, year):
        if request.query_params.get('counts'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = map(int, request.query_params.getlist('course_ids'))
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            total_count = 0
            count = 0
            most_friend_course_id = -1
            for course_id in course_ids:
                temp_count = get_friend_count_from_course_id(school, student, course_id, semester)
                if temp_count > count:
                    count = temp_count
                    most_friend_course_id = course_id
                total_count += temp_count
            data = {"id": most_friend_course_id, "count": count, "total_count": total_count}
            return Response(data, status=status.HTTP_200_OK)
        elif request.query_params.getlist('course_ids'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = request.query_params.getlist('course_ids')
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            # user opted in to sharing courses
            if student.social_courses:
                courses = []
                friends = student.friends.filter(social_courses=True)
                for course_id in course_ids:
                    courses.append(get_classmates_from_course_id(school, student, course_id, semester, friends=friends))
                return Response(courses, status=status.HTTP_200_OK)
        else:
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
            current_tt = student.personaltimetable_set.filter(school=school, semester=semester).order_by(
                'last_updated').last()
            if current_tt is None:
                return Response([], status=status.HTTP_200_OK)
            current_tt_courses = current_tt.courses.all()

            # The most recent TT per student with social enabled that has courses in common with input student
            matching_tts = PersonalTimetable.objects.filter(student__social_all=True,
                                                            courses__id__in=current_tt_courses) \
                .exclude(student=student) \
                .order_by('student', 'last_updated') \
                .distinct('student')

            friends = []
            for matching_tt in matching_tts:
                friend = matching_tt.student
                sections_in_common = matching_tt.sections.all() & current_tt.sections.all()
                courses_in_common = matching_tt.courses.all() & current_tt_courses

                shared_courses = []
                for course in courses_in_common:
                    shared_courses.append({
                        'course': model_to_dict(course, exclude=['unstopped_description', 'description', 'credits']),
                        # is there a section for this course that is in both timetables?
                        'in_section': (sections_in_common & course.section_set.all()).exists()
                    })

                friends.append({
                    'peer': model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends']),
                    'is_friend': student.friends.filter(id=friend.id).exists(),
                    'shared_courses': shared_courses,
                    'profile_url': 'https://www.facebook.com/' + friend.fbook_uid,
                    'name': friend.user.first_name + ' ' + friend.user.last_name,
                    'large_img': 'https://graph.facebook.com/' + friend.fbook_uid + '/picture?width=700&height=700'
                })

            friends.sort(key=lambda friend: len(friend['shared_courses']), reverse=True)
            return Response(friends, status=status.HTTP_200_OK)


class GCalView(APIView):
    def post(self, request):
        student = Student.objects.get(user=request.user)
        tt = json.loads(request.body)['timetable']
        credentials = get_google_credentials(student)
        http = credentials.authorize(httplib2.Http(timeout=100000000))
        service = discovery.build('calendar', 'v3', http=http)
        school = request.subdomain

        tt_name = tt.get('name')
        if not tt_name or "Untitled Schedule" in tt_name or len(tt_name) == 0:
            tt_name = "Semester.ly Schedule"
        else:
            tt_name += " - Semester.ly"

        # create calendar
        calendar = {'summary': tt_name, 'timeZone': 'America/New_York'}
        created_calendar = service.calendars().insert(body=calendar).execute()

        semester_name = get_semester_name_from_tt(tt)
        if semester_name == 'Fall':
            # ignore year, year is set to current year
            sem_start = datetime(2017, 8, 30, 17, 0, 0)
            sem_end = datetime(2017, 12, 20, 17, 0, 0)
        else:
            # ignore year, year is set to current year
            sem_start = datetime(2017, 1, 30, 17, 0, 0)
            sem_end = datetime(2017, 5, 5, 17, 0, 0)

        # add events
        for course in tt['courses']:
            for slot in course['slots']:
                start = next_weekday(sem_start, slot['day'])
                start = start.replace(hour=int(slot['time_start'].split(':')[0]),
                                      minute=int(slot['time_start'].split(':')[1]))
                end = next_weekday(sem_start, slot['day'])
                end = end.replace(hour=int(slot['time_end'].split(':')[0]), minute=int(slot['time_end'].split(':')[1]))
                until = next_weekday(sem_end, slot['day'])

                description = course.get('description', '')
                instructors = 'Taught by: ' + slot['instructors'] + '\n' if len(slot.get('instructors', '')) > 0 else ''

                res = {
                    'summary': course['name'] + " " + course['code'] + slot['meeting_section'],
                    'location': slot['location'],
                    'description': course['code'] + slot[
                        'meeting_section'] + '\n' + instructors + description + '\n\n' + 'Created by Semester.ly',
                    'start': {
                        'dateTime': start.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'end': {
                        'dateTime': end.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'recurrence': [
                        'RRULE:FREQ=WEEKLY;UNTIL=' + until.strftime("%Y%m%dT%H%M%SZ") + ';BYDAY=' + DAY_MAP[slot['day']]
                    ],
                }
                event = service.events().insert(calendarId=created_calendar['id'], body=res).execute()

        analytic = CalendarExport.objects.create(
            student=student,
            school=school,
            is_google_calendar=True
        )
        analytic.save()

        return HttpResponse(json.dumps({}), content_type="application/json")


@validate_subdomain
def signup(request):
  try:
    return view_timetable(request, signup=True)
  except Exception as e:
    raise Http404


@csrf_exempt
@validate_subdomain
def react_to_course(request):
    json_data = {}
    school = request.subdomain

    try:
        logged = request.user.is_authenticated()
        params = json.loads(request.body)
        cid = params['cid']
        title = params['title']
        if logged and Student.objects.filter(user=request.user).exists():
            s = Student.objects.get(user=request.user)
            c = Course.objects.get(id=cid)
            if c.reaction_set.filter(title=title, student=s).exists():
                r = c.reaction_set.get(title=title, student=s)
                c.reaction_set.remove(r)
            else:
                r = Reaction(student=s, title=title)
                r.save()
                c.reaction_set.add(r)
            c.save()
            json_data['reactions'] = c.get_reactions(student=s)

        else:
            json_data['error'] = 'Must be logged in to rate'

    except Exception as e:
        print e
        json_data['error'] = 'Unknowssn error'

    return HttpResponse(json.dumps(json_data), content_type="application/json")