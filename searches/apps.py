from __future__ import unicode_literals

from django.apps import AppConfig


class SearchesConfig(AppConfig):
    name = 'searches'
    searcher = None

    def ready(self):
        """ Constructs Searcher object to be used if it can be built using course.vector field """
        from searches.utils import Searcher
        if not self.searcher:
            try:
                self.searcher = Searcher()
            except Exception as e:
                self.searcher = None
                print("Unable to create Searcher object: setting searcher object to None " +
                      "and using baseline_search instead. \nError:%s" %e.message)
