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
from student.models import Student
from forum.models import Transcript


class UrlsTest(TestCase, UrlTestCase):
    """ Test advising/urls.py """

    def setUp(self):
        semester = Semester.objects.create(name='Fall', year='2016')
        semester.save()

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView(
            '/advising/jhu_signup/', 'helpers.mixins.FeatureFlowView')
        self.assertUrlResolvesToView(
            '/advising/', 'advising.views.AdvisingView')
        self.assertUrlResolvesToView(
            '/advising/sis_post/', 'advising.views.StudentSISView')
        self.assertUrlResolvesToView(
            '/advising/sis_semesters/', 'advising.views.StudentSISView')
        self.assertUrlResolvesToView(
            '/advising/sis_courses/Fall/2016/', 'advising.views.RegisteredCoursesView')


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
    setUpMockSemesters(self)
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


def get_response(request, user, url):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = 'uoft'
    view = resolve(url).func
    return view(request)


def get_response_for_semester(request, user, url, name, year):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = 'uoft'
    view = resolve(url).func
    return view(request, name, year)


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
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJTdHVkZW50SW5mbyI6CiAgICB7CiAgICAgICJGdWxsTmFtZSI6ICJXYW5nLCBKYW1lcyIsCiAgICAgICJFbWFpbEFkZHJlc3MiOiAiandhbmczODBAamh1LmVkdSIsCiAgICAgICJKaGVkSWQiOiAiandhbmczODBAamguZWR1IiwKICAgICAgIlByaW1hcnlNYWpvciI6ICJDb21wdXRlciBTY2llbmNlIgogICAgfSwKICAiTm9uUHJpbWFyeU1ham9ycyI6IFsKICAgIHsKICAgICAgIk1ham9yIjogIk1hdGhlbWF0aWNzIgogICAgfSwKICAgIHsKICAgICAgIk1ham9yIjogIldyaXRpbmcgU2VtaW5hcnMiCiAgICB9CiAgXSwKICAiTWlub3JzIjogWwogICAgewogICAgICAiTWlub3IiOiAiTWFuYWdlbWVudCAmIEVudHJlcHJlbmV1cnNoaXAiCiAgICB9CiAgXSwKICAiQWR2aXNvcnMiOiBbCiAgICB7CiAgICAgICJGdWxsTmFtZSI6ICJNb3VsdG9uLCBMaW5kYSBIIiwKICAgICAgIkpoZWRJZCI6ICJsbW91bHRvMkBqaC5lZHUiLAogICAgICAiRW1haWxBZGRyZXNzIjogImxtb3VsdG8yQGpodS5lZHUiCiAgICB9LAogICAgewogICAgICAiRnVsbE5hbWUiOiAiR2hvcmJhbmkgS2hhbGVkaSwgU291ZGVoIiwKICAgICAgIkpoZWRJZCI6ICJzZ2hvcmJhMUBqaC5lZHUiLAogICAgICAiRW1haWxBZGRyZXNzIjogInNvdWRlaEBqaHUuZWR1IgogICAgfQogIF0sCiAgIkNvdXJzZXMiOiBbCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICJPZmZlcmluZ05hbWUiOiAiQVMuMTEwLjIxMiIsCiAgICAgICAgIlNlY3Rpb25OdW1iZXIiOiAiMDEiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICJPZmZlcmluZ05hbWUiOiAiRU4uNjAxLjIyNiIsCiAgICAgICAgIlNlY3Rpb25OdW1iZXIiOiAiMDIiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJJbnRlcnNlc3Npb24gMjAyMCIsCiAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJBUy4zNzYuMTY4IiwKICAgICAgICAiU2VjdGlvbk51bWJlciI6ICIyMiIKICAgICAgfSwKICAgICAgewogICAgICAgICJUZXJtIjogIlNwcmluZyAyMDIwIiwKICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkFTLjIyMC4xMDUiLAogICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjE1IgogICAgICB9LAogICAgICB7CiAgICAgICAgIlRlcm0iOiAiRmFsbCAyMDIwIiwKICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIk1JLjg0MS4yMDAiLAogICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAxIgogICAgICB9CiAgXQp9CiAgICAgIA.wAR0mISeWA2vK0HYI4gHx6Yex9Gl8pFu0jwmOTRgplM'
    token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgICAgICJTdHVkZW50SW5mbyI6CiAgICAgICAgewogICAgICAgICAgICAiRnVsbE5hbWUiOiAiV2FuZywgSmFtZXMiLAogICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogImp3YW5nMzgwQGpodS5lZHUiLAogICAgICAgICAgICAiSmhlZElkIjogImp3YW5nMzgwQGpoLmVkdSIsCiAgICAgICAgICAgICJQcmltYXJ5TWFqb3IiOiAiQ29tcHV0ZXIgU2NpZW5jZSIKICAgICAgICB9LAogICAgICAgICJOb25QcmltYXJ5TWFqb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWFqb3IiOiAiTWF0aGVtYXRpY3MiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJNYWpvciI6ICJXcml0aW5nIFNlbWluYXJzIgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiTWlub3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWlub3IiOiAiTWFuYWdlbWVudCAmIEVudHJlcHJlbmV1cnNoaXAiCiAgICAgICAgICAgIH0KICAgICAgICBdLAogICAgICAgICJBZHZpc29ycyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIkZ1bGxOYW1lIjogIk1vdWx0b24sIExpbmRhIEgiLAogICAgICAgICAgICAgICAgIkpoZWRJZCI6ICJsbW91bHRvMkBqaC5lZHUiLAogICAgICAgICAgICAgICAgIkVtYWlsQWRkcmVzcyI6ICJsbW91bHRvMkBqaHUuZWR1IgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiRnVsbE5hbWUiOiAiR2hvcmJhbmkgS2hhbGVkaSwgU291ZGVoIiwKICAgICAgICAgICAgICAgICJKaGVkSWQiOiAic2dob3JiYTFAamguZWR1IiwKICAgICAgICAgICAgICAgICJFbWFpbEFkZHJlc3MiOiAic291ZGVoQGpodS5lZHUiCiAgICAgICAgICAgIH0KICAgICAgICBdLAogICAgICAgICJDb3Vyc2VzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJBUy4xMTAuMjEyIiwKICAgICAgICAgICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAxIgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJFTi42MDEuMjI2IiwKICAgICAgICAgICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAyIgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiVGVybSI6ICJJbnRlcnNlc3Npb24gMjAyMCIsCiAgICAgICAgICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkFTLjM3Ni4xNjgiLAogICAgICAgICAgICAgICAgIlNlY3Rpb25OdW1iZXIiOiAiMjIiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJUZXJtIjogIlNwcmluZyAyMDIwIiwKICAgICAgICAgICAgICAgICJPZmZlcmluZ05hbWUiOiAiQVMuMjIwLjEwNSIsCiAgICAgICAgICAgICAgICAiU2VjdGlvbk51bWJlciI6ICIxNSIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIlRlcm0iOiAiRmFsbCAyMDIwIiwKICAgICAgICAgICAgICAgICJPZmZlcmluZ05hbWUiOiAiTUkuODQxLjIwMCIsCiAgICAgICAgICAgICAgICAiU2VjdGlvbk51bWJlciI6ICIwMSIKICAgICAgICAgICAgfQogICAgICAgIF0KICAgIH0.XgyC5XnTXTrNAAC0lw68I04MEaExjRalZ71HVcWk2Nc'
    request = self.factory.post(
        '/advising/sis_post/', data=token2, content_type='application/jwt')
    response = get_response(
        request, self.student.user, '/advising/sis_post/')
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
        self.assertEquals(self.student.other_majors[0], 'Mathematics')

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
        self.assertEquals(sections[0], self.linalg)
        self.assertEquals(sections[1], self.madooei)
        self.assertEquals(sections[2], self.vgm)
        self.assertEquals(sections[3], self.ifp)

    # Two of the same posts should not result in a change in the DB
    def test_double_post_identical(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        self.test_sis_posts_into_db()

    def test_new_post_updates(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # Token with hardcoded changes, show up as changes 1-8 in tested fields
        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgICAgICJTdHVkZW50SW5mbyI6CiAgICAgICAgewogICAgICAgICAgICAiRnVsbE5hbWUiOiAiV2FuZywgSmFtZXMiLAogICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogImp3YW5nMzgwQGpodS5lZHUiLAogICAgICAgICAgICAiSmhlZElkIjogImp3YW5nMzgwQGpoLmVkdSIsCiAgICAgICAgICAgICJQcmltYXJ5TWFqb3IiOiAiMSIKICAgICAgICB9LAogICAgICAgICJOb25QcmltYXJ5TWFqb3JzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAiTWFqb3IiOiAiMiIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIk1ham9yIjogIjMiCiAgICAgICAgICAgIH0KICAgICAgICBdLAogICAgICAgICJNaW5vcnMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJNaW5vciI6ICI0IgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiQWR2aXNvcnMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJGdWxsTmFtZSI6ICI1LDUiLAogICAgICAgICAgICAgICAgIkpoZWRJZCI6ICI2IiwKICAgICAgICAgICAgICAgICJFbWFpbEFkZHJlc3MiOiAiNyIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICAgIkZ1bGxOYW1lIjogIkdob3JiYW5pIEtoYWxlZGksIFNvdWRlaCIsCiAgICAgICAgICAgICAgICAiSmhlZElkIjogInNnaG9yYmExQGpoLmVkdSIsCiAgICAgICAgICAgICAgICAiRW1haWxBZGRyZXNzIjogInNvdWRlaEBqaHUuZWR1IgogICAgICAgICAgICB9CiAgICAgICAgXSwKICAgICAgICAiQ291cnNlcyI6IFsKICAgICAgICAgICAgICAgICAgewogICAgICAgICJUZXJtIjogIlNwcmluZyAyMDIxIiwKICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkVOLjYwMS4zMTAiLAogICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAxIgogICAgICB9CiAgICAgICAgXQogICAgfQ.VIVMGgCBAZE88a82ylW9Rim7Q3ffyKtI6Oyr-lefioI'
        request = self.factory.post(
            '/advising/sis_post/', data=token, content_type='application/jwt')
        response = get_response(
            request, self.student.user, '/advising/sis_post/')
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        self.student.refresh_from_db()

        self.assertEquals(self.student.primary_major, '1')
        self.assertEquals(len(self.student.other_majors), 2)
        self.assertEquals(self.student.other_majors[0], '2')
        self.assertEquals(self.student.other_majors[1], '3')

        self.assertEquals(len(self.student.minors), 1)
        self.assertEquals(
            self.student.minors[0], '4')

        self.assertEquals(len(self.student.advisors.all()), 2)
        self.assertTrue(self.student.advisors.filter(
            first_name='5', last_name='5',
            jhed='6', email_address='7').exists())

        sections = self.student.sis_registered_sections.all()
        # Replace courses with just SFRC for Fall 2020
        self.assertEquals(len(sections), 1)
        self.assertEquals(sections[0], self.sfrc)

    def test_get_semesters(self):
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        request = self.factory.get('/advising/sis_semesters/', format='json')
        response = get_response(
            request, self.student.user, '/advising/sis_semesters/')
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        retrieved_semesters = response.data['retrievedSemesters']
        self.assertEquals(
            retrieved_semesters, ['Spring 2020', 'Fall 2019'])

    def test_invalid_token_fails(self):
        setUpMockData(self)
        token = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJTdHVkZW50SW5mbyI6CiAgICB7CiAgICAgICJGdWxsTmFtZSI6ICJXYW5nLCBKYW1lcyIsCiAgICAgICJFbWFpbEFkZHJlc3MiOiAiandhbmczODBAamh1LmVkdSIsCiAgICAgICJKaGVkSWQiOiAiandhbmczODBAamguZWR1IiwKICAgICAgIlByaW1hcnlNYWpvciI6ICJDb21wdXRlciBTY2llbmNlIgogICAgfSwKICAiTm9uUHJpbWFyeU1ham9ycyI6IFsKICAgIHsKICAgICAgIk1ham9yIjogIk1hdGhlbWF0aWNzIgogICAgfSwKICAgIHsKICAgICAgIk1ham9yIjogIldyaXRpbmcgU2VtaW5hcnMiCiAgICB9CiAgXSwKICAiTWlub3JzIjogWwogICAgewogICAgICAiTWlub3IiOiAiTWFuYWdlbWVudCAmIEVudHJlcHJlbmV1cnNoaXAiCiAgICB9CiAgXSwKICAiQWR2aXNvcnMiOiBbCiAgICB7CiAgICAgICJGdWxsTmFtZSI6ICJNb3VsdG9uLCBMaW5kYSBIIiwKICAgICAgIkpoZWRJZCI6ICJsbW91bHRvMkBqaC5lZHUiLAogICAgICAiRW1haWxBZGRyZXNzIjogImxtb3VsdG8yQGpodS5lZHUiCiAgICB9LAogICAgewogICAgICAiRnVsbE5hbWUiOiAiR2hvcmJhbmkgS2hhbGVkaSwgU291ZGVoIiwKICAgICAgIkpoZWRJZCI6ICJzZ2hvcmJhMUBqaC5lZHUiLAogICAgICAiRW1haWxBZGRyZXNzIjogInNvdWRlaEBqaHUuZWR1IgogICAgfQogIF0sCiAgIkNvdXJzZXMiOiBbCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICJPZmZlcmluZ05hbWUiOiAiQVMuMTEwLjIxMiIsCiAgICAgICAgIlNlY3Rpb25OdW1iZXIiOiAiMDEiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJGYWxsIDIwMTkiLAogICAgICAgICJPZmZlcmluZ05hbWUiOiAiRU4uNjAxLjIyNiIsCiAgICAgICAgIlNlY3Rpb25OdW1iZXIiOiAiMDIiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAiVGVybSI6ICJJbnRlcnNlc3Npb24gMjAyMCIsCiAgICAgICAgIk9mZmVyaW5nTmFtZSI6ICJBUy4zNzYuMTY4IiwKICAgICAgICAiU2VjdGlvbk51bWJlciI6ICIyMiIKICAgICAgfSwKICAgICAgewogICAgICAgICJUZXJtIjogIlNwcmluZyAyMDIwIiwKICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIkFTLjIyMC4xMDUiLAogICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjE1IgogICAgICB9LAogICAgICB7CiAgICAgICAgIlRlcm0iOiAiRmFsbCAyMDIwIiwKICAgICAgICAiT2ZmZXJpbmdOYW1lIjogIk1JLjg0MS4yMDAiLAogICAgICAgICJTZWN0aW9uTnVtYmVyIjogIjAxIgogICAgICB9CiAgXQp9CiAgICAgIA.wAR0mISeWA2vK0HYI4gHx6Yex9Gl8pFu0jwmOTRgplM'
        request = self.factory.post(
            '/advising/sis_post/', data=token, content_type='application/jwt')
        try:
            response = get_response(
                request, self.student.user, '/advising/sis_post/')
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

        url = '/advising/sis_courses/Fall/2019/'
        request = self.factory.get(url)
        response = get_response_for_semester(
            request, self.student.user, url, 'Fall', '2019')
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 2)
        self.assertEquals(
            registered_courses[0]['code'], self.linalg.course.code)
        self.assertEquals(
            registered_courses[1]['code'], self.madooei.course.code)

        url = '/advising/sis_courses/Spring/2020/'
        request = self.factory.get(url)
        response = get_response_for_semester(
            request, self.student.user, url, 'Spring', '2020')
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 1)
        self.assertEquals(registered_courses[0]['code'], self.ifp.course.code)

    # Write when the verification TODO is satisfied
    # def test_student_courses_verified(self):
    #     pass

    def test_advisor_get_courses(self):
        setUpTranscript(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Spring/2020/'
        data = {'jhed': self.student.jhed}
        request = self.factory.get(url, data=data, format='json')
        response = get_response_for_semester(
            request, self.advisor_user.user, url, 'Spring', '2020')
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        registered_courses = response.data['registeredCourses']
        self.assertEquals(len(registered_courses), 1)
        self.assertEquals(registered_courses[0]['code'], self.ifp.course.code)

    def test_nonadvisor_get_courses_fails(self):
        setUpTranscript(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Spring/2020/'
        data = {'jhed': self.student.jhed}
        request = self.factory.get(url, data=data, format='json')
        response = get_response_for_semester(
            request, self.student.user, url, 'Spring', '2020')
        # Ironically, student can't request their own data like this haha
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_noninvited_advisor_get_courses_fails(self):
        setUpTranscriptNoAdvisor(self)
        response = sis_post(self)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        url = '/advising/sis_courses/Spring/2020/'
        data = {'jhed': self.student.jhed}
        request = self.factory.get(url, data=data, format='json')
        response = get_response_for_semester(
            request, self.advisor_user.user, url, 'Spring', '2020')
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
