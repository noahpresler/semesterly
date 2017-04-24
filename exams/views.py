import json

from django.http import Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from timetable.jhu_final_exam_scheduler import JHUFinalExamScheduler
from timetable.utils import validate_subdomain
from timetable.views import view_timetable


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
        exam_json=exam_json,
    )
    share.save()
    response = {'link': hashids.encrypt(shared_timetable.id)}
    return HttpResponse(json.dumps(response), content_type='application/json')
    
@validate_subdomain
def view_final_exam_share(request, ref):
    try:
        exam_json = FinalExamShare.objects.get(id=hashids.decrypt(ref)[0]).exam_json
        final_exam_schedule = JHUFinalExamScheduler().make_schedule(json.loads(exam_json))    
        return view_timetable(request, final_exam_share=final_exam_schedule)
    except Exception:
        raise Http404
