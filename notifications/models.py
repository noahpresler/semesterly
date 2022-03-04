from django.db import models


class NewsUpdate(models.Model):
    """Represents a news update that is displayed on the home page."""

    title = models.CharField(max_length=255)
    body = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
