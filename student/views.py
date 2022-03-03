# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import json

from django.urls import reverse
from django.db.models import Q, Count
from django.forms.models import model_to_dict
from django.http import Http404, HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from hashids import Hashids
from rest_framework.generics import GenericAPIView
from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.mixins import UpdateModelMixin
from decimal import Decimal

from authpipe.utils import check_student_token
from analytics.models import CalendarExport
from courses.serializers import CourseSerializer
from student.models import (
    Student,
    Reaction,
    RegistrationToken,
    PersonalEvent,
    PersonalTimetable,
)
from student.utils import (
    get_classmates_from_course_id,
    get_friend_count_from_course_id,
    get_student,
    get_student_tts,
)
from timetable.models import Semester, Course, Section
from timetable.serializers import (
    DisplayTimetableSerializer,
    EventSerializer,
    PersonalTimeTablePreferencesSerializer,
)
from helpers.mixins import ValidateSubdomainMixin, RedirectToSignupMixin
from helpers.decorators import validate_subdomain
from semesterly.settings import get_secret

hashids = Hashids(salt=get_secret("HASHING_SALT"))


@csrf_exempt
@validate_subdomain
def log_ical_export(request):
    """
    Logs that a calendar was exported on the frotnend and indicates
    it was downloaded rather than exported to Google calendar.
    """
    try:
        student = Student.objects.get(user=request.user)
    except BaseException:
        student = None
    school = request.subdomain
    analytic = CalendarExport.objects.create(
        student=student, school=school, is_google_calendar=False
    )
    analytic.save()
    return HttpResponse(json.dumps({}), content_type="application/json")


def accept_tos(request):
    """
    Accepts the terms of services for a user, saving the :obj:`datetime` the
    terms were accepted.
    """
    student = Student.objects.get(user=request.user)
    student.time_accepted_tos = timezone.now()
    student.save()
    return HttpResponse(status=204)


class UserView(RedirectToSignupMixin, APIView):
    """Handles the accessing and mutating of user information and preferences."""

    def get(self, request):
        """
        Renders the user profile/stats page which indicates all of a student's
        reviews of courses, what social they have connected, whether notificaitons
        are enabled, etc.
        """
        student: Student = Student.objects.get(user=request.user)
        img_url = (
            f"https://graph.facebook.com/{student.fbook_uid}/picture?width=700&height=700"
            if student.is_signed_up_through_fb()
            else student.img_url.replace("sz=50", "sz=700")
        )
        context = {
            "name": f"{student.user.first_name} {student.user.last_name}",
            "major": student.major,
            "class": student.class_year,
            "student": student,
            "total": 0,
            "img_url": img_url,
            "hasGoogle": student.is_signed_up_through_google(),
            "hasFacebook": student.is_signed_up_through_fb(),
            "hasJHU": student.is_signed_up_through_jhu(),
            "notifications": RegistrationToken.objects.filter(student=student).exists(),
        }
        if student.preferred_name:
            context["name"] = student.preferred_name

        self.add_reactions(context, student)
        return render(request, "profile.html", context)

    def add_reactions(self, context, student):
        reactions = (
            Reaction.objects.filter(student=student)
            .values("title")
            .annotate(count=Count("title"))
        )
        for r in reactions:
            context[r["title"]] = r["count"]
        for r in Reaction.REACTION_CHOICES:
            if r[0] not in context:
                context[r[0]] = 0
            context["total"] += context[r[0]]

    def patch(self, request):
        """
        Updates a user settings to match the corresponding values passed in the
        request body. (e.g. social_courses, class_year, major)
        """
        student = get_object_or_404(Student, user=request.user)
        settings = (
            "social_offerings social_courses social_all major class_year "
            "emails_enabled".split()
        )
        for setting in settings:
            default_val = getattr(student, setting)
            new_val = request.data.get(setting, default_val)
            setattr(student, setting, new_val)
        student.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request):
        """Delete this user and all of its data"""
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserTimetableView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    """
    Responsible for the viewing and managing of all Students'
    :obj:`PersonalTimetable`.
    """

    def get(self, request, sem_name, year):
        """Returns student's personal timetables"""
        sem, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)
        timetables = student.personaltimetable_set.filter(
            school=request.subdomain, semester=sem
        ).order_by("-last_updated")
        courses = {
            course for timetable in timetables for course in timetable.courses.all()
        }
        context = {"semester": sem, "school": request.subdomain, "student": student}
        return Response(
            {
                "timetables": DisplayTimetableSerializer.from_model(
                    timetables, many=True
                ).data,
                "courses": CourseSerializer(courses, context=context, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Duplicates a personal timetable if a 'source' is provided. Else, creates
        a personal timetable based on the courses, custom events, preferences, etc.
        which are provided.
        """
        if "source" in request.data:  # duplicate existing timetable
            return self.duplicate_timetable(request)
        else:
            return self.create_or_update_timetable(request)

    def duplicate_timetable(self, request):
        school = request.subdomain
        name = request.data["source"]
        semester = Semester.objects.get(**request.data["semester"])
        student = Student.objects.get(user=request.user)
        new_name = request.data["name"]
        duplicate = get_object_or_404(
            PersonalTimetable,
            student=student,
            name=name,
            school=school,
            semester=semester,
        )
        courses, sections, events = self.get_duplicate_m2m_fields(duplicate)
        self.create_duplicated_timetable(new_name, duplicate, courses, sections, events)
        response = {
            "timetables": get_student_tts(student, school, semester),
            "saved_timetable": DisplayTimetableSerializer.from_model(duplicate).data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def get_duplicate_m2m_fields(self, duplicate):
        # save manytomany relationships before copying
        courses, sections = duplicate.courses.all(), duplicate.sections.all()
        events = duplicate.events.all()
        for event in events:  # create duplicates of each event to allow for safe delete
            event.pk = None
            event.save()
        return courses, sections, events

    def create_duplicated_timetable(
        self, new_name, duplicate, courses, sections, events
    ):
        duplicate.pk = None  # creates duplicate of object
        duplicate.name = new_name
        duplicate.save()
        duplicate.courses.set(courses)
        duplicate.sections.set(sections)
        duplicate.events.set(events)

    def create_or_update_timetable(self, request):
        school = request.subdomain
        name = request.data["name"]
        semester, _ = Semester.objects.get_or_create(**request.data["semester"])
        student = Student.objects.get(user=request.user)
        params = {
            "school": school,
            "name": name,
            "semester": semester,
            "student": student,
        }
        tt_id = request.data.get("id")  # id is None if this is a new timetable
        if PersonalTimetable.objects.filter(~Q(id=tt_id), **params):
            return Response(status=status.HTTP_409_CONFLICT)

        personal_timetable = (
            PersonalTimetable.objects.create(**params)
            if tt_id is None
            else PersonalTimetable.objects.get(id=tt_id)
        )
        slots = request.data["slots"]
        self.update_tt(personal_timetable, name, slots)
        self.update_events(personal_timetable, request.data["events"])

        response = {
            "timetables": get_student_tts(student, school, semester),
            "saved_timetable": DisplayTimetableSerializer.from_model(
                personal_timetable
            ).data,
        }
        response_status = (
            status.HTTP_201_CREATED if tt_id is None else status.HTTP_200_OK
        )
        return Response(response, status=response_status)

    def update_tt(self, tt, new_name, new_slots):
        tt.name = new_name

        tt.courses.clear()
        tt.sections.clear()
        added_courses = set()
        for slot in new_slots:
            section_id = slot["section"]
            section = Section.objects.get(id=section_id)
            tt.sections.add(section)
            if section.course.id not in added_courses:
                tt.courses.add(section.course)
                added_courses.add(section.course.id)

        tt.save()

    def update_events(self, tt, events):
        """Replace tt's events with input events. Deletes all old events to avoid
        buildup in db"""
        tt.events.all().delete()
        for event in events:
            credits = self.validate_credits(event)
            self.validate_time(event["time_start"], event["time_end"])
            event_obj = PersonalEvent.objects.create(
                timetable=tt,
                name=event["name"],
                time_start=event["time_start"],
                time_end=event["time_end"],
                day=event["day"],
                color=event["color"],
                location=event["location"],
                credits=credits,
            )
            tt.events.add(event_obj)
        tt.save()

    def validate_credits(self, event):
        credits = Decimal(event["credits"])
        if credits % Decimal(0.5) != 0:
            raise serializers.ValidationError("Field credit must be multiples 0f 0.5")
        if credits < 0 or credits > 20:
            raise serializers.ValidationError("Field credit must be between 0 and 20")
        return credits

    def validate_time(self, time_start: str, time_end: str):
        start_minutes = self.convert_to_minutes(time_start)
        end_minutes = self.convert_to_minutes(time_end)
        print(end_minutes, start_minutes, end_minutes - start_minutes)
        if end_minutes - start_minutes < 10:
            raise serializers.ValidationError(
                "Time start must come before time end by at least 10 minutes."
            )

    def convert_to_minutes(self, time: str):
        hours, minutes = time.split(":")
        return 60 * int(hours) + int(minutes)

    def delete(self, request, sem_name, year, tt_name):
        """Deletes a PersonalTimetable by name/year/term."""
        school = request.subdomain
        name = tt_name
        semester = Semester.objects.get(name=sem_name, year=year)
        student = Student.objects.get(user=request.user)

        to_delete = PersonalTimetable.objects.filter(
            student=student, name=name, school=school, semester=semester
        )
        for tt in to_delete:
            tt.events.all().delete()
        to_delete.delete()

        return Response(
            {"timetables": get_student_tts(student, school, semester)},
            status=status.HTTP_200_OK,
        )


class UserTimetablePreferenceView(
    ValidateSubdomainMixin, RedirectToSignupMixin, GenericAPIView, UpdateModelMixin
):
    """
    Used to update timetable preferences
    """

    serializer_class = PersonalTimeTablePreferencesSerializer

    def get_queryset(self):
        return PersonalTimetable.objects.filter(student__user=self.request.user)

    def put(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class ClassmateView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    """
    Handles the computation of classmates for a given course, timetable, or simply
    the count of all classmates for a given timetable.
    """

    def get(self, request, sem_name, year):
        """
        Returns:
            **If the query parameter 'count' is present**
            Information regarding the number of friends only::

                {
                    "id": Course with the most friends,
                    "count": The maximum # of friends in a course,
                    "total_count": the total # in all classes on timetable,
                }

            **If the query parameter course_ids is present** a list of dictionaries
            representing past classmates and current classmates. These are students who
            the authenticated user is friends with and who has social courses enabled.::

                [{
                    "course_id":6137,
                    "past_classmates":[...],
                    "classmates":[...]
                }, ...]

            **Otherwise** a list of friends and non-friends alike who have social_all
            enabled to be displayed in the "find-friends" modal. Sorted by the number
            courses the authenticated user shares.::

                [{
                    "name": "...",
                    "is_friend": Whether or not the user is current user's friend,
                    "profile_url": link to FB profile,
                    "shared_courses": [...],
                    "peer": Info about the user,
                }, ...]
        """
        if request.query_params.get("count"):
            return self.get_number_of_friends(request, sem_name, year)
        elif request.query_params.getlist("course_ids[]"):
            return self.get_social_friends(request, sem_name, year)
        else:
            return self.get_social_users(request, sem_name, year)

    def get_number_of_friends(self, request, sem_name, year):
        student = Student.objects.get(user=request.user)
        course_ids = list(map(int, request.query_params.getlist("course_ids[]")))
        semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        total_count, count, most_friend_course_id = self.count_number_of_friends(
            student, course_ids, semester
        )
        data = {
            "id": most_friend_course_id,
            "count": count,
            "total_count": total_count,
        }
        return Response(data, status=status.HTTP_200_OK)

    def count_number_of_friends(self, student, course_ids, semester):
        total_count = 0
        count = 0
        most_friend_course_id = -1
        for course_id in course_ids:
            temp_count = get_friend_count_from_course_id(student, course_id, semester)
            if temp_count > count:
                count = temp_count
                most_friend_course_id = course_id
            total_count += temp_count
        return total_count, count, most_friend_course_id

    def get_social_friends(self, request, sem_name, year):
        school = request.subdomain
        student = Student.objects.get(user=request.user)
        course_ids = list(map(int, request.query_params.getlist("course_ids[]")))
        semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        # user opted in to sharing courses
        course_to_classmates = {}
        if student.social_courses:
            friends = student.friends.filter(social_courses=True)
            for course_id in course_ids:
                course_to_classmates[course_id] = get_classmates_from_course_id(
                    school, student, course_id, semester, friends=friends
                )
        return Response(course_to_classmates, status=status.HTTP_200_OK)

    def get_social_users(self, request, sem_name, year):
        school = request.subdomain
        student = Student.objects.get(user=request.user)
        semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
        current_tt = self.get_current_tt(school, student, semester)
        if current_tt is None:
            return Response([], status=status.HTTP_200_OK)
        current_tt_courses = current_tt.courses.all()
        matching_tts = self.get_matching_tts(student, semester, current_tt_courses)
        social_users = self.count_social_users(
            student, current_tt, current_tt_courses, matching_tts
        )
        return Response(social_users, status=status.HTTP_200_OK)

    def get_current_tt(self, school, student, semester):
        return (
            student.personaltimetable_set.filter(school=school, semester=semester)
            .order_by("last_updated")
            .last()
        )

    def get_matching_tts(self, student, semester, current_tt_courses):
        # The most recent TT per student with social enabled that has
        # courses in common with input student
        return (
            PersonalTimetable.objects.filter(
                student__social_all=True,
                courses__id__in=current_tt_courses,
                semester=semester,
            )
            .exclude(student=student)
            .order_by("student", "last_updated")
            .distinct("student")
        )

    def count_social_users(self, student, current_tt, current_tt_courses, matching_tts):
        social_users = []
        for matching_tt in matching_tts:
            friend = matching_tt.student
            sections_in_common = matching_tt.sections.all() & current_tt.sections.all()
            courses_in_common = matching_tt.courses.all() & current_tt_courses
            shared_courses = [
                self.create_shared_course(sections_in_common, course)
                for course in courses_in_common
            ]
            social_users.append(
                self.create_social_user_dict(student, friend, shared_courses)
            )
        social_users.sort(
            key=lambda friend: len(friend["shared_courses"]), reverse=True
        )
        return social_users

    def create_shared_course(self, sections_in_common, course):
        return {
            "course": model_to_dict(
                course,
                exclude=[
                    "unstopped_description",
                    "description",
                    "credits",
                    "related_courses",
                ],
            ),
            # is there a section for this course that is in both timetables?
            "in_section": (sections_in_common & course.section_set.all()).exists(),
        }

    def create_social_user_dict(self, student, friend, shared_courses):
        return {
            "peer": model_to_dict(
                friend, exclude=["user", "id", "fbook_uid", "friends"]
            ),
            "is_friend": student.friends.filter(id=friend.id).exists(),
            "shared_courses": shared_courses,
            "profile_url": "https://www.facebook.com/" + friend.fbook_uid,
            "name": friend.user.first_name + " " + friend.user.last_name,
            "large_img": "https://graph.facebook.com/"
            + friend.fbook_uid
            + "/picture?width=700&height=700",
        }


class ReactionView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    """
    Manages the creation of Reactions to courses.
    """

    def post(self, request):
        """
        Create a Reaction for the given course id, with the given title matching
        one of the possible emojis. If already present, remove that reaction.
        """
        cid = request.data["cid"]
        title = request.data["title"]
        student = get_object_or_404(Student, user=request.user)
        course = Course.objects.get(id=cid)
        if self.reaction_exists(title, student, course):
            self.remove_reaction(title, student, course)
        else:
            self.create_reaction(title, student, course)
        course.save()

        response = {"reactions": course.get_reactions(student=student)}
        return Response(response, status=status.HTTP_200_OK)

    def reaction_exists(self, title, student, course):
        return course.reaction_set.filter(title=title, student=student).exists()

    def create_reaction(self, title, student, course):
        reaction = Reaction(student=student, title=title)
        reaction.save()
        course.reaction_set.add(reaction)

    def remove_reaction(self, title, student, course):
        reactions = course.reaction_set.filter(title=title, student=student)
        course.reaction_set.filter(pk__in=reactions).delete()
        reactions.delete()


class PersonalEventView(ValidateSubdomainMixin, RedirectToSignupMixin, APIView):
    def post(self, request: HttpRequest):
        try:
            event = PersonalEvent.objects.get(id=request.data["id"])
        except PersonalEvent.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if event.timetable.student != get_student(request):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
