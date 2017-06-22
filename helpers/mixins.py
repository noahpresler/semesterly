import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView

from agreement.models import Agreement
from student.utils import get_student
from student.serializers import get_user_dict
from timetable.models import Semester
from timetable.school_mappers import VALID_SCHOOLS, AM_PM_SCHOOLS, final_exams_available
from timetable.utils import get_current_semesters, get_old_semesters


class ValidateSubdomainMixin(object):

    def dispatch(self, request, *args, **kwargs):
        if request.subdomain not in VALID_SCHOOLS:
            return render(request, 'index.html')
        return super(ValidateSubdomainMixin, self).dispatch(request, *args, **kwargs)


class FeatureFlowView(ValidateSubdomainMixin, APIView):
    """
    Template that handles GET requests by rendering the homepage. Feature_name or get_feature_flow()
    can be overridden to launch a feature or action on homepage load.
    """
    feature_name = None

    def get_feature_flow(self, request, *args, **kwargs):
        """
        Return data needed for the feature flow for this HomeView.
        A name value is automatically added in .get() using the feature_name class variable.
        A semester value can also be provided, which will change the initial semester state of
        the home page.
        """
        return {}

    def get(self, request, *args, **kwargs):
        self.school = request.subdomain
        self.student = get_student(request)

        feature_flow = self.get_feature_flow(request, *args, **kwargs)

        # take semester provided by feature flow if available, otherwise the first available sem
        all_semesters = get_current_semesters(self.school)
        if 'semester' in feature_flow:
            sem = feature_flow.pop('semester')
            sem_dict = {'name': sem.name, 'year': sem.year}
            if sem_dict not in all_semesters:
                all_semesters.append(sem_dict)
            curr_sem_index = all_semesters.index(sem_dict)
        else:
            curr_sem_index = 0
            sem = Semester.objects.get(**all_semesters[curr_sem_index])

        integrations = []
        if self.student and self.student.user.is_authenticated():
            self.student.school = self.school
            self.student.save()
            for i in self.student.integrations.all():
                integrations.append(i.name)

        init_data = {
            'school': self.school,
            'currentUser': get_user_dict(self.school, self.student, sem),
            'currentSemester': curr_sem_index,
            'allSemesters': all_semesters,
            'oldSemesters': get_old_semesters(self.school),
            'uses12HrTime': self.school in AM_PM_SCHOOLS,
            'studentIntegrations': integrations,
            'examSupportedSemesters': map(all_semesters.index,
                                          final_exams_available.get(self.school, [])),
            'timeUpdatedTos': Agreement.objects.latest().last_updated.isoformat(),

            'featureFlow': dict(feature_flow, name=self.feature_name)
        }

        return render(request, 'timetable.html', {'init_data': json.dumps(init_data)})


class CsrfExemptSessionAuthentication(SessionAuthentication):

    def enforce_csrf(self, request):
        return


class CsrfExemptMixin:
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)


class RedirectToSignupMixin(LoginRequiredMixin):
    login_url = '/signup/'
    redirect_field_name = None