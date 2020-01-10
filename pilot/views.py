# -*- coding: utf-8 -*-
from student.models import Student, PilotOffering
from timetable.models import CourseIntegration, Course, Section, Semester
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
		print("COURSES: POST")
		course_list = request.POST.getlist('course_list')
		courses_selected = ""
		for course in course_list:
			courses_selected += str(course) + "_"
		courses_selected = courses_selected[0:-1]
		print(courses_selected)

		return redirect('pilot:meetings', id=id, courseList=courses_selected)
	else:
		print("COURSES: GET")
		COURSE_LIST = []
		for course in Course.objects.all():
			if CourseIntegration.objects.filter(course_id=course.id, integration_id=3).exists():
				COURSE_LIST.append(course)
		context = {
			'courses': COURSE_LIST,
			'student': student
		}
		return render(request, 'pilot/courses.html/', context=context)


def meetings(request, id, courseList):
	student = Student.objects.filter(id=id).first()
	semester = Semester.objects.filter(name='Spring', year='2020')
	course_list = courseList.split("_")
	if request.method == 'POST':
		print("MEETINGS: POST")
		sections = ""
		for course in course_list:
			section = request.POST.getlist(course)
			sections += str(section[0]) + "_"
		sections = sections[0:-1]
		return redirect('pilot:offerings', id=id, sectionList=sections)
	else:
		print("MEETINGS: GET")
		decoded_list = {}
		print(course_list)
		for course in course_list:
			course_decode = Course.objects.get(id=int(course))
			print(course_decode)
			sections = list(Section.objects.filter(course=course_decode, semester=semester))
			sections_offerings = {}
			for section in sections:
				offerings = list(PilotOffering.objects.filter(sections=section))
				sections_offerings[section] = offerings
			decoded_list[course_decode] = sections_offerings
		context = {
			'courses': decoded_list,
			'courseList': courseList,
			'student': student,
			'id': id
		}
		return render(request, 'pilot/meetings.html/', context=context)


def offerings(request, id, sectionList):
	return redirect('pilot:home', id=id)