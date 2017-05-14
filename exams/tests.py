from rest_framework.test import APITestCase
from rest_framework import status

from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test exams/urls.py """

    def test_urls_call_correct_views(self):
        self.assertUrlResolvesToView('/final_exams/',
          'timetable.utils.FeatureFlowView')

        self.assertUrlResolvesToView('/exams/', 'exams.views.ExamView')
        self.assertUrlResolvesToView('/exams/links/', 'exams.views.ExamLink')
        self.assertUrlResolvesToView('/exams/links/AbC/', 'exams.views.ExamLink')


class ExamLinkTest(APITestCase):
    request_headers = {
        'HTTP_HOST': 'uoft.sem.ly:8000'
    }

    def test_create_then_get_link(self):
        # data = {}
        # response = self.client.post('/exams/links/', data, format='json', **self.request_headers)
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        # self.assertIn('slug', response.data)

        # slug = response.data['slug']

        # # assumes that the response will be a 404 if post did not actually create a shared timetable
        # response = self.client.get('/exams/links/{}/'.format(slug), **self.request_headers)
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        pass
