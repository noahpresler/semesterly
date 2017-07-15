from __future__ import unicode_literals

from django.apps import AppConfig


class SearchesConfig(AppConfig):
    name = 'searches'
    searcher = None

    def ready(self):
        from searches.utils import Searcher
        if not self.searcher:
            self.searcher = Searcher()