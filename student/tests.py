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

from attr import Attribute
from django.contrib.auth.models import User
from django.test import TestCase, RequestFactory
from django.urls import resolve
from django.forms.models import model_to_dict
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from student.models import (
    Student,
    PersonalTimetable,
    Reaction,
    PersonalEvent,
    RegistrationToken,
)
from timetable.models import Semester, Course, Section, Offering
from helpers.test.utils import (
    create_user,
    create_student,
    get_response,
    get_auth_response,
)
from helpers.test.test_cases import UrlTestCase
from timetable.serializers import EventSerializer
from student.serializers import StudentSerializer, get_student_dict
from analytics.models import CalendarExport
from student.views import UserView, UserTimetableView
from rest_framework import serializers
import rest_framework


class SerializersTest(TestCase):
    """Test student/serializers.py"""

    def setUp(self):
        self.user = create_user(username="thomas", password="opensesame")
        self.preferred_name = "Thomas"
        self.class_year = 2022
        self.major = "Physics"
        self.jhed = "jhed1"
        self.school = "jhu"
        self.student = create_student(
            user=self.user,
            preferred_name=self.preferred_name,
            class_year=self.class_year,
            major=self.major,
            school=self.school,
            jhed=self.jhed,
        )
        self.semester = Semester.objects.create(name="Spring", year="2022")

    def test_get_student_dict_exists(self):
        user_dict = get_student_dict(self.school, self.student, self.semester)
        self.assertTrue(user_dict["isLoggedIn"])

    def test_get_student_dict_not_exist(self):
        user_dict = get_student_dict(self.school, None, self.semester)
        self.assertFalse(user_dict["isLoggedIn"])

    def test_student_serializer(self):
        serialized = StudentSerializer(
            self.student,
        ).data
        self.assertEquals(serialized["userFirstName"], "")
        self.assertEquals(serialized["userLastName"], "")
        self.assertEquals(serialized["preferred_name"], self.preferred_name)
        self.assertEquals(serialized["major"], self.major)


class MiscellaneousTest(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = create_user(username="Alice", password="security")
        self.student1 = create_student(user=self.user1)

    def test_log_ical_export_student_exists(self):
        url = "/user/log_ical/"
        request = self.factory.get(url, {}, format="json")
        response = get_auth_response(
            request,
            self.user1,
            url,
        )
        self.assertEquals(len(CalendarExport.objects.all()), 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_log_ical_export_student_does_not_exist(self):
        url = "/user/log_ical/"
        request = self.factory.get(url, {}, format="json")
        self.user2 = create_user(username="Bob", password="super_secure")
        response = get_auth_response(
            request,
            self.user2,
            url,
        )
        self.assertEquals(len(CalendarExport.objects.all()), 1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_accept_tos(self):
        url = "/tos/accept/"
        request = self.factory.get(url, {}, format="json")
        response = get_auth_response(
            request,
            self.user1,
            url,
        )
        self.assertEquals(response.status_code, 204)


class UrlsTest(UrlTestCase):
    """Test student/urls.py"""

    def test_urls_call_correct_views(self):
        # profile management

        self.assertUrlResolvesToView("/user/settings/", "student.views.UserView")

        # timetable management
        self.assertUrlResolvesToView(
            "/user/timetables/", "student.views.UserTimetableView"
        )
        self.assertUrlResolvesToView(
            "/user/timetables/Fall/2016/",
            "student.views.UserTimetableView",
            kwargs={"sem_name": "Fall", "year": "2016"},
        )
        self.assertUrlResolvesToView(
            "/user/timetables/Fall/2016/mytt/",
            "student.views.UserTimetableView",
            kwargs={"sem_name": "Fall", "year": "2016", "tt_name": "mytt"},
        )
        # social
        self.assertUrlResolvesToView(
            "/user/classmates/Fall/2016?courseids=1&courseids=2",
            "student.views.ClassmateView",
            kwargs={"sem_name": "Fall", "year": "2016"},
        )
        self.assertUrlResolvesToView("/user/reactions/", "student.views.ReactionView")
        self.assertUrlResolvesToView(
            "/delete_account/", "helpers.mixins.FeatureFlowView"
        )
        self.assertUrlResolvesToView("/user/events/", "student.views.PersonalEventView")
        self.assertUrlResolvesToView(
            "/user/timetables/6/preferences/",
            "student.views.UserTimetablePreferenceView",
        )


class UserViewTest(APITestCase):
    def setUp(self):
        self.user = create_user(username="jacob", password="top_secret")
        self.student = create_student(
            user=self.user, preferred_name="jac", major="STAD"
        )
        self.school = "jhu"
        self.course1 = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD"
        )
        self.course2 = Course.objects.create(
            id=3, school=self.school, code="SEM103", name="STAD2"
        )
        self.factory = APIRequestFactory()

    def test_profile_page(self):
        self.client.force_login(self.user)
        response = self.client.get("/user/settings/")
        self.assertTemplateUsed(response, "profile.html")

    def test_profile_page_context(self):
        self.client.force_login(self.user)
        response = self.client.get("/user/settings/")
        self.assertEquals(response.context["major"], "STAD")
        self.assertEquals(response.context["student"], self.student)

    def test_profile_page_not_signed_in(self):
        self.client.logout()
        response = self.client.get("/user/settings/")
        self.assertRedirects(response, "/signup/")

    def test_add_reactions(self):
        view = UserView()
        context = {"total": 0}
        reaction1 = Reaction.objects.create(student=self.student, title="FIRE")
        reaction2 = Reaction.objects.create(student=self.student, title="CRAP")
        reaction1.course.add(self.course1)
        reaction2.course.add(self.course2)
        view.add_reactions(context, self.student)
        self.assertEquals(context["total"], 2)
        self.assertEquals(context["CRAP"], 1)
        self.assertEquals(context["FIRE"], 1)

    def test_update_settings(self):
        new_settings = {"emails_enabled": True, "social_courses": True, "major": "CS"}
        request = self.factory.patch("/user/settings/", new_settings, format="json")
        response = get_auth_response(request, self.user, "/user/settings/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.student = Student.objects.get(user=self.user)
        self.assertDictContainsSubset(new_settings, model_to_dict(self.student))

    def test_delete_user(self):
        sem = Semester.objects.create(name="Winter", year="2000")
        course = Course.objects.create(school="skool", code="A101", name="intro")
        section = Section.objects.create(
            course=course, meeting_section="A", semester=sem
        )
        reaction = Reaction.objects.create(student=self.student, title="FIRE")
        reaction.course.add(course)
        reaction.save()

        tt = PersonalTimetable.objects.create(
            semester=sem, school="skool", name="mytt", student=self.student
        )
        event = PersonalEvent.objects.create(
            name="gym", day="T", time_start="8:00", time_end="9:00"
        )
        tt.events.add(event)
        tt.courses.add(course)
        tt.sections.add(section)
        tt.save()

        request = self.factory.delete("/user/settings/")
        response = get_auth_response(request, self.user, "/user/settings/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # all student related data should be deleted
        self.assertFalse(User.objects.exists())
        self.assertFalse(Student.objects.exists())
        self.assertFalse(PersonalTimetable.objects.exists())
        self.assertFalse(PersonalEvent.objects.exists())
        self.assertFalse(RegistrationToken.objects.exists())

        # course data should be untouched
        self.assertTrue(Course.objects.exists())
        self.assertTrue(Section.objects.exists())
        self.assertTrue(Semester.objects.exists())


class UserTimetableViewTest(APITestCase):
    def setUp(self):
        """Create a user and personal timetable."""
        self.user = create_user(username="jacob", password="top_secret")
        self.student = create_student(user=self.user)
        self.sem = Semester.objects.create(name="Winter", year="1995")

        course = Course.objects.create(id=1, school="uoft", code="SEM101", name="Intro")
        section = Section.objects.create(
            id=1, course=course, semester=self.sem, meeting_section="L1"
        )
        Offering.objects.create(
            id=1,
            section=section,
            day="M",
            date_start="08-29-1995",
            date_end="12-10-1995",
            time_start="8:00",
            time_end="10:00",
        )
        tt = PersonalTimetable.objects.create(
            name="tt", school="uoft", semester=self.sem, student=self.student
        )
        tt.courses.add(course)
        tt.sections.add(section)
        tt.save()

        self.factory = APIRequestFactory()

    def test_get_timetables(self):
        request = self.factory.get("/user/timetables/Winter/1995/", format="json")
        response = get_auth_response(
            request, self.user, "/user/timetables/Winter/1995/", "Winter", "1995"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["timetables"]), 1)
        self.assertEqual(len(response.data["courses"]), 1)

    def test_create_timetable(self):
        data = {
            "semester": {"name": "Winter", "year": "1995"},
            "slots": [
                {
                    "course": 1,
                    "section": 1,
                    "offerings": [1],
                }
            ],
            "events": [],
            "name": "new tt",
            "has_conflict": False,
        }
        request = self.factory.post("/user/timetables/", data, format="json")
        response = get_auth_response(request, self.user, "/user/timetables/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        PersonalTimetable.objects.get(name="new tt")

    def test_create_timetable_exists(self):
        data = {
            "semester": {"name": "Winter", "year": "1995"},
            "slots": [
                {
                    "course": 1,
                    "section": 1,
                    "offerings": [1],
                }
            ],
            "events": [],
            "name": "tt",
            "has_conflict": False,
        }
        request = self.factory.post("/user/timetables/", data, format="json")
        force_authenticate(request, user=self.user)
        response = get_auth_response(request, self.user, "/user/timetables/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_duplicate_timetable(self):
        data = {
            "source": "tt",
            "semester": {"name": "Winter", "year": "1995"},
            "name": "dupe tt",
        }
        request = self.factory.post("/user/timetables/", data, format="json")
        response = get_auth_response(request, self.user, "/user/timetables/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        PersonalTimetable.objects.get(name="dupe tt")

    def test_get_duplicate_m2m_fields(self):
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        view = UserTimetableView()
        course1 = Course.objects.create(id=10, school="jhu", code="SEM103", name="STAD")
        section1 = Section.objects.create(
            course=course1, semester=self.sem, meeting_section="L1"
        )
        course2 = Course.objects.create(id=11, school="jhu", code="SEM104", name="Algo")
        section2 = Section.objects.create(
            course=course2, semester=self.sem, meeting_section="L1"
        )
        PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:50",
            time_end="10:10",
        )
        testTimetable.courses.add(course1)
        testTimetable.courses.add(course2)
        testTimetable.sections.add(section1)
        testTimetable.sections.add(section2)
        courses, sections, events = view.get_duplicate_m2m_fields(testTimetable)
        self.assertEquals(courses[0], course1)
        self.assertEquals(courses[1], course2)
        self.assertEquals(sections[0], section1)
        self.assertEquals(sections[1], section2)
        self.assertTrue(events)

    def test_rename_timetable(self):
        data = {
            "id": 10,
            "semester": {"name": "Winter", "year": "1995"},
            "slots": [
                {
                    "course": 1,
                    "section": 1,
                    "offerings": [1],
                }
            ],
            "events": [],
            "name": "renamed",
            "has_conflict": False,
        }
        PersonalTimetable.objects.create(
            id=10, name="oldtt", school="uoft", semester=self.sem, student=self.student
        )
        request = self.factory.post("/user/timetables/", data, format="json")
        response = get_auth_response(request, self.user, "/user/timetables/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PersonalTimetable.objects.get(id=10).name, "renamed")

    def test_delete_timetable(self):
        PersonalTimetable.objects.create(
            name="todelete",
            school="uoft",
            semester=self.sem,
            student=self.student,
        )
        request = self.factory.delete("/user/timetables/Winter/1995/todelete")
        response = get_auth_response(
            request,
            self.user,
            "/user/timetables/",
            "Winter",
            "1995",
            "todelete",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PersonalTimetable.objects.filter(name="todelete").exists())

    def test_update_timetable_preference(self):
        timetable = PersonalTimetable.objects.create(
            name="todelete",
            school="uoft",
            semester=self.sem,
            student=self.student,
            show_weekend=True,
            has_conflict=True,
        )
        data = {"show_weekend": False, "has_conflict": False}
        endpoint = f"/user/timetables/{timetable.id}/preferences/"
        request = self.factory.put(endpoint, data, format="json")
        get_auth_response(request, self.user, endpoint, pk=timetable.id)
        modified_timetable = PersonalTimetable.objects.get(id=timetable.id)
        self.assertEqual(modified_timetable.has_conflict, False)
        self.assertEqual(modified_timetable.show_weekend, False)

    def test_update_events(self):
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        testTimetableModified = PersonalTimetable.objects.create(
            name="newTimetable", school="jhu", semester=self.sem, student=self.student
        )

        event1 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:30",
            time_end="10:35",
            credits=0.0,
        )
        event2 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="birthday",
            day="S",
            time_start="09:20",
            time_end="10:30",
            credits=0.0,
        )
        event3 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="oose meeting",
            day="M",
            time_start="14:30",
            time_end="16:40",
            credits=0.5,
        )
        self.assertEquals(len(PersonalEvent.objects.all()), 3)
        event1_serialized = EventSerializer(event1).data
        event2_serialized = EventSerializer(event2).data
        event3_serialized = EventSerializer(event3).data
        events = [event1_serialized, event2_serialized, event3_serialized]
        view = UserTimetableView()
        view.update_events(testTimetable, events)
        newEvents = testTimetable.events.all()
        self.assertEquals(len(newEvents), 3)

    def test_validate_credits_not_divisible_by_point_five(self):
        view = UserTimetableView()
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        event1 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:30",
            time_end="10:35",
            credits=0.3,
        )
        event1_serialized = EventSerializer(event1).data
        self.assertRaises(
            rest_framework.exceptions.ValidationError,
            view.validate_credits,
            event1_serialized,
        )

    def test_validate_credits_negative(self):
        view = UserTimetableView()
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        event1 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:30",
            time_end="10:35",
            credits=-1.0,
        )
        event1_serialized = EventSerializer(event1).data
        self.assertRaises(
            rest_framework.exceptions.ValidationError,
            view.validate_credits,
            event1_serialized,
        )

    def test_validate_credits_too_large(self):
        view = UserTimetableView()
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        event1 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:30",
            time_end="10:35",
            credits=21.0,
        )
        event1_serialized = EventSerializer(event1).data
        self.assertRaises(
            rest_framework.exceptions.ValidationError,
            view.validate_credits,
            event1_serialized,
        )

    def test_validate_credits_correct(self):
        view = UserTimetableView()
        testTimetable = PersonalTimetable.objects.create(
            name="testTimetable", school="jhu", semester=self.sem, student=self.student
        )
        event1 = PersonalEvent.objects.create(
            timetable=testTimetable,
            name="study session",
            day="F",
            time_start="08:30",
            time_end="10:35",
            credits=2.0,
        )
        event1_serialized = EventSerializer(event1).data
        self.assertEquals(view.validate_credits(event1_serialized), 2.0)

    def test_validate_time_valid_edge_case(self):
        view = UserTimetableView()
        view.validate_time("05:23", "05:33")

    def test_validate_time_invalid(self):
        view = UserTimetableView()
        self.assertRaises(
            rest_framework.exceptions.ValidationError,
            view.validate_time,
            "05:23",
            "05:32",
        )

    def test_validate_time_invalid(self):
        view = UserTimetableView()
        self.assertRaises(
            rest_framework.exceptions.ValidationError,
            view.validate_time,
            "06:23",
            "05:32",
        )

    def test_convert_to_minutes_zero(self):
        view = UserTimetableView()
        self.assertEquals(view.convert_to_minutes("00:00"), 0)

    def test_convert_to_minutes_complex(self):
        view = UserTimetableView()
        self.assertEquals(view.convert_to_minutes("15:23"), 923)


class ClassmateViewTest(APITestCase):
    def setUp(self):
        # set up friends
        self.user1 = create_user(
            first_name="jacob", last_name="D", username="jacob", password="secret"
        )
        self.student1 = create_student(
            id=1, user=self.user1, social_courses=True, social_all=True
        )

        self.user2 = create_user(
            first_name="tim", last_name="F", username="tim", password="secret"
        )
        self.student2 = create_student(
            id=2, user=self.user2, social_courses=True, social_all=True
        )

        self.user3 = create_user(
            first_name="matt", last_name="A", username="matt", password="secret"
        )
        self.student3 = create_student(
            id=3, user=self.user3, social_courses=True, social_all=True
        )

        # 1 and 2 are friends
        self.student2.friends.add(self.student1)
        self.student2.save()
        self.student1.friends.add(self.student2)
        self.student2.save()

        # set up course with two sections
        sem = Semester.objects.create(name="Fall", year="2000")
        course = Course.objects.create(id=1, school="uoft", code="SEM101", name="Intro")
        section1 = Section.objects.create(
            course=course, semester=sem, meeting_section="L1"
        )
        Offering.objects.create(
            section=section1,
            day="M",
            date_start="08-29-2000",
            date_end="12-10-2000",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )

        section2 = Section.objects.create(
            course=course, semester=sem, meeting_section="L2"
        )
        Offering.objects.create(
            section=section2,
            day="W",
            date_start="08-29-2000",
            date_end="12-10-2000",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )

        # students have a timetable in common
        tt1 = PersonalTimetable.objects.create(
            name="tt", school="uoft", semester=sem, student=self.student1
        )
        tt1.courses.add(course)
        tt1.sections.add(section1)
        tt1.save()

        tt2 = PersonalTimetable.objects.create(
            name="tt", school="uoft", semester=sem, student=self.student2
        )
        tt2.courses.add(course)
        tt2.sections.add(section1)
        tt2.save()

        tt3 = PersonalTimetable.objects.create(
            name="tt", school="uoft", semester=sem, student=self.student3
        )
        tt3.courses.add(course)
        tt3.sections.add(section1)
        tt3.save()

        # student2 has another timetable
        tt4 = PersonalTimetable.objects.create(
            name="tt", school="uoft", semester=sem, student=self.student2
        )
        tt4.courses.add(course)
        tt4.sections.add(section2)
        tt4.save()

        self.factory = APIRequestFactory()

    def test_get_classmate_counts(self):
        request = self.factory.get(
            "/user/classmates/Fall/2000/", {"count": True, "course_ids[]": [1]}
        )
        response = get_auth_response(
            request, self.user2, "/user/classmates/Fall/2016/", "Fall", "2000"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertDictEqual(response.data, {"id": 1, "count": 1, "total_count": 1})

    def test_get_classmates(self):
        request = self.factory.get("/user/classmates/Fall/2000/", {"course_ids[]": [1]})
        response = get_auth_response(
            request, self.user2, "/user/classmates/Fall/2016/", "Fall", "2000"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data), 1)
        classmates = response.data[1]["current"]  # key is course id
        self.assertEqual(len(classmates), 1)
        self.assertEqual(classmates[0]["first_name"], self.user1.first_name)
        self.assertEqual(classmates[0]["last_name"], self.user1.last_name)
        self.assertEqual(len(response.data[1]["past"]), 0)

    def test_find_friends(self):
        request = self.factory.get("/user/classmates/Fall/2000/")
        response = get_auth_response(
            request, self.user3, "/user/classmates/Fall/2016/", "Fall", "2000"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class ReactionTest(APITestCase):
    def setUp(self):
        """Create a user and course."""
        self.user = create_user(username="jacob", password="top_secret")
        self.student = create_student(user=self.user)
        self.course = Course.objects.create(
            id=1, school="uoft", code="SEM101", name="Intro"
        )
        self.title = Reaction.REACTION_CHOICES[0][0]
        self.factory = APIRequestFactory()

    def test_add_reaction(self):
        data = {"cid": 1, "title": self.title}
        request = self.factory.post("/user/reactions/", data, format="json")
        response = get_auth_response(request, self.user, "/user/reactions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue("reactions" in response.data)
        Reaction.objects.get(student=self.student, title=self.title)
        self.assertGreater(Course.objects.get(id=1).reaction_set.count(), 0)

    def test_delete_reaction(self):
        data = {"cid": 1, "title": self.title}
        request = self.factory.post("/user/reactions/", data, format="json")
        get_auth_response(request, self.user, "/user/reactions/")
        request = self.factory.post("/user/reactions/", data, format="json")
        response = get_auth_response(request, self.user, "/user/reactions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("reactions" in response.data)
        with self.assertRaises(Reaction.DoesNotExist):
            Reaction.objects.get(student=self.student, title=self.title)


class PersonalEventTest(APITestCase):
    def setUp(self):
        self.user = create_user(username="james", password="wang")
        self.user2 = create_user(username="alan", password="zhang")
        self.student = create_student(user=self.user)
        self.student2 = create_student(user=self.user2)
        self.sem = Semester.objects.create(name="Spring", year="2022")
        self.tt = PersonalTimetable.objects.create(
            id=5, name="tt", school="jhu", semester=self.sem, student=self.student
        )
        self.event = PersonalEvent.objects.create(
            id=1875,
            timetable=self.tt,
            name="event",
            day="T",
            time_start="08:00",
            time_end="10:00",
        )
        self.tt.save()
        self.factory = APIRequestFactory()

    def test_create_event(self):
        event_data = {
            "name": "New Custom Event",
            "day": "W",
            "time_start": "19:00",
            "time_end": "21:00",
            "color": "#93d9a4",
            "location": "",
            "credits": "0.0",
            "timetable": 5,
            "preview": False,
        }
        request = self.factory.post("/user/events/", event_data, format="json")
        response = get_auth_response(request, self.user, "/user/events/")

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data)

        self.assertTrue(response.data["id"])

    def test_update_event(self):
        event_data = {
            "id": 1875,
            "name": "New Custom Event",
            "day": "W",
            "time_start": "19:00",
            "time_end": "21:00",
            "color": "#93d9a4",
            "location": "",
            "credits": "0.0",
            "timetable": 5,
            "preview": False,
        }
        request = self.factory.put("/user/events/", event_data, format="json")
        response = get_auth_response(request, self.user, "/user/events/")
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        self.event.refresh_from_db()
        self.assertDictContainsSubset(EventSerializer(self.event).data, event_data)

    def test_update_event_partial_data(self):
        event_data = {
            "id": 1875,
            "day": "R",
            "time_start": "19:00",
            "time_end": "21:00",
        }
        request = self.factory.put("/user/events/", event_data, format="json")
        response = get_auth_response(request, self.user, "/user/events/")
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        self.event.refresh_from_db()
        self.assertDictContainsSubset(event_data, EventSerializer(self.event).data)

    def test_nonexistent_event_doesnt_create_event(self):
        request = self.factory.put("/user/events/", {"id": 1876}, format="json")
        response = get_auth_response(request, self.user, "/user/events/")
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
        with self.assertRaises(PersonalEvent.DoesNotExist):
            PersonalEvent.objects.get(id=1876)

    def test_wrong_student_cant_update_event(self):
        request = self.factory.put("/user/events/", {"id": 1875}, format="json")
        response = get_auth_response(request, self.user2, "/user/events/")
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEquals(PersonalEvent.objects.count(), 1)

    def test_bad_event_data_ignored(self):
        request = self.factory.put(
            "/user/events/", {"id": 1875, "stan": "fromis_9"}, format="json"
        )
        response = get_auth_response(request, self.user, "/user/events/")
        self.event.refresh_from_db()
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(AttributeError):
            self.assertNotEquals(self.event.stan, "fromis_9")

    def test_delete_event(self):
        event_data = {"id": self.event.id, "timetable": self.tt.id}
        request = self.factory.delete("/user/events/", event_data, format="json")
        response = get_auth_response(request, self.user, "/user/events/")

        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
