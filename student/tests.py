from test_utils.test_cases import UrlTestCase


class UrlsTest(UrlTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # profile management
        self.assertUrlResolvesToView('/unsubscribe/akdC@+-EI/alc:_=/', 'student.views.unsubscribe')
        self.assertUrlResolvesToView('/user/save_settings/', 'student.views.save_settings')
        self.assertUrlResolvesToView('/me/', 'timetable.views.profile')

        # timetable management
        self.assertUrlResolvesToView('/user/save_timetable/', 'student.views.save_timetable')
        self.assertUrlResolvesToView('/user/duplicate_timetable/', 'student.views.duplicate_timetable')
        self.assertUrlResolvesToView('/user/delete_timetable/', 'student.views.delete_timetable')
        self.assertUrlResolvesToView('/user/get_saved_timetables/jhu/Summer/2018',
                                     'student.views.get_student_tts_wrapper')

        # social
        self.assertUrlResolvesToView('/user/get_classmates/', 'student.views.get_classmates')
        self.assertUrlResolvesToView('/user/get_most_classmates_count/', 'student.views.get_most_classmate_count')
        self.assertUrlResolvesToView('/user/find_friends/', 'student.views.find_friends')
        self.assertUrlResolvesToView('/user/add_to_gcal/', 'student.views.add_tt_to_gcal')

        # api
        self.assertUrlResolvesToView('/user/settings/', 'student.views.UserView')
        self.assertUrlResolvesToView('/user/timetables/', 'student.views.UserTimetableView')
        self.assertUrlResolvesToView('/user/timetables/Fall/2016/', 'student.views.UserTimetableView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016'})
        self.assertUrlResolvesToView('/user/timetables/Fall/2016/mytt/', 'student.views.UserTimetableView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016', 'tt_name': 'mytt'})
        # social
        self.assertUrlResolvesToView('/user/classmates/Fall/2016?courseids=1&courseids=2',
                                     'student.views.ClassmateView',
                                     kwargs={'sem_name': 'Fall', 'year': '2016'})
        self.assertUrlResolvesToView('/user/gcal/', 'student.views.GCalView')
