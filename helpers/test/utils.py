from django.contrib.auth.models import User
from student.models import Student
from rest_framework.test import force_authenticate
from django.urls import resolve


def create_user(**kwargs) -> None:
    user, _ = User.objects.get_or_create(**kwargs)
    user.save()
    return user


def create_student(user: User, **kwargs) -> None:
    student, _ = Student.objects.get_or_create(user=user, **kwargs)
    student.save()
    return student


def get_response(request, url, *args):
    request.subdomain = "uoft"
    view = resolve(url).func
    return view(request, *args)


def get_auth_response(request, user, url, *args):
    force_authenticate(request, user=user)
    request.user = user
    request.subdomain = "uoft"
    view = resolve(url).func
    return view(request, *args)
