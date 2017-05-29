from datetime import datetime, timedelta

import pytz
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status

from django.contrib.auth.models import User, AnonymousUser
from student.models import Student
from agreement.models import Agreement

class AgreementTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='jacob', password='top_secret')
        self.anon = AnonymousUser
        self.student = Student.objects.create(user=self.user)
        self.agreement_time = pytz.utc.localize(datetime.utcnow())
        self.agreement = Agreement.objects.create(last_updated=self.agreement_time)
        self.factory = APIRequestFactory()
    
    def test_agreement_modal(self):
        pass
