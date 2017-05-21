from datetime import datetime

from pytz import timezone

from student.utils import get_student
from agreement.models import Agreement

UTC = timezone('utc')

def show_agreement(request):
    student = get_student(request)
    tos_last_updated = Agreement.objects.order_by("-last_updated")[0].last_updated
    if student and student.user.is_authenticated():
        if student.time_accepted_tos is None or student.time_accepted_tos < tos_last_updated:
            return 'SHOW_AGREEMENT_MODAL'
    else:
        # Banner is shown if user is not logged in and have not viewed the latest version.
        if "last_shown_agreement" not in request.session or \
        UTC.localize(datetime.strptime(request.session["last_shown_agreement"],\
        "%Y-%m-%d %H:%M:%S")) < tos_last_updated.astimezone(UTC):
            request.session["last_shown_agreement"] = \
            datetime.strftime(datetime.utcnow(), "%Y-%m-%d %H:%M:%S")
            return 'SHOW_AGREEMENT_BANNER'
    return None
