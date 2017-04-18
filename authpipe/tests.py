import json

from django.test.testcases import TestCase
from rest_framework import status

from test_utils.test_cases import UrlTestCase
from student.models import RegistrationToken


class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # auth
        self.assertUrlResolvesToView('/login/facebook/', 'social:begin', kwargs={'backend': 'facebook'})
        self.assertUrlResolvesToView('/complete/facebook/', 'social:complete', kwargs={'backend': 'facebook'})

        # registration
        self.assertUrlResolvesToView('/setRegistrationToken/', 'authpipe.views.set_registration_token')
        self.assertUrlResolvesToView('/deleteRegistrationToken/', 'authpipe.views.delete_registration_token')

        self.assertUrlResolvesToView('/registration-token/', 'authpipe.views.RegistrationTokenView')
        self.assertUrlResolvesToView('/registration-token/google/', 'authpipe.views.RegistrationTokenView',
                                     kwargs={'endpoint': 'google'})


class TestToken(TestCase):
    """ Test setting and deleting tokens """
    school = 'uoft'
    request_headers = {
        'HTTP_HOST': '{}.sem.ly:8000'.format(school)
    }

    def test_create_token(self):
        """ Test creating a new token. """
        my_token = json.dumps({
            'auth': 'someauth',
            'p256dh': 'something',
            'endpoint': 'some endpoint'
        })

        response = self.client.put('/registration-token/', data=my_token, content_type='application/json',
                                   **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertDictContainsSubset(json.loads(my_token), json.loads(response.content))
        self.assertIsNotNone(RegistrationToken.objects.get(endpoint='some endpoint'))

    def test_create_token_student(self):
        """ Test creating a new token when logged in. """
        pass

    def test_set_token(self):
        """ Test updating an existing token. """
        pass

    def test_delete_token_exists(self):
        """ Test deleting an existing token. """
        token = RegistrationToken.objects.create(auth='a', p256dh='p', endpoint='e')
        response = self.client.delete('/registration-token/{}/'.format(token.endpoint), **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RegistrationToken.objects.filter(endpoint=token.endpoint).exists())

    def test_delete_token_not_exists(self):
        """ Test deleting a non existent token. """
        response = self.client.delete('/registration-token/bla/', **self.request_headers)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)