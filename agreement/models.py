from __future__ import unicode_literals

from django.db import models


class Agreement(models.Model):
    """ Database object representing when terms of service is last updated. """
    last_updated = models.DateTimeField()
