from datetime import datetime

from pytz import timezone

from timetable.utils import FeatureFlowView
from agreement.models import Agreement
from student.utils import get_student

UTC = timezone('utc')

class AgreementLink(FeatureFlowView):
    feature_name = ''

    def show_agreement(self, request):
        student = get_student(request)
        tos_last_updated = Agreement.objects.order_by("-last_updated")[0].last_update
        if student and student.user.is_authenticated():
            if student.time_accepted_tos is None or student.time_accepted_tos < tos_last_updated:
                # Show Agreement Modal
                self.feature_name = 'SHOW_AGREEMENT_MODAL'
        else:
            # Banner is shown if user is not logged in and have not viewed the latest version.
            if "last_shown_tos" not in request.session or \
            UTC.localize(datetime.strptime(request.session["last_shown_tos"], "%Y-%m-%d"))\
            < tos_last_updated:
                request.session["last_shown_tos"] = datetime.strftime(datetime.utcnow(), "%Y-%m-%d")
                # Show Agreement Banner
                self.feature_name = 'SHOW_AGREEMENT_BANNER'
        print("****************************HHIHIHIHIHIH")
        print(self.feature_name)

    def get_feature_flow(self, request, slug):
        self.show_agreement(request)
        return {}
