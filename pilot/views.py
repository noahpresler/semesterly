# -*- coding: utf-8 -*-
from student.models import Student, PilotOffering
from timetable.models import CourseIntegration, Course, Section, Semester
from django.shortcuts import get_object_or_404, render, redirect
from student.utils import get_student
from .forms import StudentForm
from django.db import transaction
import semesterly.views


def index(request):
	if request.method == 'POST':
		return redirect('pilot:info')
	else:
		student = Student.objects.get(user=request.user)
		if student.disabilities is None:
			context = {
				'student': student
			}
			return render(request, 'pilot/welcome.html/', context=context)
		else:
			vacant = PilotOffering.objects.filter(students=student)
			full = PilotOffering.objects.filter(wait_students=student)
			section_list= list(vacant) + list(full)
			context = {
				'student': student,
				'enrolled': vacant,
				'waitlisted': full,
				'sections': section_list,
				'message': ""
			}
			return render(request, 'pilot/offerings.html/', context=context)


def info(request):
	if request.method == 'POST':
		form = StudentForm(request.POST)
		student_object = get_student(request)
		if form.is_valid():
			student_object.user.first_name = form.cleaned_data['first_name']
			student_object.user.last_name = form.cleaned_data['last_name']
			student_object.hopid = form.cleaned_data['hopid']
			student_object.jhed = form.cleaned_data['jhed']
			student_object.class_year = form.cleaned_data['class_year']
			student_object.major = form.cleaned_data['major']
			pre_h = form.cleaned_data['pre_health']
			pre_h = {'True': True, 'False': False, 'None': None}[pre_h]
			student_object.pre_health = pre_h
			diss = form.cleaned_data['diss']
			diss = {'True': True, 'False': False, 'None': None}[diss]
			student_object.disabilities = diss
			student_object.save()
		return redirect('pilot:studentinfo')
	else:
		return render(request, 'pilot/get_info.html/')


def student_info(request):
	if request.method == 'POST':
		return redirect('pilot:pilotcourses')
	else:
		student = get_student(request)
		context = {
			'student': student
		}
		return render(request, 'pilot/student_info.html/', context=context)


def pilotcourses(request):
	student = get_student(request)
	if request.method == 'POST':
		course_list = request.POST.getlist('course_list')
		courses_selected = ""
		for course in course_list:
			courses_selected += str(course) + "_"
		courses_selected = courses_selected[0:-1]
		return redirect('pilot:meetings', courseList=courses_selected)
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


def meetings(request, courseList):
	student = get_student(request)
	semester = Semester.objects.filter(name='Spring', year='2020')
	course_list = courseList.split("_")
	if request.method == 'POST':
		sections = ""
		for course in course_list:
			section = request.POST.getlist(course)
			sections += str(section[0]) + "_"
		sections = sections[0:-1]
		return redirect('pilot:offerings', sectionList=sections)
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
			'id': student.id
		}
		return render(request, 'pilot/meetings.html/', context=context)


def offerings(request, sectionList):
	student = get_student(request)
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
						pilot_offering.enrolment = len(pilot_offering.students.all())
					else:
						full.append(pilot_offering)
						pilot_offering.wait_students.add(student)
						pilot_offering.waitlist = len(pilot_offering.wait_students.all())
				pilot_offering.save()
		context = {
			'student': student,
			'enrolled': vacant,
			'waitlisted': full,
			'sections': section_list,
			'message': message
		}
		return render(request, 'pilot/offerings.html/', context=context)

