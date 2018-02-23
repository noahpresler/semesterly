# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from __future__ import absolute_import, division, print_function

import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView

from agreement.models import Agreement
from student.utils import get_student
from student.serializers import get_student_dict
from timetable.models import Semester
from timetable.school_mappers import SCHOOLS_MAP
from parsing.schools.active import ACTIVE_SCHOOLS
from timetable.utils import get_current_semesters


class ValidateSubdomainMixin(object):
    """
    Mixin which validates subdomain, redirecting user to index if the school
    is not in :obj:`ACTIVE_SCHOOLS`.
    """

    def dispatch(self, request, *args, **kwargs):
        if request.subdomain not in ACTIVE_SCHOOLS:
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

        final_exams = []
        if SCHOOLS_MAP[self.school].final_exams is None:
            final_exams = []
        else:
            for year, terms in SCHOOLS_MAP[self.school].final_exams.items():
                for term in terms:
                    final_exams.append({
                        'name': term,
                        'year': str(year)
                    })

        init_data = {
            'school': self.school,
            'currentUser': get_student_dict(self.school, self.student, sem),
            'currentSemester': curr_sem_index,
            'allSemesters': all_semesters,
            # 'oldSemesters': get_old_semesters(self.school),
            'uses12HrTime': SCHOOLS_MAP[self.school].ampm,
            'studentIntegrations': integrations,
            'examSupportedSemesters': map(all_semesters.index,
                                          final_exams),
            'timeUpdatedTos': Agreement.objects.latest().last_updated.isoformat(),
            'registrar': SCHOOLS_MAP[self.school].registrar,

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