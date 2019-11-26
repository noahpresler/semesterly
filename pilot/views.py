from django.shortcuts import render, redirect

# Create your views here.
from django.http import HttpResponse
from student.utils import get_student
from django.shortcuts import get_object_or_404
from timetable.models import Semester, Course, Section
from student.models import Student
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
		if form.is_valid():
			student_object, created = Student.objects.get_or_create(id=id)
			student_object.hopid = form.cleaned_data['hopid']
			student_object.jhed = form.cleaned_data['jhed']
			student_object.class_year = form.cleaned_data['class_year']
			student_object.major = form.cleaned_data['major']
			student_object.pre_health = form.cleaned_data['pre_health']
			student_object.save()
		return redirect('pilot:studentinfo', id=id)
	else:
		return render(request, 'pilot/get_info.html/')

def studentinfo(request, id):
	student = Student.objects.get_or_create(id=id)
	# if this is a POST request we need to process the form data
	if request.method == 'POST':
		return redirect('one:detail', id=student.id)
	# if a GET (or any other method) we'll create a blank form
	else:
		context = {
			'title': 'Your Information | PILOT Registration',
			'student': student
		}
	return render(request, 'pilot/student_info.html/')