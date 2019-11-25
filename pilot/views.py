from django.shortcuts import render, redirect

# Create your views here.
from django.http import HttpResponse
from student.utils import get_student
from timetable.models import Semester, Course, Section
from student.models import Student
from forms import StudentForm


def index(request):
	if request.method == 'POST':
		return redirect('pilot:info')
	else:
		student = get_student(request)
		context = {
			'student': student
		}
		return render(request, 'pilot/welcome.html/', context=context)

def info(request):
	if request.method == 'POST':
		form = StudentForm(request.POST)
		user = request.user
		student_object, created = Student.objects.get_or_create(user=user)
		student_object.hopid = form.cleaned_data['hopid']
		jhed = form.cleaned_data['jhed']
		student_object.jhed = jhed
		user.email = str(jhed) + '@jhu.edu'
		user.save()
		student_object.grad_year = form.cleaned_data['grad_year']
		student_object.major = form.cleaned_data['major']
		student_object.pre_health = form.cleaned_data['pre_health']
		student_object.save()
		return redirect('pilot:info')
	else:
		return render(request, 'pilot/student_info.html/')