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

from django.contrib.auth.models import User
from django.test import TestCase
from django.core.urlresolvers import resolve
from helpers.test.test_cases import UrlTestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from timetable.models import Course, Section, Semester
from advising.serializers import AdvisorSerializer
from advising.models import Advisor
from student.models import Student, PersonalTimetable
from forum.models import Transcript


class UrlsTest(TestCase, UrlTestCase):
    """ Test advising/urls.py """

    def setUp(self):
        Semester.objects.create(name='Fall', year='2016').save()
        Student.objects.create(
            user=User.objects.create(), jhed='jwang380@jh.edu')

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            '/advising/jhu_signup/', 'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView(
            '/advising/', 'advising.views.AdvisingView')
        self.assertUrlResolvesToView(
            '/advising/sis_post/', 'advising.views.StudentSISView')
        self.assertUrlResolvesToView(
            '/advising/sis_semesters/jwang380@jh.edu/',
            'advising.views.StudentSISView')
        self.assertUrlResolvesToView(
            '/advising/sis_courses/Fall/2016/jwang380@jh.edu/',
            'advising.views.RegisteredCoursesView')


def setUpStudent(self):
    user, _ = User.objects.get_or_create(
        username='JJam', password='XD', first_name='James', last_name='Wang')
    self.student, _ = Student.objects.get_or_create(
        user=user, jhed='jwang380@jh.edu')
    self.student.save()


def setUpAdvisorNoUser(self):
    self.advisor, _ = Advisor.objects.get_or_create(
        first_name='Alan', last_name='Zhang',
        jhed='azhang42@jh.edu', email_address='azhang42@jhu.edu')
    self.advisor.save()


def setUpAdvisor(self):
    setUpAdvisorNoUser(self)
    user, _ = User.objects.get_or_create(
        username='ala42', password='TFT',
        first_name='Alan', last_name='Zhang')
    self.advisor_user, _ = Student.objects.get_or_create(
        user=user, jhed=self.advisor.jhed)
    self.advisor_user.save()


def setUpTranscriptNoAdvisor(self):
    setUpStudent(self)
    setUpAdvisor(self)
    self.semester, _ = Semester.objects.get_or_create(
        name='Spring', year='2020')
    self.semester.save()
    self.transcript, _ = Transcript.objects.get_or_create(
        owner=self.student, semester=self.semester)
    self.transcript.save()


def setUpTranscript(self):
    setUpTranscriptNoAdvisor(self)
    self.transcript.advisors.add(self.advisor_user)
    self.transcript.save()


def setUpTranscriptForMultipleSemesters(self):
    setUpStudent(self)
    setUpAdvisor(self)
    setUpMockSemesters(self)
    self.transcript_fall2019, _ = Transcript.objects.get_or_create(
        owner=self.student, semester=self.fall2019)
    self.transcript_spring2020, _ = Transcript.objects.get_or_create(
        owner=self.student, semester=self.spring2020)
    self.transcript_fall2019.save()
    self.transcript_spring2020.save()


def setUpMockSemesters(self):
    self.fall2019, _ = Semester.objects.get_or_create(name='Fall', year='2019')
    self.inter2020, _ = Semester.objects.get_or_create(
        name='Intersession', year='2020')
    self.spring2020, _ = Semester.objects.get_or_create(
        name='Spring', year='2020')
    self.fall2020, _ = Semester.objects.get_or_create(
        name='Fall', year='2020')
    self.spring2021, _ = Semester.objects.get_or_create(
        name='Spring', year='2021')
    self.fall2019.save()
    self.inter2020.save()
    self.spring2020.save()
    self.fall2020.save()
    self.spring2021.save()


def setUpMockSections(self):
    setUpMockSemesters(self)
    self.linalg, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='AS.110.212')[0], meeting_section='(01)', semester=self.fall2019)
    self.madooei, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='EN.601.226')[0], meeting_section='(02)', semester=self.fall2019)
    self.vgm, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='AS.376.168')[0], meeting_section='(22)', semester=self.inter2020)
    self.ifp, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='AS.220.105')[0], meeting_section='(15)', semester=self.spring2020)
    self.sfrc, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='EN.601.310')[0], meeting_section='(01)', semester=self.spring2021)
    self.linalg.save()
    self.madooei.save()
    self.vgm.save()
    self.ifp.save()
    self.sfrc.save()


def setUpMockData(self):
    setUpMockSections(self)
    # Not actually used, the token contains this data
    self.mock_data = {
        "StudentInfo":
        {
            "FullName": "Wang, James",
            "EmailAddress": "jwang380@jhu.edu",
            "JhedId": "jwang380@jh.edu",
            "PrimaryMajor": "Computer Science"
        },
        "NonPrimaryMajors": [
            {
                "Major": "Mathematics"
            },
            {
                "Major": "Writing Seminars"
            }
        ],
        "Minors": [
            {
                "Minor": "Management & Entrepreneurship"
            }
        ],
        "Advisors": [
            {
                "FullName": "Moulton, Linda H",
                "JhedId": "lmoulto2@jh.edu",
                "EmailAddress": "lmoulto2@jhu.edu"
            },
            {
                "FullName": "Ghorbani Khaledi, Soudeh",
                "JhedId": "sghorba1@jh.edu",
                "EmailAddress": "soudeh@jhu.edu"
            }
        ],
        "Courses": [
            {
                "Term": "Fall 2019",
                "OfferingName": "AS.110.212",
                "SectionNumber": "01"
            },
            {
                "Term": "Fall 2019",
                "OfferingName": "EN.601.226",
                "SectionNumber": "02"
            },
            {
                "Term": "Intersession 2020",
                "OfferingName": "AS.376.168",
                "SectionNumber": "22"
            },
            {
                "Term": "Spring 2020",
                "OfferingName": "AS.220.105",
                "SectionNumber": "15"
            },
            {
                "Term": "Fall 2020",
                "OfferingName": "MI.841.200",
                "SectionNumber": "01"
            }
        ]
    }


def setUpPersonalTimetable(self):
    setUpMockSections(self)
    self.discrete, _ = Section.objects.get_or_create(
        course=Course.objects.get_or_create(
            code='EN.557.171')[0], meeting_section='(03)', semester=self.fall2019)
    self.discrete.save()

    self.tt, _ = PersonalTimetable.objects.get_or_create(
        student=self.student, semester=self.fall2019, school='uoft', name='gg')
    self.tt.courses.add(self.linalg.course)
    self.tt.courses.add(self.madooei.course)
    self.tt.courses.add(self.discrete.course)
    self.tt.sections.add(self.linalg)
    self.tt.sections.add(self.madooei)
    self.tt.sections.add(self.discrete)
    self.tt.save()


def get_response(request, user, url, *args):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = 'uoft'
    view = resolve(url).func
    return view(request, *args)


class Serializers(TestCase):
    """ Test AdvisorSerializer """

    def setUp(self):
        setUpAdvisorNoUser(self)
        self.factory = APIRequestFactory()

    def test_advisor_serialization(self):
        serialized = AdvisorSerializer(self.advisor).data
        self.assertEquals(serialized['first_name'], 'Alan')
        self.assertEquals(serialized['last_name'], 'Zhang')
        self.assertEquals(serialized['jhed'], 'azhang42@jh.edu')
        self.assertEquals(serialized['email_address'], 'azhang42@jhu.edu')


class AdvisingViewTest(APITestCase):
    def setUp(self):
        user, _ = User.objects.get_or_create(
            first_name='James', last_name='Wang')
        user.save()
        self.student, _ = Student.objects.get_or_create(user=user)
        self.student.save()
        self.factory = APIRequestFactory()

    def test_redirect_student_without_jhed(self):
        request = self.factory.get('/advising/', format='json')
        response = get_response(request, self.student.user, '/advising/')
        self.assertEquals(response.status_code, status.HTTP_302_FOUND)
        self.assertEquals(response.url, '/advising/jhu_signup/')


def sis_post(self):
    setUpMockData(self)
    # These tokens were generated by our custom script. Ask someone who was
    # in the Spring 2021 Software for Resilient Communities course for new ones
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgICAgICJQZXJzb25hbEluZm8iOgogICAgICAgIHsKICAgICAgICAgICAgIkZ1bGxOYW1lIjogIldhbmcsIEphbWVzIiwKICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJqd2FuZzM4MEBqaHUuZWR1IiwKICAgICAgICAgICAgIkpoZWRJZCI6ICJqd2FuZzM4MCIsCiAgICAgICAgICAgICJQcmltYXJ5TWFqb3IiOiAiQ29tcHV0ZXIgU2NpZW5jZSIKICAgICAgICB9LAogICAgICAgICJOb25QcmltYXJ5TWFqb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWFqb3IiOiAiTWF0aGVtYXRpY3MiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJNYWpvciI6ICJXcml0aW5nIFNlbWluYXJzIgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiTWlub3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWlub3JOYW1lIjogIk1hbmFnZW1lbnQgJiBFbnRyZXByZW5ldXJzaGlwIgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiQWR2aXNvcnMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJGdWxsTmFtZSI6ICJNb3VsdG9uLCBMaW5kYSBIIiwKICAgICAgICAgICAgICAgICJKaGVkSWQiOiAibG1vdWx0bzIiLAogICAgICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJsbW91bHRvMkBqaHUuZWR1IgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiRnVsbE5hbWUiOiAiR2hvcmJhbmkgS2hhbGVkaSwgU291ZGVoIiwKICAgICAgICAgICAgICAgICJKaGVkSWQiOiAic2dob3JiYTEiLAogICAgICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJzb3VkZWhAamh1LmVkdSIKICAgICAgICAgICAgfQogICAgICAgIF0sCiAgICAgICAgIkNvdXJzZXMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJUZXJtIjogIkZhbGwgMjAxOSIsCiAgICAgICAgICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkFTLjExMC4yMTIiLAogICAgICAgICAgICAgICAgIlNlY3Rpb24iOiAiMDEiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJUZXJtIjogIkZhbGwgMjAxOSIsCiAgICAgICAgICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkVOLjYwMS4yMjYiLAogICAgICAgICAgICAgICAgIlNlY3Rpb24iOiAiMDIiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJUZXJtIjogIkludGVyc2Vzc2lvbiAyMDIwIiwKICAgICAgICAgICAgICAgICJPZmZlcmluZ05hbWUiOiAiQVMuMzc2LjE2OCIsCiAgICAgICAgICAgICAgICAiU2VjdGlvbiI6ICIyMiIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIlRlcm0iOiAiU3ByaW5nIDIwMjAiLAogICAgICAgICAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJBUy4yMjAuMTA1IiwKICAgICAgICAgICAgICAgICJTZWN0aW9uIjogIjE1IgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiVGVybSI6ICJGYWxsIDIwMjAiLAogICAgICAgICAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJNSS44NDEuMjAwIiwKICAgICAgICAgICAgICAgICJTZWN0aW9uIjogIjAxIgogICAgICAgICAgICB9CiAgICAgICAgXQogICAgfQogICAgICA.VId60zRTWb-gx9vNSZW6n8z4pZnCKKMu_RAYbELpKVI'
    url = '/advising/sis_post/'
    request = self.factory.post(
        url, data=token, content_type='application/jwt')
    response = get_response(
        request, self.student.user, url)
    self.student.refresh_from_db()
    return response


class StudentSISViewTest(APITestCase):
    def setUp(self):
        setUpStudent(self)
        self.factory = APIRequestFactory()

    def test_sis_posts_into_db(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        self.assertEquals(self.student.primary_major, 'Computer Science')
        self.assertEquals(len(self.student.other_majors), 2)
        self.assertTrue('Mathematics' in self.student.other_majors)
        self.assertTrue('Writing Seminars' in self.student.other_majors)

        self.assertEquals(len(self.student.minors), 1)
        self.assertEquals(
            self.student.minors[0], 'Management & Entrepreneurship')

        self.assertEquals(len(self.student.advisors.all()), 2)
        self.assertTrue(self.student.advisors.filter(
            first_name='Linda H', last_name='Moulton',
            jhed='lmoulto2@jh.edu', email_address='lmoulto2@jhu.edu').exists())

        sections = self.student.sis_registered_sections.all()
        # Last course should fail as it doesn't exist, so 4
        self.assertEquals(len(sections), 4)
        self.assertTrue(self.linalg in sections)
        self.assertTrue(self.madooei in sections)
        self.assertTrue(self.vgm in sections)
        self.assertTrue(self.ifp in sections)

    # Two of the same posts should not result in a change in the DB
    def test_double_post_identical(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        self.test_sis_posts_into_db()

    def test_new_post_updates(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # Token with hardcoded changes, show up as changes 1-7 in tested fields
        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgICAgICJQZXJzb25hbEluZm8iOgogICAgICAgIHsKICAgICAgICAgICAgIkZ1bGxOYW1lIjogIldhbmcsIEphbWVzIiwKICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJqd2FuZzM4MEBqaHUuZWR1IiwKICAgICAgICAgICAgIkpoZWRJZCI6ICJqd2FuZzM4MCIsCiAgICAgICAgICAgICJQcmltYXJ5TWFqb3IiOiAiMSIKICAgICAgICB9LAogICAgICAgICJOb25QcmltYXJ5TWFqb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWFqb3IiOiAiMiIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIk1ham9yIjogIjMiCiAgICAgICAgICAgIH0KICAgICAgICBdLAogICAgICAgICJNaW5vcnMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJNaW5vck5hbWUiOiAiNCIKICAgICAgICAgICAgfQogICAgICAgIF0sCiAgICAgICAgIkFkdmlzb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiRnVsbE5hbWUiOiAiNSw1IiwKICAgICAgICAgICAgICAgICJKaGVkSWQiOiAiNiIsCiAgICAgICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogIjciCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJGdWxsTmFtZSI6ICJHaG9yYmFuaSBLaGFsZWRpLCBTb3VkZWgiLAogICAgICAgICAgICAgICAgIkpoZWRJZCI6ICJzZ2hvcmJhMSIsCiAgICAgICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogInNvdWRlaEBqaHUuZWR1IgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiQ291cnNlcyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICAiVGVybSI6ICJTcHJpbmcgMjAyMSIsCiAgICAgICAgICAgICAgICJPZmZlcmluZ05hbWUiOiAiRU4uNjAxLjMxMCIsCiAgICAgICAgICAgICAgICJTZWN0aW9uIjogIjAxIgogICAgICAgICAgICB9CiAgICAgICAgXQogICAgfQogICAgICAKICAgICAg.dqp3BZYY7Iiw2q2lTd8d4KeMa3j6UFGeQQYdToAxLfU'
        url = '/advising/sis_post/'
        request = self.factory.post(
            url, data=token, content_type='application/jwt')
        response = get_response(
            request, self.student.user, url)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        self.student.refresh_from_db()

        self.assertEquals(self.student.primary_major, '1')
        self.assertEquals(len(self.student.other_majors), 2)
        self.assertTrue('2' in self.student.other_majors)
        self.assertTrue('3' in self.student.other_majors)

        self.assertEquals(len(self.student.minors), 1)
        self.assertEquals(
            self.student.minors[0], '4')

        self.assertEquals(len(self.student.advisors.all()), 2)
        self.assertTrue(self.student.advisors.filter(
            first_name='5', last_name='5',
            jhed='6@jh.edu', email_address='7').exists())

        sections = self.student.sis_registered_sections.all()
        # Replace courses with just SFRC for Spring 2021
        self.assertEquals(len(sections), 1)
        self.assertEquals(sections[0], self.sfrc)

    def test_get_semesters(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_semesters/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.student.user, url, self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        retrieved_semesters = response.data['retrievedSemesters']
        self.assertEquals(
            retrieved_semesters, ['Spring 2020', 'Fall 2019'])

    def test_advisor_get_semesters(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        setUpTranscriptForMultipleSemesters(self)
        self.transcript_fall2019.advisors.add(self.advisor_user)

        url = '/advising/sis_semesters/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.advisor_user.user, url, self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        retrieved_semesters = response.data['retrievedSemesters']
        # Only invited to Fall 2019, so should not include Spring 2020
        self.assertEquals(retrieved_semesters, ['Fall 2019'])

    def test_invalid_token_fails(self):
        setUpMockData(self)
        token = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgICAgICJQZXJzb25hbEluZm8iOgogICAgICAgIHsKICAgICAgICAgICAgIkZ1bGxOYW1lIjogIldhbmcsIEphbWVzIiwKICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJqd2FuZzM4MEBqaHUuZWR1IiwKICAgICAgICAgICAgIkpoZWRJZCI6ICJqd2FuZzM4MCIsCiAgICAgICAgICAgICJQcmltYXJ5TWFqb3IiOiAiMSIKICAgICAgICB9LAogICAgICAgICJOb25QcmltYXJ5TWFqb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWFqb3IiOiAiMiIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIk1ham9yIjogIjMiCiAgICAgICAgICAgIH0KICAgICAgICBdLAogICAgICAgICJNaW5vcnMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJNaW5vck5hbWUiOiAiNCIKICAgICAgICAgICAgfQogICAgICAgIF0sCiAgICAgICAgIkFkdmlzb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiRnVsbE5hbWUiOiAiNSw1IiwKICAgICAgICAgICAgICAgICJKaGVkSWQiOiAiNiIsCiAgICAgICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogIjciCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJGdWxsTmFtZSI6ICJHaG9yYmFuaSBLaGFsZWRpLCBTb3VkZWgiLAogICAgICAgICAgICAgICAgIkpoZWRJZCI6ICJzZ2hvcmJhMSIsCiAgICAgICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogInNvdWRlaEBqaHUuZWR1IgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiQ291cnNlcyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICAiVGVybSI6ICJTcHJpbmcgMjAyMSIsCiAgICAgICAgICAgICAgICJPZmZlcmluZ05hbWUiOiAiRU4uNjAxLjMxMCIsCiAgICAgICAgICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAxIgogICAgICAgICAgICB9CiAgICAgICAgXQogICAgfQogICAgICAKICAgICAg.3EezvIP5EWyTmUQ7Tcgxyv1rDzU5FYUSD18TAraWgJ4'
        url = '/advising/sis_post/'
        request = self.factory.post(
            url, data=token, content_type='application/jwt')
        try:
            response = get_response(
                request, self.student.user, url)
            self.assertNotEquals(response.status_code, status.HTTP_201_CREATED)
            self.fail()
        except Exception:
            pass

    def test_invalid_course(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        courses = response.data['nonexistentCourses']
        self.assertEquals(len(courses), 1)
        self.assertEquals(courses[0], 'MI.841.200')


class RegisteredCoursesViewTest(APITestCase):
    def setUp(self):
        setUpStudent(self)
        self.factory = APIRequestFactory()

    def test_student_get_courses(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Fall/2019/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.student.user, url, 'Fall', '2019', self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 2)
        self.assertTrue(
            registered_courses[0]['code'] == self.linalg.course.code or
            registered_courses[0]['code'] == self.madooei.course.code)

        url = '/advising/sis_courses/Spring/2020/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.student.user, url, 'Spring', '2020', self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 1)
        self.assertEquals(registered_courses[0]['code'], self.ifp.course.code)

    def test_advisor_get_courses(self):
        setUpTranscript(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Spring/2020/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.advisor_user.user, url, 'Spring', '2020', self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 1)
        self.assertEquals(registered_courses[0]['code'], self.ifp.course.code)

    def test_student_courses_verified(self):
        setUpPersonalTimetable(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Fall/2019/{}/{}/'.format(
            self.student.jhed, self.tt.name)
        request = self.factory.get(url)
        response = get_response(
            request, self.student.user, url,
            'Fall', '2019', self.student.jhed, self.tt.name)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        courses = response.data['registeredCourses']
        self.assertEquals(len(courses), 3)
        self.assertTrue(
            any([course['code'] == self.linalg.course.code for course in courses]))
        self.assertTrue(
            any([course['code'] == self.madooei.course.code for course in courses]))
        self.assertTrue(
            any([course['code'] == self.discrete.course.code for course in courses]))

        self.assertTrue(all([course['isVerified'] if course['code'] ==
                             self.linalg.course.code else True for course in courses]))
        self.assertTrue(all([course['isVerified'] if course['code'] ==
                             self.madooei.course.code else True for course in courses]))
        self.assertTrue(all([not course['isVerified'] if course['code']
                             == self.discrete.course.code else True for course in courses]))

    def test_nonadvisor_get_courses_fails(self):
        setUpTranscript(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        self.student2 = Student.objects.create(
            user=User.objects.create(username='a', password='b'))
        url = '/advising/sis_courses/Spring/2020/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(request, self.student2.user,
                                url, 'Spring', '2020', self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_noninvited_advisor_get_courses_fails(self):
        setUpTranscriptNoAdvisor(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Spring/2020/{}/'.format(self.student.jhed)
        request = self.factory.get(url)
        response = get_response(
            request, self.advisor_user.user, url, 'Spring', '2020', self.student.jhed)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
