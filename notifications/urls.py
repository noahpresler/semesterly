from django.urls import path

from notifications.views import NewsUpateView


urlpatterns = [
    path(
        "notifications/news/",
        NewsUpateView.as_view(),
    ),
]
