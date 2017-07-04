from datetime import datetime
import json

import httplib2
from django.core.urlresolvers import reverse
from django.db.models import Q, Count
from django.forms.models import model_to_dict
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render_to_response, render
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from googleapiclient import discovery
from hashids import Hashids
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from authpipe.utils import get_google_credentials, check_student_token
from analytics.models import CalendarExport
from student.models import Student, Reaction, RegistrationToken, PersonalEvent, PersonalTimetable
from student.utils import next_weekday, get_classmates_from_course_id, make_token, get_student_tts
from timetable.models import Semester, Course
from timetable.serializers import DisplayTimetableSerializer
from timetable.utils import DisplayTimetable
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin
from helpers.decorators import validate_subdomain

DAY_MAP = {
    'M': 'mo',
    'T': 'tu',
    'W': 'we',
    'R': 'th',
    'F': 'fr',
    'S': 'sa',
    'U': 'su'
}

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")


def get_friend_count_from_course_id(school, student, course_id, semester):
    return PersonalTimetable.objects.filter(student__in=student.friends.all(),
                                            courses__id__exact=course_id) \
        .filter(Q(semester=semester)).distinct('student').count()


def create_unsubscribe_link(student):
    token_id, token = make_token(student).split(":", 1)
    return reverse('student.views.unsubscribe',
                   kwargs={'id': token_id, 'token': token})


def unsubscribe(request, student_id, token):
    student = Student.objects.get(id=student_id)

    if student and check_student_token(student, token):
        # Link is valid
        student.emails_enabled = False
        student.save()

        return render(request, 'unsubscribe.html')

    # Link is invalid. Redirect to homepage.
    return HttpResponseRedirect("/")


@csrf_exempt
@validate_subdomain
def log_ical_export(request):
    try:
        student = Student.objects.get(user=request.user)
    except BaseException:
        student = None
    school = request.subdomain
    analytic = CalendarExport.objects.create(
        student=student,
        school=school,
        is_google_calendar=False
    )
    analytic.save()
    return HttpResponse(json.dumps({}), content_type="application/json")


def accept_tos(request):
    student = Student.objects.get(user=request.user)
    student.time_accepted_tos = datetime.today()
    student.save()
    return HttpResponse(status=204)


class UserView(RedirectToSignupMixin, APIView):

    def get(self, request):
        student = Student.objects.get(user=request.user)
        reactions = Reaction.objects.filter(student=student).values('title').annotate(
            count=Count('title'))
        if student.user.social_auth.filter(provider='google-oauth2').exists():
            has_google = True
        else:
            has_google = False
        if student.user.social_auth.filter(provider='facebook').exists():
            img_url = 'https://graph.facebook.com/' + \
                student.fbook_uid + '/picture?width=700&height=700'
            has_facebook = True
        else:
            img_url = student.img_url.replace('sz=50', 'sz=700')
            has_facebook = False
        has_notifications_enabled = RegistrationToken.objects.filter(
            student=student).exists()
        context = {
            'name': student.user,
            'major': student.major,
            'class': student.class_year,
            'student': student,
            'total': 0,
            'img_url': img_url,
            'hasGoogle': has_google,
            'hasFacebook': has_facebook,
            'notifications': has_notifications_enabled
        }
        for r in reactions:
            context[r['title']] = r['count']
        for r in Reaction.REACTION_CHOICES:
            if r[0] not in context:
                context[r[0]] = 0
            context['total'] += context[r[0]]
        return render_to_response("profile.html", context,
                                  context_instance=RequestContext(request))

    def patch(self, request):
        student = get_object_or_404(Student, user=request.user)
        settings = 'social_offerings social_courses social_all major class_year ' \
                   'emails_enabled'.split()
        for setting in settings:
            default_val = getattr(student, setting)
            new_val = request.data.get(setting, default_val)
            setattr(student, setting, new_val)
        student.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserTimetableView(ValidateSubdomainMixin,
                        RedirectToSignupMixin, APIView):

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

            duplicate = get_object_or_404(PersonalTimetable, student=student, name=name,
                                          school=school, semester=semester)
            # save manytomany relationships before copying
            courses, sections = duplicate.courses.all(), duplicate.sections.all()
            events = duplicate.events.all()
            for event in events:  # create duplicates of each event to allow for safe delete
                event.pk = None
                event.save()

            duplicate.pk = None  # creates duplicate of object
            duplicate.name = new_name
            duplicate.save()
            duplicate.courses = courses
            duplicate.sections = sections
            duplicate.events = events

            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            # TODO: use new request shape
            school = request.subdomain
            has_conflict = request.data['has_conflict']
            name = request.data['name']
            semester, _ = Semester.objects.get_or_create(
                **request.data['semester'])
            student = Student.objects.get(user=request.user)
            params = {
                'school': school,
                'name': name,
                'semester': semester,
                'student': student}

            courses = request.data['courses']
            # id is None if this is a new timetable
            tt_id = request.data.get('id')

            if PersonalTimetable.objects.filter(~Q(id=tt_id), **params):
                return Response(status=status.HTTP_409_CONFLICT)

            personal_timetable = PersonalTimetable.objects.create(**params) if tt_id is None else \
                PersonalTimetable.objects.get(id=tt_id)
            self.update_tt(
                personal_timetable,
                name,
                has_conflict,
                courses,
                semester)
            self.update_events(personal_timetable, request.data['events'])

            return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, sem_name, year, tt_name):
        school = request.subdomain
        name = tt_name
        semester = Semester.objects.get(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)

        to_delete = PersonalTimetable.objects.filter(
            student=student, name=name, school=school, semester=semester)
        for tt in to_delete:
            tt.events.all().delete()
        to_delete.delete()

        # TODO: should respond with deleted object
        return Response(status=status.HTTP_204_NO_CONTENT)

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

    def update_events(self, tt, events):
        to_delete = tt.events.all()
        tt.events.clear()
        to_delete.delete()
        for event in events:
            event_obj = PersonalEvent.objects.create(name=event['name'],
                                                     time_start=event['time_start'],
                                                     time_end=event['time_end'],
                                                     day=event['day'])
            tt.events.add(event_obj)
        tt.save()


class ClassmateView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):

    def get(self, request, sem_name, year):
        if request.query_params.get('count'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = map(int, request.query_params.getlist('course_ids[]'))
            semester, _ = Semester.objects.get_or_create(
                name=sem_name, year=year)
            total_count = 0
            count = 0
            most_friend_course_id = -1
            for course_id in course_ids:
                temp_count = get_friend_count_from_course_id(
                    school, student, course_id, semester)
                if temp_count > count:
                    count = temp_count
                    most_friend_course_id = course_id
                total_count += temp_count
            data = {
                "id": most_friend_course_id,
                "count": count,
                "total_count": total_count}
            return Response(data, status=status.HTTP_200_OK)
        elif request.query_params.getlist('course_ids[]'):
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            course_ids = map(int, request.query_params.getlist('course_ids[]'))
            semester, _ = Semester.objects.get_or_create(
                name=sem_name, year=year)
            # user opted in to sharing courses
            course_to_classmates = []
            if student.social_courses:
                friends = student.friends.filter(social_courses=True)
                for course_id in course_ids:
                    course_to_classmates[course_id] = \
                        get_classmates_from_course_id(school, student, course_id, semester,
                                                      friends=friends)
            return Response(course_to_classmates, status=status.HTTP_200_OK)
        else:
            school = request.subdomain
            student = Student.objects.get(user=request.user)
            semester, _ = Semester.objects.get_or_create(
                name=sem_name, year=year)
            current_tt = student.personaltimetable_set.filter(school=school,
                                                              semester=semester).order_by(
                'last_updated').last()
            if current_tt is None:
                return Response([], status=status.HTTP_200_OK)
            current_tt_courses = current_tt.courses.all()

            # The most recent TT per student with social enabled that has
            # courses in common with input student
            matching_tts = PersonalTimetable.objects.filter(student__social_all=True,
                                                            courses__id__in=current_tt_courses,
                                                            semester=semester) \
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
                        'course': model_to_dict(course,
                                                exclude=['unstopped_description', 'description',
                                                         'credits']),
                        # is there a section for this course that is in both
                        # timetables?
                        'in_section': (sections_in_common & course.section_set.all()).exists()
                    })

                friends.append({
                    'peer': model_to_dict(friend, exclude=['user', 'id', 'fbook_uid', 'friends']),
                    'is_friend': student.friends.filter(id=friend.id).exists(),
                    'shared_courses': shared_courses,
                    'profile_url': 'https://www.facebook.com/' + friend.fbook_uid,
                    'name': friend.user.first_name + ' ' + friend.user.last_name,
                    'large_img': 'https://graph.facebook.com/' + friend.fbook_uid +
                                 '/picture?width=700&height=700'
                })

            friends.sort(
                key=lambda friend: len(
                    friend['shared_courses']),
                reverse=True)
            return Response(friends, status=status.HTTP_200_OK)


# TODO: use new request shape
class GCalView(RedirectToSignupMixin, APIView):

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

        semester_name = tt['semester']['name']
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
                end = end.replace(hour=int(slot['time_end'].split(':')[0]),
                                  minute=int(slot['time_end'].split(':')[1]))
                until = next_weekday(sem_end, slot['day'])

                description = course.get('description', '')
                instructors = 'Taught by: ' + slot['instructors'] + '\n' if len(
                    slot.get('instructors', '')) > 0 else ''

                res = {
                    'summary': course['name'] + " " + course['code'] + slot['meeting_section'],
                    'location': slot['location'],
                    'description': course['code'] + slot['meeting_section'] + '\n' + instructors +
                    description + '\n\n' + 'Created by Semester.ly',
                    'start': {
                        'dateTime': start.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'end': {
                        'dateTime': end.strftime("%Y-%m-%dT%H:%M:%S"),
                        'timeZone': 'America/New_York',
                    },
                    'recurrence': [
                        'RRULE:FREQ=WEEKLY;UNTIL=' + until.strftime("%Y%m%dT%H%M%SZ") + ';BYDAY=' +
                        DAY_MAP[slot['day']]
                    ],
                }
                service.events().insert(
                    calendarId=created_calendar['id'],
                    body=res).execute()

        analytic = CalendarExport.objects.create(
            student=student,
            school=school,
            is_google_calendar=True
        )
        analytic.save()

        return HttpResponse(json.dumps({}), content_type="application/json")


class ReactionView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):

    def post(self, request):
        cid = request.data['cid']
        title = request.data['title']
        student = get_object_or_404(Student, user=request.user)
        course = Course.objects.get(id=cid)
        if course.reaction_set.filter(title=title, student=student).exists():
            reaction = course.reaction_set.get(title=title, student=student)
            course.reaction_set.remove(reaction)
            reaction.delete()
        else:
            reaction = Reaction(student=student, title=title)
            reaction.save()
            course.reaction_set.add(reaction)
        course.save()

        response = {'reactions': course.get_reactions(student=student)}
        return Response(response, status=status.HTTP_200_OK)
