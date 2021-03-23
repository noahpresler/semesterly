# -*- coding: utf-8 -*-
from student.models import Student
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from django.db import transaction

import semesterly.views

# Create your views here.

def index(request):
	return render(request, 'advising.html')

def ind(request):
	if request.method == 'POST':
		return redirect('advising')
	else:
		student = Student.objects.get(user=request.user)
		context = {
			'student': student,
			'enrolled': vacant,
			'waitlisted': full,
			'sections': section_list,
			'message': ""
		}
		return render(request, 'advising.html', context=context)