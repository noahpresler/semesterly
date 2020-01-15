# -*- coding: utf-8 -*-
from student.models import Student, PilotOffering
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from .forms import StudentForm
from django.db import transaction
import semesterly.views


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
		if form.is_valid():
			student_object.hopid = form.cleaned_data['hopid']
			student_object.save()
			student_object.jhed = form.cleaned_data['jhed']
			student_object.save()
			student_object.class_year = form.cleaned_data['class_year']
			student_object.save()
			student_object.major = form.cleaned_data['major']
			student_object.save()
			pre_h = form.cleaned_data['pre_health']
			pre_h = {'True': True, 'False': False, 'None': None}[pre_h]
			student_object.pre_health = pre_h
			student_object.save()
		return redirect('pilot:studentinfo', id=student_object.id)
	else:
		return render(request, 'pilot/get_info.html/')


def student_info(request, id):
	if request.method == 'POST':
		return redirect('pilot:courses', id=id)
	else:
		student = Student.objects.filter(id=id).first()
		context = {
			'student': student
		}
		return render(request, 'pilot/student_info.html/', context=context)


def courses(request, id):
	student = Student.objects.filter(id=id).first()
	if request.method == 'POST':
		course_list = request.POST.getlist('course_list')
		courses_selected = ""
		for course in course_list:
			courses_selected += str(course) + "_"
		courses_selected = courses_selected[0:-1]
		return redirect('pilot:meetings', id=id, courseList=courses_selected)
	else:
		COURSE_LIST = []
		for courseint in CourseIntegration.objects.filter(integration_id=3):
			if Course.objects.filter(id=courseint.course_id).exists():
				COURSE_LIST.append(Course.objects.get(id=courseint.course_id))
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
		sections = ""
		for course in course_list:
			section = request.POST.getlist(course)
			sections += str(section[0]) + "_"
		sections = sections[0:-1]
		return redirect('pilot:offerings', id=id, sectionList=sections)
	else:
		decoded_list = {}
		for course in course_list:
			course_decode = Course.objects.get(id=int(course))
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
	student = Student.objects.filter(id=id).first()
	section_list = sectionList.split("_")
	if request.method == 'POST':
		return redirect('pilot:semlyhome')
	else:
		vacant = []
		full= []
		message = ""
		for section in section_list:
			with transaction.atomic():
				pilot_offering = PilotOffering.objects.get(id=int(section))
				signedup = False
				for person in pilot_offering.students.all():
					if person == student:
						signedup = True
						message = 'You are already enrolled in this course'
				for person in pilot_offering.wait_students.all():
					if person == student:
						signedup = True
						message = 'You are already on the waitlist for this course'
				if not signedup:
					if pilot_offering.enrolment < pilot_offering.size:
						vacant.append(pilot_offering)
						pilot_offering.students.add(student)
						pilot_offering.enrolment = pilot_offering.students.size()
					else:
						full.append(pilot_offering)
						pilot_offering.wait_students.add(student)
						pilot_offering.waitlist = pilot_offering.wait_students.size()
				pilot_offering.save()
		context = {
			'student': student,
			'enrolled': vacant,
			'waitlisted': full,
			'sections': section_list,
			'message': message
		}
		return render(request, 'pilot/offerings.html/', context=context)