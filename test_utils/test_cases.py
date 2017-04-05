from django.test import SimpleTestCase
from django.core.urlresolvers import resolve


class UrlTestCase(SimpleTestCase):

    def assertUrlResolvesToView(self, url, view_name):
        self.assertEqual(resolve(url).view_name, view_name)