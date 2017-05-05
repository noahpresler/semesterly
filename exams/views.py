import json

from braces.views import CsrfExemptMixin
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from timetable.jhu_final_exam_scheduler import JHUFinalExamScheduler
from timetable.utils import validate_subdomain
from timetable.views import view_timetable
from student.views import get_student
from exams.models import *
from hashids import Hashids

hashids = Hashids(salt="x98as7dhg&h*askdj^has!kj?xz<!9")

@validate_subdomain
def view_final_exams(request):
    try:
        return view_timetable(request, final_exams=True)
    except Exception:
        raise Http404
        
@csrf_exempt
def final_exam_scheduler(request):
    final_exam_schedule = JHUFinalExamScheduler().make_schedule(json.loads(request.body))
    return HttpResponse(json.dumps(final_exam_schedule), content_type="application/json")

@csrf_exempt
def share_final_exam_schedule(request):
    exam_json = json.loads(request.body)
    share = FinalExamShare.objects.create(
        school=request.subdomain,
        student=get_student(request),
        exam_json=exam_json,
    )
    share.save()
    response = {'link': hashids.encrypt(share.id)}
    return HttpResponse(json.dumps(response), content_type='application/json')
    
@validate_subdomain
def view_final_exam_share(request, ref):
    import ast
    try:
        exam_json = FinalExamShare.objects.get(id=hashids.decrypt(ref)[0]).exam_json
        final_exam_schedule = JHUFinalExamScheduler().make_schedule(exam_json)    
        return view_timetable(request, final_exam_share=final_exam_schedule)
    except Exception:
        raise Http404
