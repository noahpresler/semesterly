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
from django.urls import resolve
from django.forms.models import model_to_dict
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from student.models import Student, PersonalTimetable, Reaction, PersonalEvent, RegistrationToken
from timetable.models import Semester, Course, Section, Offering
from helpers.test.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # profile management
        self.assertUrlResolvesToView(
            '/unsubscribe/akdC@+-EI/alc:_=/',
            'student.views.unsubscribe')
        self.assertUrlResolvesToView(
            '/user/settings/', 'student.views.UserView')

        # timetable management
        self.assertUrlResolvesToView(
            '/user/timetables/',
            'student.views.UserTimetableView')
        self.assertUrlResolvesToView(
            '/user/timetables/Fall/2016/',
            'student.views.UserTimetableView',
            kwargs={'sem_name': 'Fall', 'year': '2016'})
        self.assertUrlResolvesToView(
            '/user/timetables/Fall/2016/mytt/',
            'student.views.UserTimetableView',
            kwargs={'sem_name': 'Fall', 'year': '2016', 'tt_name': 'mytt'})
        # social
        self.assertUrlResolvesToView(
            '/user/classmates/Fall/2016?courseids=1&courseids=2',
            'student.views.ClassmateView',
            kwargs={'sem_name': 'Fall', 'year': '2016'})
        #self.assertUrlResolvesToView('/user/gcal/', 'student.views.GCalView')
        self.assertUrlResolvesToView(
            '/user/reactions/',
            'student.views.ReactionView')
        self.assertUrlResolvesToView(
            '/delete_account/',
            'helpers.mixins.FeatureFlowView')


class UserViewTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)
        self.factory = APIRequestFactory()

    def test_profile_page(self):
        self.client.force_login(self.user)
        response = self.client.get('/user/settings/')
        self.assertTemplateUsed(response, 'profile.html')

    def test_profile_page_not_signed_in(self):
        self.client.logout()
        response = self.client.get('/user/settings/')
        self.assertRedirects(response, '/signup/')

    def test_update_settings(self):
        new_settings = {
            'emails_enabled': True,
            'social_courses': True,
            'major': 'CS'
        }
        request = self.factory.patch(
            '/user/settings/', new_settings, format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        view = resolve('/user/settings/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.student = Student.objects.get(user=self.user)
        self.assertDictContainsSubset(
            new_settings, model_to_dict(
                self.student))

    def test_delete_user(self):
        sem = Semester.objects.create(name='Winter', year='2000')
        course = Course.objects.create(school='skool', code='A101', name='intro')
        section = Section.objects.create(
            course=course, meeting_section='A', semester=sem)
        reaction = Reaction.objects.create(student=self.student, title='FIRE')
        reaction.course.add(course)
        reaction.save()

        tt = PersonalTimetable.objects.create(
            semester=sem, school='skool', name='mytt', student=self.student)
        event = PersonalEvent.objects.create(
            name='gym', day='T', time_start='8:00', time_end='9:00')
        tt.events.add(event)
        tt.courses.add(course)
        tt.sections.add(section)
        tt.save()

        token = RegistrationToken(student=self.student)

        request = self.factory.delete('/user/settings/')
        force_authenticate(request, user=self.user)
        request.user = self.user
        view = resolve('/user/settings/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # all student related data should be deleted
        self.assertFalse(User.objects.exists())
        self.assertFalse(Student.objects.exists())
        self.assertFalse(PersonalTimetable.objects.exists())
        # TODO
        # self.assertFalse(PersonalEvent.objects.exists())
        self.assertFalse(RegistrationToken.objects.exists())

        # course data should be untouched
        self.assertTrue(Course.objects.exists())
        self.assertTrue(Section.objects.exists())
        self.assertTrue(Semester.objects.exists())


class UserTimetableViewTest(APITestCase):

    def setUp(self):
        """ Create a user and personal timetable. """
        self.user = User.objects.create_user(
            username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)
        self.sem = Semester.objects.create(name='Winter', year='1995')

        course = Course.objects.create(
            id=1, school='uoft', code='SEM101', name='Intro')
        section = Section.objects.create(
            id=1, course=course, semester=self.sem, meeting_section='L1')
        Offering.objects.create(
            id=1, section=section, day='M', date_start='08-29-1995', date_end='12-10-1995', time_start='8:00', time_end='10:00')
        tt = PersonalTimetable.objects.create(
            name='tt', school='uoft', semester=self.sem, student=self.student)
        tt.courses.add(course)
        tt.sections.add(section)
        tt.save()

        self.factory = APIRequestFactory()

    def test_get_timetables(self):
        request = self.factory.get(
            '/user/timetables/Winter/1995/', format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/Winter/1995/').func
        response = view(request, 'Winter', '1995')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['timetables']), 1)
        self.assertEqual(len(response.data['courses']), 1)

    def test_create_timetable(self):
        data = {
            'semester': {
                'name': 'Winter',
                'year': '1995'
            },
            'slots': [{
                'course': 1,
                'section': 1,
                'offerings': [1],
            }],
            'events': [],
            'name': 'new tt',
            'has_conflict': False
        }
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        PersonalTimetable.objects.get(name='new tt')

    def test_create_timetable_exists(self):
        data = {
            'semester': {
                'name': 'Winter',
                'year': '1995'
            },
            'slots': [{
                'course': 1,
                'section': 1,
                'offerings': [1],
            }],
            'events': [],
            'name': 'tt',
            'has_conflict': False
        }
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_duplicate_timetable(self):
        data = {
            'source': 'tt',
            'semester': {
                'name': 'Winter',
                'year': '1995'
            },
            'name': 'dupe tt',
        }
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        PersonalTimetable.objects.get(name='dupe tt')

    def test_rename_timetable(self):
        data = {
            'id': 10,
            'semester': {
                'name': 'Winter',
                'year': '1995'
            },
            'slots': [{
                'course': 1,
                'section': 1,
                'offerings': [1],
            }],
            'events': [],
            'name': 'renamed',
            'has_conflict': False
        }
        PersonalTimetable.objects.create(
            id=10,
            name='oldtt',
            school='uoft',
            semester=self.sem,
            student=self.student)
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PersonalTimetable.objects.get(id=10).name, 'renamed')

    def test_delete_timetable(self):
        PersonalTimetable.objects.create(
            id=20,
            name='todelete',
            school='uoft',
            semester=self.sem,
            student=self.student)
        request = self.factory.delete('/user/timetables/Winter/1995/todelete')
        force_authenticate(request, user=self.user)
        request.user = self.user
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request, 'Winter', '1995', 'todelete')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PersonalTimetable.objects.filter(id=20).exists())


class ClassmateViewTest(APITestCase):

    def setUp(self):
        # set up friends
        self.user1 = User.objects.create_user(
            first_name='jacob',
            last_name='D',
            username='jacob',
            password='secret')
        self.student1 = Student.objects.create(
            id=1, user=self.user1, social_courses=True, social_all=True)

        self.user2 = User.objects.create_user(
            first_name='tim',
            last_name='F',
            username='tim',
            password='secret')
        self.student2 = Student.objects.create(
            id=2, user=self.user2, social_courses=True, social_all=True)

        self.user3 = User.objects.create_user(
            first_name='matt',
            last_name='A',
            username='matt',
            password='secret')
        self.student3 = Student.objects.create(
            id=3, user=self.user3, social_courses=True, social_all=True)

        # 1 and 2 are friends
        self.student2.friends.add(self.student1)
        self.student2.save()
        self.student1.friends.add(self.student2)
        self.student2.save()

        # set up course with two sections
        sem = Semester.objects.create(name='Fall', year='2000')
        course = Course.objects.create(
            id=1, school='uoft', code='SEM101', name='Intro')
        section1 = Section.objects.create(
            course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(
            section=section1,
            day='M',
            date_start='08-29-2000',
            date_end='12-10-2000',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)

        section2 = Section.objects.create(
            course=course, semester=sem, meeting_section='L2')
        Offering.objects.create(
            section=section2,
            day='W',
            date_start='08-29-2000',
            date_end='12-10-2000',
            time_start='8:00',
            time_end='10:00',
            is_short_course=False)

        # students have a timetable in common
        tt1 = PersonalTimetable.objects.create(
            name='tt', school='uoft', semester=sem, student=self.student1)
        tt1.courses.add(course)
        tt1.sections.add(section1)
        tt1.save()

        tt2 = PersonalTimetable.objects.create(
            name='tt', school='uoft', semester=sem, student=self.student2)
        tt2.courses.add(course)
        tt2.sections.add(section1)
        tt2.save()

        tt3 = PersonalTimetable.objects.create(
            name='tt', school='uoft', semester=sem, student=self.student3)
        tt3.courses.add(course)
        tt3.sections.add(section1)
        tt3.save()

        # student2 has another timetable
        tt4 = PersonalTimetable.objects.create(
            name='tt', school='uoft', semester=sem, student=self.student2)
        tt4.courses.add(course)
        tt4.sections.add(section2)
        tt4.save()

        self.factory = APIRequestFactory()

    def test_get_classmate_counts(self):
        request = self.factory.get(
            '/user/classmates/Fall/2000/', {'count': True, 'course_ids[]': [1]})
        force_authenticate(request, user=self.user2)
        request.user = self.user2
        request.subdomain = 'uoft'
        view = resolve('/user/classmates/Fall/2016/').func
        response = view(request, 'Fall', '2000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertDictEqual(response.data, {
            'id': 1,
            'count': 1,
            'total_count': 1
        })

    def test_get_classmates(self):
        request = self.factory.get(
            '/user/classmates/Fall/2000/', {'course_ids[]': [1]})
        force_authenticate(request, user=self.user2)
        request.user = self.user2
        request.subdomain = 'uoft'
        view = resolve('/user/classmates/Fall/2016/').func
        response = view(request, 'Fall', '2000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data), 1)
        classmates = response.data[1]['current'] # key is course id
        self.assertEqual(len(classmates), 1)
        self.assertEqual(classmates[0]['first_name'], self.user1.first_name)
        self.assertEqual(classmates[0]['last_name'], self.user1.last_name)
        self.assertEqual(len(response.data[1]['past']), 0)

    def test_find_friends(self):
        request = self.factory.get('/user/classmates/Fall/2000/')
        force_authenticate(request, user=self.user3)
        request.user = self.user3
        request.subdomain = 'uoft'
        view = resolve('/user/classmates/Fall/2016/').func
        response = view(request, 'Fall', '2000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class ReactionTest(APITestCase):

    def setUp(self):
        """ Create a user and course. """
        self.user = User.objects.create_user(
            username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)

        self.course = Course.objects.create(
            id=1, school='uoft', code='SEM101', name='Intro')
        self.title = Reaction.REACTION_CHOICES[0][0]

        self.factory = APIRequestFactory()

    def test_add_reaction(self):
        data = {
            'cid': 1,
            'title': self.title
        }
        request = self.factory.post('/user/reactions/', data, format='json')
        request.subdomain = 'uoft'
        force_authenticate(request, user=self.user)
        request.user = self.user
        view = resolve('/user/reactions/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue('reactions' in response.data)
        Reaction.objects.get(student=self.student, title=self.title)
        self.assertGreater(Course.objects.get(id=1).reaction_set.count(), 0)
