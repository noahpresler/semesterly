from django.shortcuts import render, redirect

# Create your views here.
from django.http import HttpResponse
from student.utils import get_student


def index(request):
	if request.method == 'POST':
		context = {
			'title': 'Welcome | PILOT Registration'
		}
		return redirect('pilot:home', context=context)
	else:
		student = get_student(request)
		context = {
			'student': student
		}
		return render(request, 'pilot/welcome.html/', context=context)
