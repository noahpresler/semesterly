from django.test import SimpleTestCase
from django.core.urlresolvers import resolve


class UrlTestCase(SimpleTestCase):

    def assertUrlResolvesToView(self, url, view_name, kwargs=None):
        resolved = resolve(url)
        self.assertEqual(resolved.view_name, view_name)
        if kwargs is not None:
            self.assertDictEqual(resolved.kwargs, kwargs)