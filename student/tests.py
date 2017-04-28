from django.contrib.auth.models import User
from django.forms.models import model_to_dict
from django.core.urlresolvers import resolve
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from rest_framework import status

from test_utils.test_cases import UrlTestCase
from student.models import Student, PersonalTimetable
from timetable.models import Semester, Course, Section, Offering

class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # view_timetable redirects
        self.assertUrlResolvesToView('/react/', 'student.views.react_to_course'),

        # profile management
        self.assertUrlResolvesToView('/unsubscribe/akdC@+-EI/alc:_=/', 'student.views.unsubscribe')
        self.assertUrlResolvesToView('/user/settings/', 'student.views.UserView')

        # timetable management
        self.assertUrlResolvesToView('/user/timetables/', 'student.views.UserTimetableView')
        self.assertUrlResolvesToView('/user/timetables/Fall/2016/', 'student.views.UserTimetableView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016'})
        self.assertUrlResolvesToView('/user/timetables/Fall/2016/mytt/', 'student.views.UserTimetableView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016', 'tt_name': 'mytt'})
        # social
        self.assertUrlResolvesToView('/user/classmates/Fall/2016?courseids=1&courseids=2',
                                     'student.views.ClassmateView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016'})
        self.assertUrlResolvesToView('/user/gcal/', 'student.views.GCalView')


class UserViewTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)
        self.factory = APIRequestFactory()

    def test_profile_page(self):
        self.client.force_login(self.user)
        response = self.client.get('/user/settings/')
        self.assertTemplateUsed(response, 'profile.html')

    def test_profile_page_not_signed_in(self):
        self.client.logout()
        response = self.client.get('/user/settings/')
        self.assertTemplateUsed(response, 'index.html')

    def test_update_settings(self):
        new_settings = {
            'emails_enabled': True,
            'social_courses': True,
            'major': 'CS'
        }
        request = self.factory.patch('/user/settings/', new_settings, format='json')
        force_authenticate(request, user=self.user)
        view = resolve('/user/settings/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.student = Student.objects.get(user=self.user)
        self.assertDictContainsSubset(new_settings, model_to_dict(self.student))


class UserTimetableViewTest(APITestCase):

    def setUp(self):
        """ Create a user and personal timetable. """
        self.user = User.objects.create_user(username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)
        self.sem = Semester.objects.create(name='Winter', year='1995')

        course = Course.objects.create(id=1, school='uoft', code='SEM101', name='Intro')
        section = Section.objects.create(course=course, semester=self.sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')
        tt = PersonalTimetable.objects.create(name='tt', school='uoft', semester=self.sem, student=self.student)
        tt.courses.add(course)
        tt.sections.add(section)
        tt.save()

        self.factory = APIRequestFactory()

    def test_get_timetables(self):
        request = self.factory.get('/user/timetables/Winter/1995/', format='json')
        force_authenticate(request, user=self.user)
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/Winter/1995/').func
        response = view(request, 'Winter', '1995')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_timetable(self):
        data = {
            'semester': {
                'name': 'Winter',
                'year': '1995'
            },
            'courses': [{
                'id': 1,
                'enrolled_sections': ['L1']
            }],
            'name': 'new tt',
            'has_conflict': False
        }
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
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
            'courses': [{
                'id': 1,
                'enrolled_sections': ['L1']
            }],
            'name': 'tt',
            'has_conflict': False
        }
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
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
            'courses': [{
                'id': 1,
                'enrolled_sections': ['L1']
            }],
            'name': 'renamed',
            'has_conflict': False
        }
        PersonalTimetable.objects.create(id=10, name='oldtt', school='uoft', semester=self.sem, student=self.student)
        request = self.factory.post('/user/timetables/', data, format='json')
        force_authenticate(request, user=self.user)
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PersonalTimetable.objects.get(id=10).name, 'renamed')

    def test_delete_timetable(self):
        PersonalTimetable.objects.create(id=20, name='todelete', school='uoft', semester=self.sem, student=self.student)
        request = self.factory.delete('/user/timetables/Winter/1995/todelete')
        force_authenticate(request, user=self.user)
        request.subdomain = 'uoft'
        view = resolve('/user/timetables/').func
        response = view(request, 'Winter', '1995', 'todelete')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PersonalTimetable.objects.filter(id=20).exists())


class ClassmateViewTest(APITestCase):

    def setUp(self):
        # set up friends
        self.user1 = User.objects.create_user(first_name='jacob', last_name='D', username='jacob', password='secret')
        self.student1 = Student.objects.create(id=1, user=self.user1, social_courses=True, social_all=True)

        self.user2 = User.objects.create_user(first_name='tim', last_name='F', username='tim', password='secret')
        self.student2 = Student.objects.create(id=2, user=self.user2, social_courses=True, social_all=True)

        self.user3 = User.objects.create_user(first_name='matt', last_name='A', username='matt', password='secret')
        self.student3 = Student.objects.create(id=3, user=self.user3, social_courses=True, social_all=True)

        # 1 and 2 are friends
        self.student2.friends.add(self.student1)
        self.student2.save()
        self.student1.friends.add(self.student2)
        self.student2.save()

        # set up course with two sections
        sem = Semester.objects.create(name='Fall', year='2000')
        course = Course.objects.create(id=1, school='uoft', code='SEM101', name='Intro')
        section1 = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section1, day='M', time_start='8:00', time_end='10:00')

        section2 = Section.objects.create(course=course, semester=sem, meeting_section='L2')
        Offering.objects.create(section=section2, day='W', time_start='8:00', time_end='10:00')

        # students have a timetable in common
        tt1 = PersonalTimetable.objects.create(name='tt', school='uoft', semester=sem, student=self.student1)
        tt1.courses.add(course)
        tt1.sections.add(section1)
        tt1.save()

        tt2 = PersonalTimetable.objects.create(name='tt', school='uoft', semester=sem, student=self.student2)
        tt2.courses.add(course)
        tt2.sections.add(section1)
        tt2.save()

        tt3 = PersonalTimetable.objects.create(name='tt', school='uoft', semester=sem, student=self.student3)
        tt3.courses.add(course)
        tt3.sections.add(section1)
        tt3.save()

        # student2 has another timetable
        tt4 = PersonalTimetable.objects.create(name='tt', school='uoft', semester=sem, student=self.student2)
        tt4.courses.add(course)
        tt4.sections.add(section2)
        tt4.save()

        self.factory = APIRequestFactory()

    def test_get_classmate_counts(self):
        request = self.factory.get('/user/classmates/Fall/2000/', {'counts': True, 'course_ids': [1]})
        force_authenticate(request, user=self.user2)
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
        request = self.factory.get('/user/classmates/Fall/2000/', {'course_ids': [1]})
        force_authenticate(request, user=self.user2)
        request.subdomain = 'uoft'
        view = resolve('/user/classmates/Fall/2016/').func
        response = view(request, 'Fall', '2000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data), 1)
        classmates = response.data[0]['classmates']
        self.assertEqual(len(classmates), 1)
        self.assertEqual(classmates[0]['first_name'], self.user1.first_name)
        self.assertEqual(classmates[0]['last_name'], self.user1.last_name)
        self.assertEqual(len(response.data[0]['past_classmates']), 0)

    def test_find_friends(self):
        request = self.factory.get('/user/classmates/Fall/2000/')
        force_authenticate(request, user=self.user3)
        request.subdomain = 'uoft'
        view = resolve('/user/classmates/Fall/2016/').func
        response = view(request, 'Fall', '2000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
