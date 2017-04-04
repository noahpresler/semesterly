from django.test import SimpleTestCase
from django.core.urlresolvers import resolve


class UrlTestCase(SimpleTestCase):
    """ Test student/urls.py """

    def test_urls_call_correct_views(self):
        # registration
        self.assertEqual('student.views.set_registration_token', resolve('/setRegistrationToken/').view_name)
        self.assertEqual('student.views.delete_registration_token', resolve('/deleteRegistrationToken/').view_name)

        # profile management
        self.assertEqual('student.views.unsubscribe', resolve('/unsubscribe/akdC@+-EI/alc:_=/').view_name)
        self.assertEqual('student.views.save_settings', resolve('/user/save_settings/').view_name)
        self.assertEqual('timetable.views.profile', resolve('/me/').view_name)

        # timetable management
        self.assertEqual('student.views.save_timetable', resolve('/user/save_timetable/').view_name)
        self.assertEqual('student.views.duplicate_timetable', resolve('/user/duplicate_timetable/').view_name)
        self.assertEqual('student.views.delete_timetable', resolve('/user/delete_timetable/').view_name)
        self.assertEqual('student.views.get_student_tts_wrapper', resolve('/user/get_saved_timetables/jhu/Summer/2018').view_name)

        # social
        self.assertEqual('student.views.get_classmates', resolve('/user/get_classmates/').view_name)
        self.assertEqual('student.views.get_most_classmate_count', resolve('/user/get_most_classmates_count/').view_name)
        self.assertEqual('student.views.find_friends', resolve('/user/find_friends/').view_name)
        self.assertEqual('student.views.add_tt_to_gcal', resolve('/user/add_to_gcal/').view_name)

