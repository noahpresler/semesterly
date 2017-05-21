from timetable.utils import FeatureFlowView

class AgreementLink(FeatureFlowView):
    feature_name = ''

    def get_feature_flow(self, request, slug):
        return {}
