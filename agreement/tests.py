from django.test import TestCase


class UrlsTest(TestCase):

    def test_urls_call_correct_templates(self):
        self.assertTemplateUsed(self.client.get('/termsofservice'), 'termsofservice.html')
        self.assertTemplateUsed(self.client.get('/privacypolicy'), 'privacypolicy.html')