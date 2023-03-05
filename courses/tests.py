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
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from courses.views import get_clean_evals, get_distinct_areas

from timetable.models import (
    Semester,
    Course,
    Section,
    Offering,
    Evaluation,
    Timetable,
)
from parsing.models import DataUpdate
from helpers.test.test_cases import UrlTestCase
from .serializers import (
    CourseSerializer,
    SectionSerializer,
    SemesterSerializer,
    get_section_dict,
)
from student.models import Student, Reaction
from django.contrib.auth.models import User
from student.models import PersonalTimetable
from helpers.test.utils import (
    create_user,
    create_student,
    get_response,
    get_auth_response,
)
from analytics.models import SharedCourseView


class Serializers(TestCase):
    def setUp(self):
        self.sem_name = "Winter"
        self.year = "1995"
        self.cid = 1
        self.name = "Intro"
        self.code = "SEM101"
        self.school = "uoft"
        self.sem = Semester.objects.create(name=self.sem_name, year=self.year)
        self.course = Course.objects.create(
            id=self.cid, school=self.school, code=self.code, name=self.name
        )

        self.section = Section.objects.create(
            course=self.course, semester=self.sem, meeting_section="L1"
        )
        Offering.objects.create(
            section=self.section,
            day="M",
            date_start="08-29-1995",
            date_end="12-10-1995",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )

    def test_course_serialization_basic_attributes(self):
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )

        self.assertTrue(serialized.data["code"] == self.code)
        self.assertTrue(serialized.data["name"] == self.name)
        self.assertTrue(serialized.data["id"] == self.cid)

    def valid_evals(self, evals):
        for course_eval in evals:
            if course_eval["year"] == self.year:
                if course_eval["unique_term_year"]:
                    return False
            else:
                if not course_eval["unique_term_year"]:
                    return False
        return True

    def test_course_serialization_get_evals(self):
        Evaluation.objects.create(
            course=self.course,
            score=5.0,
            summary="This class was great",
            professor="prof",
            course_code=self.code,
            year=self.year,
        )
        Evaluation.objects.create(
            course=self.course,
            score=1.0,
            summary="This class was terrible",
            professor="prof",
            course_code=self.code,
            year=self.year,
        )
        Evaluation.objects.create(
            course=self.course,
            score=3.0,
            summary="This class was meh",
            professor="prof",
            course_code=self.code,
            year=str(int(self.year) + 1),
        )
        Evaluation.objects.create(
            course=self.course,
            score=3.0,
            summary="Loved it",
            professor="prof",
            course_code=self.code,
            year=str(int(self.year) + 2),
        )
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        self.assertTrue(self.valid_evals(serialized.data["evals"]))

    # def test_course_serialization_get_related_courses(self):
    #     testSem = Semester.objects.create(name="Spring", year="2022")
    #     relatedCourseOne = Course.objects.create(
    #         id=2, school=self.school, code="SEM102", name="STAD1"
    #     )
    #     courseOneSec = Section.objects.create(
    #         course=relatedCourseOne,
    #         meeting_section="01",
    #         size=10,
    #         enrolment=3,
    #         waitlist=0,
    #         waitlist_size=10,
    #         instructors="instructor",
    #         semester=self.sem,
    #         was_full=True,
    #         course_section_id=1,
    #     )
    #     relatedCourseTwo = Course.objects.create(
    #         id=3, school=self.school, code="SEM103", name="STAD2"
    #     )
    #     courseTwoSec = Section.objects.create(
    #         course=relatedCourseTwo,
    #         meeting_section="01",
    #         size=10,
    #         enrolment=3,
    #         waitlist=0,
    #         waitlist_size=10,
    #         instructors="instructor",
    #         semester=self.sem,
    #         was_full=True,
    #         course_section_id=1,
    #     )
    #     relatedCourseThree = Course.objects.create(
    #         id=4, school=self.school, code="SEM104", name="STAD3"
    #     )
    #     courseThreeSec = Section.objects.create(
    #         course=relatedCourseThree,
    #         meeting_section="01",
    #         size=10,
    #         enrolment=3,
    #         waitlist=0,
    #         waitlist_size=10,
    #         instructors="instructor",
    #         semester=self.sem,
    #         was_full=True,
    #         course_section_id=1,
    #     )
    #     relatedCourseFour = Course.objects.create(
    #         id=5, school=self.school, code="SEM105", name="STAD4"
    #     )
    #     courseFourSec = Section.objects.create(
    #         course=relatedCourseFour,
    #         meeting_section="01",
    #         size=10,
    #         enrolment=3,
    #         waitlist=0,
    #         waitlist_size=10,
    #         instructors="instructor",
    #         semester=self.sem,
    #         was_full=True,
    #         course_section_id=1,
    #     )
    #     relatedCourseFive = Course.objects.create(
    #         id=6, school=self.school, code="SEM106", name="STAD5"
    #     )
    #     courseFiveSec = Section.objects.create(
    #         course=relatedCourseFive,
    #         meeting_section="01",
    #         size=10,
    #         enrolment=3,
    #         waitlist=0,
    #         waitlist_size=10,
    #         instructors="instructor",
    #         semester=self.sem,
    #         was_full=True,
    #         course_section_id=1,
    #     )

    #     self.course.related_courses.add(relatedCourseOne)
    #     self.course.related_courses.add(relatedCourseTwo)
    #     self.course.related_courses.add(relatedCourseThree)
    #     self.course.related_courses.add(relatedCourseFour)
    #     self.course.related_courses.add(relatedCourseFive)

    #     serialized = CourseSerializer(
    #         self.course,
    #         context={
    #             "semester": self.sem,
    #             "school": self.school,
    #         },
    #     )
    #     data = serialized.data["related_courses"]
    #     self.assertTrue(data[0]["code"] == "SEM102")
    #     self.assertTrue(data[1]["code"] == "SEM103")
    #     self.assertTrue(data[2]["code"] == "SEM104")
    #     self.assertTrue(data[3]["code"] == "SEM105")
    #     self.assertTrue(data[4]["code"] == "SEM106")

    def test_get_reactions_no_student(self):
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["reactions"]
        self.assertTrue(not data)

    def test_get_regexed_courses(self):
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["regexed_courses"]
        # print(data)

    def test_get_reactions_with_student(self):
        testSem = Semester.objects.create(name="Spring", year="2022")

        user1 = User.objects.create_user(
            username="user", email="student@jhu.edu", password="password"
        )
        student = Student.objects.create(
            preferred_name="nickname",
            class_year=2022,
            user=user1,
            img_url="no_url",
            major="English",
        )
        react = Reaction.objects.create(student=student, title="FIRE")
        react.course.add(self.course)
        serialized = CourseSerializer(
            self.course,
            context={"semester": self.sem, "school": self.school, "student": student},
        )
        data = serialized.data["reactions"]
        self.assertTrue(data)

    def test_get_reactions_with_multiple_reviews_and_multiple_students(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )

        user1 = User.objects.create_user(
            username="user", email="student@jhu.edu", password="password"
        )
        user2 = User.objects.create_user(
            username="person", email="staff@jhu.edu", password="password"
        )
        student1 = Student.objects.create(
            preferred_name="nickname",
            class_year=2022,
            user=user1,
            img_url="no_url",
            major="English",
        )
        student2 = Student.objects.create(
            preferred_name="nicknames",
            class_year=2022,
            user=user2,
            img_url="no_url",
            major="undecided",
        )
        reaction1 = Reaction.objects.create(student=student1, title="FIRE")
        reaction2 = Reaction.objects.create(student=student2, title="CRAP")
        reaction1.course.add(self.course)
        reaction2.course.add(self.course)
        serialized = CourseSerializer(
            self.course,
            context={"semester": self.sem, "school": self.school, "student": student1},
        )
        data = serialized.data["reactions"]
        self.assertTrue(data[0]["title"] == "CRAP")
        self.assertTrue(data[1]["title"] == "FIRE")

    def test_get_popularity_percent_with_sections(self):
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["popularity_percent"]
        self.assertTrue(data == -0.0)  # TODO: why is it negative?

    def test_get_popularity_percent_without_sections(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        serialized = CourseSerializer(
            courseOne,
            context={
                "semester": testSem,
                "school": self.school,
            },
        )
        data = serialized.data["popularity_percent"]
        self.assertTrue(data == 0.0)

    def test_get_is_waitlist_only_one_sec_full(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        courseOneSec1 = Section.objects.create(
            course=courseOne,
            meeting_section="01",
            size=10,
            enrolment=10,
            waitlist=0,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=1,
        )
        courseOneSec2 = Section.objects.create(
            course=courseOne,
            meeting_section="02",
            size=10,
            enrolment=0,
            waitlist=0,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=1,
        )
        serialized = CourseSerializer(
            courseOne,
            context={
                "semester": testSem,
                "school": self.school,
            },
        )
        data = serialized.data["is_waitlist_only"]
        self.assertFalse(data)

    def test_get_is_waitlist_both_sec_full(self):
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        Section.objects.create(
            course=courseOne,
            meeting_section="01",
            size=10,
            enrolment=10,
            waitlist=1,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=1,
        )
        Section.objects.create(
            course=courseOne,
            meeting_section="02",
            size=10,
            enrolment=10,
            waitlist=1,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=2,
        )

        serialized = CourseSerializer(
            courseOne,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["is_waitlist_only"]
        self.assertTrue(data)

    def test_get_is_waitlist_no_sec(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        serialized = CourseSerializer(
            courseOne,
            context={
                "semester": testSem,
                "school": self.school,
            },
        )
        data = serialized.data["is_waitlist_only"]
        self.assertFalse(data)

    def test_get_sections(self):
        serialized_course = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )

        serialized_sec = SectionSerializer(self.section)

        self.assertEqual(serialized_course.data["sections"][0], serialized_sec.data)

    # This function is literally never used
    def test_get_section_dict_basic_info(self):
        serialized_section = SectionSerializer(
            self.section,
        )

    def test_SectionSerializer(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=25235, school=self.school, code="SEM102", name="STAD1"
        )
        courseOneSec1 = Section.objects.create(
            course=courseOne,
            meeting_section="01",
            size=10,
            enrolment=10,
            waitlist=1,
            waitlist_size=10,
            instructors="instructor",
            semester=testSem,
            was_full=False,
            course_section_id=1,
        )
        serialized_section = SectionSerializer(
            courseOneSec1,
        )
        serialized_semester = SemesterSerializer(
            testSem,
        )
        result = serialized_section.data
        self.assertTrue(result["meeting_section"] == courseOneSec1.meeting_section)
        self.assertTrue(result["size"] == courseOneSec1.size)
        self.assertTrue(result["enrolment"] == courseOneSec1.enrolment)
        self.assertTrue(result["waitlist"] == courseOneSec1.waitlist)
        self.assertTrue(result["section_type"] == courseOneSec1.section_type)
        self.assertTrue(result["instructors"] == courseOneSec1.instructors)
        self.assertTrue(result["semester"] == serialized_semester.data)

    def test_SemesterSerializer(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        serialized_semester = SemesterSerializer(testSem)
        data = serialized_semester.data
        self.assertTrue(data["name"] == testSem.name)
        self.assertTrue(data["year"] == testSem.year)

    def test_get_section_dict(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=25235, school=self.school, code="SEM102", name="STAD1"
        )
        courseOneSec1 = Section.objects.create(
            course=courseOne,
            meeting_section="01",
            size=10,
            enrolment=10,
            waitlist=1,
            waitlist_size=10,
            instructors="instructor",
            semester=testSem,
            was_full=False,
            course_section_id=1,
        )
        data = get_section_dict(courseOneSec1)
        self.assertTrue(data["is_section_filled"])
        self.assertEquals(data["instructors"], "instructor")
        self.assertEquals(data["size"], 10)
        self.assertEquals(data["waitlist"], 1)


class CourseDetail(APITestCase):
    school = "uoft"
    search_endpoint = "search"
    request_headers = {"HTTP_HOST": "{}.sem.ly:8000".format(school)}

    def setUp(self):
        self.sem_name = "Winter"
        self.year = "1995"
        self.cid = 1
        self.name = "Intro"
        self.code = "SEM101"
        self.sem = Semester.objects.create(name=self.sem_name, year=self.year)
        self.course = Course.objects.create(
            id=self.cid, school=self.school, code=self.code, name=self.name
        )
        self.section = Section.objects.create(
            course=self.course, semester=self.sem, meeting_section="L1"
        )
        Offering.objects.create(
            section=self.section,
            day="M",
            date_start="08-29-1995",
            date_end="12-10-1995",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )
        self.user1 = User.objects.create_user(
            username="student", email="student@jhu.edu", password="password"
        )
        self.user2 = User.objects.create_user(
            username="staff", email="staff@jhu.edu", password="password"
        )
        self.student1 = Student.objects.create(
            preferred_name="studentTester",
            class_year=2022,
            user=self.user1,
            img_url="no_url",
            major="English",
        )
        self.student2 = Student.objects.create(
            preferred_name="staffTester",
            class_year=2022,
            user=self.user2,
            img_url="no_url",
            major="undecided",
        )
        self.factory = APIRequestFactory()

    def test_all_courses(self):
        url = "/courses/"
        request = self.factory.get(url, {}, format="json")
        response = get_auth_response(request, self.user1, url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_course_page(self):
        url = "/c/{}/".format(self.code)
        request = self.factory.get(url, {"code": self.code}, format="json")
        response = get_auth_response(request, self.user1, url, self.code)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_course_exists(self):
        response = self.client.get(
            "/courses/{}/{}/id/{}".format(self.sem_name, self.year, self.cid),
            **self.request_headers,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course_info = response.json()
        self.assertEqual(course_info["name"], self.name)
        self.assertEqual(course_info["code"], self.code)

    def test_no_course_exists(self):
        response = self.client.get(
            "/courses/{}/{}/id/{}".format(self.sem_name, self.year, self.cid + 1),
            **self.request_headers,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_classmate_in_course(self):
        courseOneSec1 = Section.objects.create(
            course=self.course,
            meeting_section="01",
            size=10,
            enrolment=3,
            waitlist=0,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=1,
        )
        courseOneSec2 = Section.objects.create(
            course=self.course,
            meeting_section="02",
            size=10,
            enrolment=3,
            waitlist=0,
            waitlist_size=10,
            instructors="instructor",
            semester=self.sem,
            was_full=False,
            course_section_id=1,
        )

        personalTimetable1 = PersonalTimetable.objects.create(
            name="timetable1",
            student=self.student1,
            semester=self.sem,
            school=self.school,
        )
        personalTimetable1.courses.add(self.course)
        personalTimetable1.sections.add(courseOneSec1)

        personalTimetable2 = PersonalTimetable.objects.create(
            name="timetable2",
            student=self.student2,
            semester=self.sem,
            school=self.school,
        )
        personalTimetable2.courses.add(self.course)
        personalTimetable2.sections.add(courseOneSec1)
        url = "/course_classmates/{}/{}/{}/id/{}/".format(
            self.school, self.sem_name, self.year, self.cid
        )
        request = self.factory.get(
            url,
            {
                "school": self.school,
                "sem_name": self.sem_name,
                "year": self.year,
                "course_id": self.cid,
            },
            format="json",
        )
        response = get_auth_response(
            request, self.user1, url, self.school, self.sem_name, self.year, self.cid
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # print(json.loads(response.content))

    def test_get_clean_evals_no_change_for_well_formatted_input(self):
        Evaluation.objects.create(
            course=self.course,
            score=5.0,
            summary="This class was great",
            professor="prof",
            course_code=self.code,
            year=self.year,
        )
        Evaluation.objects.create(
            course=self.course,
            score=1.0,
            summary="This class was terrible",
            professor="prof",
            course_code=self.code,
            year=self.year,
        )
        Evaluation.objects.create(
            course=self.course,
            score=3.0,
            summary="This class was meh",
            professor="prof",
            course_code=self.code,
            year=str(int(self.year) + 1),
        )
        Evaluation.objects.create(
            course=self.course,
            score=3.0,
            summary="Loved it",
            professor="prof",
            course_code=self.code,
            year=str(int(self.year) + 2),
        )
        course_dict = CourseSerializer(
            self.course, context={"semester": self.sem, "school": self.school}
        ).data
        self.assertEquals(course_dict["evals"], get_clean_evals(course_dict))

        def test_get_clean_evals_formatted_input_with_space(self):
            Evaluation.objects.create(
                course=self.course,
                score=5.0,
                summary="This class was great \xa0",
                professor="prof",
                course_code=self.code,
                year=self.year,
            )
            Evaluation.objects.create(
                course=self.course,
                score=1.0,
                summary="This class was terrible",
                professor="prof",
                course_code=self.code,
                year=self.year,
            )
            Evaluation.objects.create(
                course=self.course,
                score=3.0,
                summary="This class was meh",
                professor="prof",
                course_code=self.code,
                year=str(int(self.year) + 1),
            )
            Evaluation.objects.create(
                course=self.course,
                score=3.0,
                summary="Loved it",
                professor="prof",
                course_code=self.code,
                year=str(int(self.year) + 2),
            )
            course_dict = CourseSerializer(
                self.course, context={"semester": self.sem, "school": self.school}
            ).data
            self.assertNotEquals(course_dict["evals"], get_clean_evals(course_dict))

        def test_get_clean_evals_formatted_input_with_colon(self):
            year = self.year + ":"
            Evaluation.objects.create(
                course=self.course,
                score=5.0,
                summary="This class was great",
                professor="prof",
                course_code=self.code,
                year=year,
            )
            Evaluation.objects.create(
                course=self.course,
                score=1.0,
                summary="This class was terrible",
                professor="prof",
                course_code=self.code,
                year=self.year,
            )
            Evaluation.objects.create(
                course=self.course,
                score=3.0,
                summary="This class was meh",
                professor="prof",
                course_code=self.code,
                year=str(int(self.year) + 1),
            )
            Evaluation.objects.create(
                course=self.course,
                score=3.0,
                summary="Loved it",
                professor="prof",
                course_code=self.code,
                year=str(int(self.year) + 2),
            )
            course_dict = CourseSerializer(
                self.course, context={"semester": self.sem, "school": self.school}
            ).data
            self.assertNotEquals(course_dict["evals"], get_clean_evals(course_dict))

        def test_course_page(self):
            sections = CourseSerializer(
                self.course, context={"semester": self.semester, "school": self.school}
            ).data["sections"]
            lecs = [s for s in sections if s["section_type"] == "L"]
            tutorials = [s for s in sections if s["section_type"] == "T"]
            practicals = [s for s in sections if s["section_type"] == "P"]
            url = "/c/{}/".format(self.cid)
            request = self.factory.get(url, {"course_id": self.cid}, format="json")
            response = get_auth_response(request, self.user1, url, self.cid)
            self.assertEquals(response.context["course"], Course.objects.get(self.cid))
            self.assertEquals(response.context["lectures"], lecs)
            self.assertEquals(response.context["tutorials"], tutorials)
            self.assertEquals(response.context["practicals"], practicals)

        def test_all_courses(self):
            url = "/courses/"
            request = self.factory.get(url)
            response = get_auth_response(
                request,
                self.user1,
                url,
            )
            self.assertEquals(response.context["school_name"], self.school)


class CourseModalTest(APITestCase):
    def setUp(self):
        self.sem_name = "Winter"
        self.school = "uoft"
        self.year = "1995"
        self.cid = 1
        self.name = "Intro"
        self.code = "SEM101"
        self.sem = Semester.objects.create(name=self.sem_name, year=self.year)
        self.course = Course.objects.create(
            id=self.cid, school=self.school, code=self.code, name=self.name
        )
        self.section = Section.objects.create(
            course=self.course, semester=self.sem, meeting_section="L1"
        )
        Offering.objects.create(
            section=self.section,
            day="M",
            date_start="08-29-1995",
            date_end="12-10-1995",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(
            username="student", email="student@jhu.edu", password="password"
        )

    def test_get_feature_flow_no_course_in_db(self):
        url = "/course/{}/{}/{}/".format(self.code, self.sem_name, self.year)
        request = self.factory.get(
            url,
            {"code": self.code, "sem_name": self.sem_name, "year": self.year},
            format="json",
        )
        response = get_auth_response(
            request, self.user1, url, self.code, self.sem_name, self.year
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_feature_flow_with_course_in_db(self):
        url = f"/course/SEM3420/{self.sem_name}/{self.year}/"
        request = self.factory.get(
            url,
            {"code": "SEM3420", "sem_name": self.sem_name, "year": self.year},
            format="json",
        )
        response = get_auth_response(
            request, self.user1, url, "SEM3420", self.sem_name, self.year
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_feature_flow_shared_course_view_created(self):
        url = f"/course/{self.code}/{self.sem_name}/{self.year}/"
        request = self.factory.get(
            url,
            {"code": self.code, "sem_name": self.sem_name, "year": self.year},
            format="json",
        )
        response = get_auth_response(
            request, self.user1, url, self.code, self.sem_name, self.year
        )
        self.assertTrue(SharedCourseView.objects.all())


class SchoolListTest(APITestCase):
    school = "uoft"

    def setUp(self):
        self.areas = ["area1", "area2"]
        self.departments = "math"
        self.level = "hard"
        Course.objects.create(
            school=self.school,
            code="SEA101",
            name="Intro",
            areas=self.areas,
            department=self.departments,
            level=self.level,
        )
        areas2 = ["area2", "area3"]
        Course.objects.create(
            school=self.school,
            code="SEA102",
            name="Test Case 2",
            areas=areas2,
            department=self.departments,
            level=self.level,
        )
        semester, _ = Semester.objects.update_or_create(name="Fall", year="2017")
        DataUpdate.objects.create(
            school=self.school, update_type=DataUpdate.COURSES, semester=semester
        )

    def test_school_exists(self):
        response = self.client.get("/school/{}/".format(self.school))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        school_info = response.data
        self.assertNotEqual(len(school_info["areas"]), 0)
        self.assertNotEqual(len(school_info["departments"]), 0)
        self.assertNotEqual(len(school_info["levels"]), 0)
        self.assertIsNotNone(school_info["last_updated"])

    def test_school_does_not_exist(self):
        response = self.client.get("/school/{}/".format("notuoft"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        school_info = response.data
        self.assertEqual(len(school_info["areas"]), 0)
        self.assertEqual(len(school_info["departments"]), 0)
        self.assertEqual(len(school_info["levels"]), 0)
        self.assertIsNone(school_info["last_updated"])

    def test_get_distinct_areas(self):
        area_groups = list(
            Course.objects.filter(school=self.school)
            .exclude(areas__exact=[])
            .values_list("areas", flat=True)
            .distinct()
        )
        distinct_areas = get_distinct_areas(area_groups)
        self.assertTrue("area1" in distinct_areas)
        self.assertTrue("area2" in distinct_areas)
        self.assertTrue("area3" in distinct_areas)
        self.assertEquals(len(distinct_areas), 3)


class UrlsTest(UrlTestCase):
    """Test courses/urls.py"""

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView("/c/somecode0350!", "courses.views.course_page")
        self.assertUrlResolvesToView(
            "/course/music101/Summer/2021", "courses.views.CourseModal"
        )
        self.assertUrlResolvesToView("/courses", "courses.views.all_courses")
        self.assertUrlResolvesToView(
            "/course_classmates/uoft/Fall/2019/id/82",
            "courses.views.get_classmates_in_course",
        )
        self.assertUrlResolvesToView(
            "/courses/Fall/2019/id/82", "courses.views.CourseDetail"
        )
        self.assertUrlResolvesToView(
            "/school/uoft/", "courses.views.SchoolList", kwargs={"school": "uoft"}
        )
