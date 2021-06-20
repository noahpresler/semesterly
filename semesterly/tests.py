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
import unittest

from semesterly.test_utils import SeleniumTestCase
from timetable.models import Semester, Course
from .settings import get_secret



class EndToEndTest(SeleniumTestCase):

    fixtures = [
        'jhu_fall_sample.json',
        'jhu_spring_sample.json'
    ]

    def test_logged_out_flow(self):
        self.driver.set_window_size(1440, 1080)
        self.clear_tutorial()
        with self.description("search, add, then remove course"):
            self.search_course('calc', 3)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.remove_course(0, n_slots_expected=0)
        with self.description("Add two short courses and then remove"):
            self.search_course('EN.580.241', 1)
            self.add_course(0, n_slots=3, n_master_slots=1, code="EN.580.241")
            self.search_course('EN.580.243', 1)
            self.add_course(0, n_slots=6, n_master_slots=2, code="EN.580.243")
            self.remove_course(0, n_slots_expected=3)
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
        with self.description("Lock course and ensure pagination becomes invisible"):
            self.lock_course()
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
        with self.description("add conflicting course and accept allow conflict alert"):
            self.remove_course(0, n_slots_expected=0)
            self.click_off() # click out of share link component
            self.search_course('AS.110.106', 1)
            self.add_course(0, n_slots=4, n_master_slots=1, by_section="(09)")
            self.search_course('AS.110.105', 1)
            self.execute_action_expect_alert(
                lambda: self.add_course(0, n_slots=4, n_master_slots=1, code="AS.110.105"),
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
            self.change_to_current_term(clear_alert=True)
            sem = Semester.objects.get(year=2017, name='Fall')
            self.open_and_query_adv_search('ca', n_results=4)
            self.select_nth_adv_search_result(1, sem)
            self.select_nth_adv_search_result(2, sem)

    @unittest.skip('TODO: fix on mac')
    def test_logged_in_via_fb_flow(self):
        self.driver.set_window_size(1440, 1080)
        self.clear_tutorial()
        with self.description("succesfully signup with facebook"):
            self.login_via_fb(
                email=get_secret("FB_TEST_EMAIL"),
                password=get_secret("FB_TEST_PASS")
            )
            self.complete_user_settings_basics(
                major='Computer Science',
                class_year=2017
            )
        with self.description("search, add, change personal timetable name and save"):
            self.search_course('AS.110.105', 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.change_ptt_name("Testing Timetable")
            self.save_ptt()
            self.assert_ptt_const_across_refresh()
        with self.description("add to personal timetable, share, save"):
            self.search_course('AS.110.106', 1)
            self.open_course_modal_from_search(0)
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
            self.search_course('AS.110.106', 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.save_ptt()
            self.change_to_current_term()
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
                self.current_sem
            )
            self.assert_ptt_const_across_refresh()
            self.assert_friend_image_found(friend)
            self.open_course_modal_from_slot(0)
            self.assert_friend_in_modal(friend)

    @unittest.skip('TODO: fix on mac')
    def test_logged_in_via_google_flow(self):
        with self.description("setup and clear tutorial"):
            self.driver.set_window_size(1440, 1080)
            self.clear_tutorial()
        with self.description("login via Google, complete user settings"):
            self.login_via_google(
                first_name="Tester",
                last_name="McTesterFace",
                email='e2etesterly@gmail.com',
                password='tester.ly'
            )
            self.complete_user_settings_basics(
                major='Computer Science',
                class_year=2017
            )
