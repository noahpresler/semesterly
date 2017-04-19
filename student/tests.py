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
        # profile management
        self.assertUrlResolvesToView('/unsubscribe/akdC@+-EI/alc:_=/', 'student.views.unsubscribe')
        self.assertUrlResolvesToView('/user/save_settings/', 'student.views.save_settings')
        self.assertUrlResolvesToView('/me/', 'timetable.views.profile')

        # timetable management
        self.assertUrlResolvesToView('/user/save_timetable/', 'student.views.save_timetable')
        self.assertUrlResolvesToView('/user/duplicate_timetable/', 'student.views.duplicate_timetable')
        self.assertUrlResolvesToView('/user/delete_timetable/', 'student.views.delete_timetable')
        self.assertUrlResolvesToView('/user/get_saved_timetables/jhu/Summer/2018',
                                     'student.views.get_student_tts_wrapper')

        # social
        self.assertUrlResolvesToView('/user/get_classmates/', 'student.views.get_classmates')
        self.assertUrlResolvesToView('/user/get_most_classmates_count/', 'student.views.get_most_classmate_count')
        self.assertUrlResolvesToView('/user/find_friends/', 'student.views.find_friends')
        self.assertUrlResolvesToView('/user/add_to_gcal/', 'student.views.add_tt_to_gcal')

        # api
        self.assertUrlResolvesToView('/user/settings/', 'student.views.UserView')
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

        sem = Semester.objects.create(name='Winter', year='1995')
        course = Course.objects.create(id=1, school='uoft', code='SEM101', name='Intro')
        section = Section.objects.create(course=course, semester=sem, meeting_section='L1')
        Offering.objects.create(section=section, day='M', time_start='8:00', time_end='10:00')
        tt = PersonalTimetable.objects.create(name='tt', school='uoft', semester=sem, student=self.student)
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
            'sem_name': 'Winter',
            'year': '1995',
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
            'sem_name': 'Winter',
            'year': '1995',
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
            'sem_name': 'Winter',
            'year': '1995',
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
        pass

    def test_delete_timetable(self):
        pass


class ClassmateViewTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='jacob', password='top_secret')
        self.student = Student.objects.create(user=self.user)
        self.factory = APIRequestFactory()

    def test_get_classmate_counts(self):
        pass

    def test_get_classmates(self):
        pass

    def test_no_social_courses(self):
        pass
