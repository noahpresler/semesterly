from django.contrib import admin
from .models import NewsUpdate


@admin.register(NewsUpdate)
class NewsUpdateAdmin(admin.ModelAdmin):
    """Enables admins to create, view, and edit news updates at /admin"""

    list_display = ("title", "body", "date")
