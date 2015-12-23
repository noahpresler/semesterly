from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.context_processors import csrf
from django.views.decorators.csrf import csrf_exempt

import subprocess

@csrf_exempt
def deploy(request):
	if ('server_deploy_key' not in request.POST) or request.POST['server_deploy_key'] != 'x98as7dhghaskdjhaskj':
		return HttpResponse("Please go.")
	
	r = subprocess.Popen('bash /home/django/timetable_project/deploy.sh', stderr=subprocess.STDOUT, shell=True)
	out, err = r.communicate()
	if r.returncode == 0:
		return HttpResponse("\nUofTReach server message: Deploy successful. Hit return to continue.\n")
	return HttpResponse('\nUofTReach server message: Deploy Unsuccessful! \nError code: '  + str(r.returncode) + "\nout: " + str(out) + "\nerr: " + str(err) + "\nHit return to continue.\n")
