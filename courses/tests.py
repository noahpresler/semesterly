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

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from timetable.models import Semester, Course, Section, Offering, Evaluation, Integration, CourseIntegration, Timetable
from parsing.models import DataUpdate
from helpers.test.test_cases import UrlTestCase
from .serializers import CourseSerializer, SectionSerializer
from student.models import Student, Reaction
from django.contrib.auth.models import User
from student.models import PersonalTimetable


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
        Evaluation.objects.create(course=self.course, score=5.0, summary="This class was great", professor="prof",course_code=self.code,year=self.year)
        Evaluation.objects.create(course=self.course, score=1.0, summary="This class was terrible", professor="prof",course_code=self.code,year=self.year)
        Evaluation.objects.create(course=self.course, score=3.0, summary="This class was meh", professor="prof",course_code=self.code,year=str(int(self.year)+1))
        Evaluation.objects.create(course=self.course, score=3.0, summary="Loved it", professor="prof",course_code=self.code,year=str(int(self.year)+2))
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        self.assertTrue(self.valid_evals(serialized.data["evals"]))

    def test_course_serialization_get_integrations(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        integration = Integration.objects.create(name="testIntegration")
        courseInt = CourseIntegration.objects.create(course=self.course, integration=integration, json="randomJson")
        courseInt.semester.add(testSem)
        courseInt.semester.add(self.sem)
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        integration_data = serialized.data["integrations"]
        self.assertTrue(integration_data[0] == "testIntegration")

    def test_course_serialization_get_related_courses(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        relatedCourseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        courseOneSec = Section.objects.create(
            course=relatedCourseOne, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=True, course_section_id=1 
        )
        relatedCourseTwo = Course.objects.create(
            id=3, school=self.school, code="SEM103", name="STAD2"
        )
        courseTwoSec = Section.objects.create(
            course=relatedCourseTwo, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=True, course_section_id=1 
        )
        relatedCourseThree = Course.objects.create(
            id=4, school=self.school, code="SEM104", name="STAD3"
        )
        courseThreeSec = Section.objects.create(
            course=relatedCourseThree, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=True, course_section_id=1 
        )
        relatedCourseFour = Course.objects.create(
            id=5, school=self.school, code="SEM105", name="STAD4"
        )
        courseFourSec = Section.objects.create(
            course=relatedCourseFour, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=True, course_section_id=1 
        )
        relatedCourseFive = Course.objects.create(
            id=6, school=self.school, code="SEM106", name="STAD5"
        )
        courseFiveSec = Section.objects.create(
            course=relatedCourseFive, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=True, course_section_id=1 
        )
        
        self.course.related_courses.add(relatedCourseOne)
        self.course.related_courses.add(relatedCourseTwo)
        self.course.related_courses.add(relatedCourseThree)
        self.course.related_courses.add(relatedCourseFour)
        self.course.related_courses.add(relatedCourseFive)

        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["related_courses"]
        self.assertTrue(data[0]["code"] == "SEM102")
        self.assertTrue(data[1]["code"] == "SEM103")
        self.assertTrue(data[2]["code"] == "SEM104")
        self.assertTrue(data[3]["code"] == "SEM105")
        self.assertTrue(data[4]["code"] == "SEM106")
        
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

    def test_get_reactions_with_student(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
       
        user1 = User.objects.create_user(username='user', email='student@jhu.edu', password='password')
        student = Student.objects.create(
            preferred_name="nickname", class_year=2022, user=user1, img_url="no_url", major="English"
        )
        react = Reaction.objects.create(
            student=student, title="FIRE"
        )
        react.course.add(self.course)
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
                "student": student
            },
        )
        data = serialized.data["reactions"]
        self.assertTrue(data)

    def test_get_reactions_with_multiple_reviews_and_multiple_students(self):
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        
        user1 = User.objects.create_user(username='user', email='student@jhu.edu', password='password')
        user2 = User.objects.create_user(username='person', email='staff@jhu.edu', password='password')
        student1 = Student.objects.create(
            preferred_name="nickname", class_year=2022, user=user1, img_url="no_url", major="English"
        )
        student2 = Student.objects.create(
            preferred_name="nicknames", class_year=2022, user=user2, img_url="no_url", major="undecided"
        )
        reaction1 = Reaction.objects.create(
            student=student1, title="FIRE"
        )
        reaction2 = Reaction.objects.create(
            student=student2, title="CRAP"
        )
        reaction1.course.add(self.course)
        reaction2.course.add(self.course)
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
                "student": student1
            },
        )
        data = serialized.data["reactions"]
        self.assertTrue(data[0]["title"] == "CRAP")
        self.assertTrue(data[1]["title"] == "FIRE")

    def test_get_popularity_percent_with_sections(self):
        # testSem = Semester.objects.create(name="Spring", year="2022")
        # relatedCourseOne = Course.objects.create(
        #     id=2, school=self.school, code="SEM102", name="STAD1"
        # )
        # courseOneSec1 = Section.objects.create(
        #     course=relatedCourseOne, meeting_section="01", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=1 
        # )
        # courseOneSec2 = Section.objects.create(
        #     course=relatedCourseOne, meeting_section="02", size=10, enrolment=3, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=1 
        # )
        # user1 = User.objects.create_user(username='user', email='student@jhu.edu', password='password')
        # user2 = User.objects.create_user(username='person', email='staff@jhu.edu', password='password')
        # student1 = Student.objects.create(
        #     preferred_name="nickname", class_year=2022, user=user1, img_url="no_url", major="English"
        # )
        # student2 = Student.objects.create(
        #     preferred_name="nicknames", class_year=2022, user=user2, img_url="no_url", major="undecided"
        # )
        # personalTimetable1 = PersonalTimetable.objects.create(name="timetable1", student=student1, semester=testSem, school=self.school)
        # personalTimetable1.courses.add(relatedCourseOne)
        # personalTimetable1.sections.add(courseOneSec1)

        # personalTimetable2 = PersonalTimetable.objects.create(name="timetable2", student=student2, semester=testSem, school=self.school)
        # personalTimetable2.courses.add(relatedCourseOne)
        # personalTimetable2.sections.add(courseOneSec1)
        serialized = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )
        data = serialized.data["popularity_percent"]
        self.assertTrue(data == -0.0) # TODO: why is it negative?
        
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
            course=courseOne, meeting_section="01", size=10, enrolment=10, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=1 
        )
        courseOneSec2 = Section.objects.create(
            course=courseOne, meeting_section="02", size=10, enrolment=0, waitlist=0, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=1 
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
        testSem = Semester.objects.create(name="Spring", year="2022")
        courseOne = Course.objects.create(
            id=2, school=self.school, code="SEM102", name="STAD1"
        )
        courseOneSec1 = Section.objects.create(
            course=courseOne, meeting_section="01", size=10, enrolment=10, waitlist=1, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=1 
        )
        courseOneSec2 = Section.objects.create(
            course=courseOne, meeting_section="02", size=10, enrolment=10, waitlist=1, waitlist_size=10, instructors="instructor", semester=self.sem, was_full=False, course_section_id=2 
        )

        print("sec one full: " + str(courseOneSec1.is_full()))
        print("sec two full: " + str(courseOneSec2.is_full()))
        serialized = CourseSerializer(
            courseOne,
            context={
                "semester": testSem,
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
        self.assertTrue(data)
        # TODO: what is expected behavior here?

    def test_get_sections(self):
        serialized_course = CourseSerializer(
            self.course,
            context={
                "semester": self.sem,
                "school": self.school,
            },
        )

        serialized_sec = SectionSerializer(
            self.section
        )

        self.assertEqual(serialized_course.data["sections"][0], serialized_sec.data)

        

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
        sem = Semester.objects.create(name=self.sem_name, year=self.year)
        course = Course.objects.create(
            id=self.cid, school=self.school, code=self.code, name=self.name
        )
        section = Section.objects.create(
            course=course, semester=sem, meeting_section="L1"
        )
        Offering.objects.create(
            section=section,
            day="M",
            date_start="08-29-1995",
            date_end="12-10-1995",
            time_start="8:00",
            time_end="10:00",
            is_short_course=False,
        )

    def test_course_exists(self):
        response = self.client.get(
            "/courses/{}/{}/id/{}".format(self.sem_name, self.year, self.cid),
            **self.request_headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course_info = response.json()
        self.assertEqual(course_info["name"], self.name)
        self.assertEqual(course_info["code"], self.code)

    def test_no_course_exists(self):
        response = self.client.get(
            "/courses/{}/{}/id/{}".format(self.sem_name, self.year, self.cid + 1),
            **self.request_headers
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SchoolListTest(APITestCase):
    school = "uoft"

    def setUp(self):
        self.areas = ["area"]
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
