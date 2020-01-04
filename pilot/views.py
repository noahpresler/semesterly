# -*- coding: utf-8 -*-
from student.models import Student
from timetable.models import CourseIntegration, Course
from django.shortcuts import get_object_or_404, render, redirect
from .forms import StudentForm


def index(request, id):
	if request.method == 'POST':
		return redirect('pilot:info', id=id)
	else:
		student,created = Student.objects.get_or_create(id=id)
		context = {
			'student': student
		}
		return render(request, 'pilot/welcome.html/', context=context)


def info(request, id):
	if request.method == 'POST':
		form = StudentForm(request.POST)
		student_object, created = Student.objects.get_or_create(id=id)
		print form.errors
		if form.is_valid():
			student_object.hopid = form.cleaned_data['hopid']
			student_object.jhed = form.cleaned_data['jhed']
			student_object.class_year = form.cleaned_data['class_year']
			student_object.major = form.cleaned_data['major']
			student_object.pre_health = form.cleaned_data['pre_health']
			student_object.save()
		return redirect('pilot:studentinfo', id=student_object.id)
	else:
		return render(request, 'pilot/get_info.html/')


def student_info(request, id):
	if request.method == 'POST':
		return redirect('pilot:courses', id=id)
	else:
		student, created = Student.objects.get_or_create(id=id)
		context = {
			'student': student
		}
		return render(request, 'pilot/student_info.html/', context=context)


def courses(request, id):
	student = Student.objects.filter(id=id).first()
	if request.method == 'POST':
		return redirect('pilot:home', id=student.id)
	else:
		COURSE_LIST = []
		for course in Course.objects.all():
			if CourseIntegration.objects.filter(course_id=course.id, integration_id=3).exists():
				COURSE_LIST.append(course)
		context = {
			'courses': COURSE_LIST,
			'student': student
		}
		return render(request, 'pilot/courses.html', context=context)