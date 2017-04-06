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
