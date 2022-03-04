from django.contrib import admin
from .models import NewsUpdate


@admin.register(NewsUpdate)
class NewsUpdateAdmin(admin.ModelAdmin):
    list_display = ("title", "body", "date")
