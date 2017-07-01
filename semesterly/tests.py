from semesterly.test_utils import SeleniumTestCase
from timetable.models import Semester, Course

class EndToEndTest(SeleniumTestCase):

    fixtures = [
        'jhu_fall_sample.json',
        'jhu_spring_sample.json'
    ]

    def test_logged_out_flow(self):
        with self.description("setup and clear tutorial"):
            self.driver.set_window_size(1440, 1080)
            self.clear_tutorial()
        with self.description("search, add, then remove course"):
            self.search_course('calc', 3)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.remove_course(0, n_slots_expected=0)
        with self.description("open course modal from search and share"):
            self.search_course('calc', 3)
            self.open_course_modal_from_search(1)
            self.validate_course_modal()
            self.follow_share_link_from_modal()
            self.close_course_modal()
        with self.description("open course modal & follow share link from slot"):
            self.search_course('calc', 3)
            self.add_course(1, n_slots=4, n_master_slots=1)
            self.follow_share_link_from_slot()
            self.open_course_modal_from_slot(0)
            self.validate_course_modal()
            self.close_course_modal()
        with self.description("Remove course from course modal"):
            self.open_course_modal_from_slot(0)
            self.remove_course_from_course_modal(0)
        with self.description("Add course from modal and share timetable"):
            self.search_course('calc', 3)
            self.open_course_modal_from_search(1)
            self.share_timetable([
                self.add_course_from_course_modal(
                    n_slots=4, n_master_slots=1
                )
            ])
        with self.description("lock course then add conflict"):
            self.remove_course(0, n_slots_expected=0)
            self.search_course('calc', 3)
            self.add_course(2, n_slots=4, n_master_slots=1)
            self.lock_course()
            self.search_course('calc', 3)
            self.execute_action_expect_alert(
                lambda: self.add_course(1, n_slots=4, n_master_slots=1, by_section="(01)"),
                alert_text_contains="Allow Conflicts"
            )
            self.allow_conflicts_add(n_slots=8)
        with self.description("switch semesters, clear alert and check search/adding"):
            self.change_term("Spring 2017", clear_alert=True)
            self.search_course('calc', 2)
            self.open_course_modal_from_search(1)
            self.share_timetable([
                self.add_course_from_course_modal(
                    n_slots=4, n_master_slots=1
                )
            ])
        with self.description("advanced search basic query executes"):
            self.change_term("Fall 2017", clear_alert=True)
            sem = Semester.objects.get(year=2017, name='Fall')
            self.open_and_query_adv_search('ca', n_results=3)
            self.select_nth_adv_search_result(0, sem)
            self.select_nth_adv_search_result(1, sem)

    def test_logged_in_via_fb_flow(self):
        with self.description("setup and clear tutorial"):
            self.driver.set_window_size(1440, 1080)
            self.clear_tutorial()
        with self.description("succesfully signup with facebook"):
            self.login_via_fb(
                email='***REMOVED***',
                password='***REMOVED***'
            )
            self.complete_user_settings_basics(
                major='Computer Science',
                class_year=2017
            )
        with self.description("search, add, change personal timetable name and save"):
            self.search_course('calc', 3)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.change_ptt_name("Testing Timetable")
            self.save_ptt()
            self.assert_ptt_const_across_refresh()
        with self.description("add to personal timetable, share, save"):
            self.search_course('calc', 3)
            self.open_course_modal_from_search(1)
            self.share_timetable([
                self.add_course_from_course_modal(
                    n_slots=8, n_master_slots=2
                )
            ])
            testing_ptt = self.save_ptt()
            self.assert_ptt_const_across_refresh()
        with self.description("create new personal timetable, validate on reload"):
            self.create_ptt("End To End Testing!")
            self.search_course('AS.110.105', 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            e2e_ptt = self.save_ptt()
            self.assert_ptt_const_across_refresh()
        with self.description("Switch to original ptt and validate"):
            self.switch_to_ptt("Testing Timetable")
            self.assert_ptt_equals(testing_ptt)
        with self.description("switch semester, create personal timetable, switch back"):
            self.change_term("Spring 2017")
            self.create_ptt("Hope ders no bugs!")
            self.click_off()
            self.search_course('calc', 2)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.save_ptt()
            self.change_term("Fall 2017")
            self.assert_ptt_equals(e2e_ptt)
        with self.description(("add friend with course,"
                               "check for friend circles"
                               "and presence in modal")):
            friend = self.create_friend(
                "Tester",
                "McTestFace",
                social_courses=True
            )
            self.create_personal_timetable_obj(
                friend,
                [Course.objects.get(code='AS.110.105')],
                Semester.objects.get(name='Fall', year=2017)
            )
            self.assert_ptt_const_across_refresh()
            self.assert_friend_image_found(friend)
            self.open_course_modal_from_slot(0)
            self.assert_friend_in_modal(friend)

    def test_logged_in_via_google_flow(self):
        with self.description("setup and clear tutorial"):
            self.driver.set_window_size(1440, 1080)
            self.clear_tutorial()
        with self.description("login via Google, complete user settings"):
            self.login_via_google(
                first_name="Tester",
                last_name="McTesterFace",
                email='e2etesterly@gmail.com',
                password='***REMOVED***'
            )
            self.complete_user_settings_basics(
                major='Computer Science',
                class_year=2017
            )
