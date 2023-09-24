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


class EndToEndTest(SeleniumTestCase):

    fixtures = ["jhu_fall_sample.json", "jhu_spring_sample.json"]

    def test_logged_out_flow(self):
        self.clear_tutorial()
        with self.description("Search for course and then delete search query"):
            self.search_course("calc", 3)
            self.search_course("notacoursename", 0)
            self.clear_search_query()
        with self.description("Search, add, then remove course"):
            self.search_course("calc", 3)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.remove_course(0, n_slots_expected=0)
        with self.description("Search for course and test infinite scroll"):
            self.search_course("introduction", 6)
            self.search_infinite_scroll(10)  # Total of 10 courses should be displayed
            self.clear_search_query()
        with self.description("Add two short courses and then remove"):
            self.search_course("EN.580.241", 1)
            self.add_course(0, n_slots=3, n_master_slots=1, code="EN.580.241")
            self.search_course("EN.580.243", 1)
            self.add_course(0, n_slots=6, n_master_slots=2, code="EN.580.243")
            self.remove_course(0, n_slots_expected=3)
            self.remove_course(0, n_slots_expected=0)
        with self.description("Open course modal from search and share"):
            self.search_course("calc", 3)
            self.open_course_modal_from_search(1)
            self.validate_course_modal()
            self.follow_share_link_from_modal()
            self.close_course_modal()
        with self.description("Open course modal & follow share link from slot"):
            self.search_course("calc", 3)
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
            self.search_course("calc", 3)
            self.open_course_modal_from_search(1)
            self.share_timetable(
                [self.add_course_from_course_modal(n_slots=4, n_master_slots=1)]
            )
        with self.description("Add conflicting course and accept allow conflict alert"):
            self.remove_course(0, n_slots_expected=0)
            self.click_off()  # Click out of share link component
            self.search_course("AS.110.106", 1)
            self.add_course(0, n_slots=4, n_master_slots=1, by_section="(09)")
            self.search_course("AS.110.105", 1)
            self.execute_action_expect_alert(
                lambda: self.add_course(
                    0, n_slots=4, n_master_slots=1, code="AS.110.105"
                ),
                alert_text_contains="Allow Conflicts",
            )
            self.allow_conflicts_add(n_slots=8)
        with self.description("Switch semesters, clear alert and check search/adding"):
            self.change_term("Spring 2023", clear_alert=True)
            self.search_course("calc", 2)
            self.open_course_modal_from_search(1)
            self.share_timetable(
                [self.add_course_from_course_modal(n_slots=4, n_master_slots=1)]
            )
        with self.description("Advanced search basic query executes"):
            self.change_to_current_term(clear_alert=True)
            sem = Semester.objects.get(year=2022, name="Fall")
            self.open_and_query_adv_search("ca", n_results=7)
            self.select_nth_adv_search_result(1, sem)
            self.select_nth_adv_search_result(2, sem)

    def test_logged_in_via_fb_flow(self):
        with self.description("Setup and clear tutorial"):
            self.clear_tutorial()
        with self.description("Succesfully signup with facebook"):
            self.login_via_fb(email="e@ma.il", password="password")
            self.complete_user_settings_basics(
                major="Computer Science", class_year=2023
            )
        self.common_logged_in_tests()
        with self.description(
            (
                "Add friend with course,"
                "check for friend circles,"
                "and presence in modal"
            )
        ):
            friend = self.create_friend("Tester", "McTestFace", social_courses=True)
            self.create_personal_timetable_obj(
                friend, [Course.objects.get(code="AS.110.105")], self.current_sem
            )
            self.assert_ptt_const_across_refresh()
            self.assert_friend_image_found(friend)
            self.open_course_modal_from_slot(1)
            self.assert_friend_in_modal(friend)
            self.close_course_modal()
        ptt = self.ptt_to_tuple()
        with self.description("Log out"):
            self.logout()
            self.assert_login_button_found()
        with self.description("Log back in"):
            self.login_via_fb(email="e@ma.il", password="password")
            self.assert_ptt_equals(ptt)

    def test_logged_in_via_google_flow(self):
        with self.description("Setup and clear tutorial"):
            self.clear_tutorial()
        with self.description("Log in via Google and complete user settings"):
            self.login_via_google(
                email="em@ai.l",
                password="password",
            )
            self.complete_user_settings_basics(
                major="Computer Science", class_year=2023
            )
        self.common_logged_in_tests()
        ptt = self.ptt_to_tuple()
        with self.description("Log out"):
            self.logout()
            self.assert_login_button_found()
        with self.description("Log back in"):
            self.login_via_google(email="em@ai.l", password="password")
            self.assert_ptt_equals(ptt)

    def common_logged_in_tests(self):
        with self.description("Search and add courses"):
            self.search_course("AS.110.105", 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.search_course("AS.110.106", 1)
            self.add_course(0, n_slots=8, n_master_slots=2)
            self.search_course("AS.110.415", 1)
            self.add_course(0, n_slots=11, n_master_slots=3)
            self.search_course("AS.110.795", 1)
            self.add_course(0, n_slots=12, n_master_slots=4)
            self.assert_ptt_const_across_refresh()
        with self.description("Change personal timetable name"):
            self.change_ptt_name("Testing Timetable")
            self.assert_ptt_const_across_refresh()
        with self.description("Remove courses"):
            self.remove_course(3)
            self.remove_course(2)
            self.remove_course(1)
            self.remove_course(0, from_slot=True)
            self.assert_ptt_const_across_refresh()
        with self.description("Add and remove from course modal"):
            self.search_course("AS.110.105", 1)
            self.open_course_modal_from_search(0)
            course1 = self.add_course_from_course_modal(n_slots=4, n_master_slots=1)
            self.search_course("AS.110.106", 1)
            self.open_course_modal_from_search(0)
            course2 = self.add_course_from_course_modal(n_slots=8, n_master_slots=2)
            self.search_course("AS.110.415", 1)
            self.open_course_modal_from_search(0)
            self.add_course_from_course_modal(n_slots=11, n_master_slots=3)
            self.open_course_modal_from_slot(2)
            self.remove_course_from_course_modal(n_slots_expected=8)
        with self.description("Share timetable"):
            self.share_timetable([course1, course2])
            self.assert_ptt_const_across_refresh()
        testing_ptt = self.ptt_to_tuple()
        with self.description("Create new personal timetable, validate on reload"):
            self.create_ptt("End To End Testing!")
            self.search_course("AS.110.105", 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.search_course("AS.110.415", 1)
            self.add_course(0, n_slots=7, n_master_slots=2)
            e2e_ptt = self.ptt_to_tuple()
            self.assert_ptt_const_across_refresh()
        with self.description("Switch to original ptt and validate"):
            self.switch_to_ptt("Testing Timetable")
            self.assert_ptt_equals(testing_ptt)
        with self.description("Compare timetables"):
            self.compare_timetable("End To End Testing!")
            self.assert_slot_presence(11, 3)
            self.exit_compare_timetable()
        with self.description(
            "switch semester, create personal timetable, switch back"
        ):
            self.change_term("Spring 2023")
            self.create_ptt("Hope ders no bugs!", finish_saving=False)
            self.click_off()
            self.search_course("AS.110.106", 1)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.change_to_current_term()
            self.assert_ptt_equals(e2e_ptt)
        with self.description("Delete a timetable"):
            self.delete_timetable("End To End Testing!")
            self.assert_timetable_not_found("End To End Testing!")
        with self.description("Add and edit custom events"):
            self.create_custom_event(4, 16, 20, False)
            self.assert_custom_event_exists(
                name="New Custom Event", start_time="8:00", end_time="10:00"
            )
            self.assert_ptt_const_across_refresh()  # Custom events saved as slots too
            event = {
                "name": "Semly",
                "day": "M",
                "location": "Malone Hall",
                "color": "#6f00ff",
                "start_time": "14:00",
                "end_time": "17:30",
                "credits": 4.5,
            }
            self.edit_custom_event("New Custom Event", **event)
            self.assert_custom_event_exists(**event)
            self.assert_ptt_const_across_refresh()
        with self.description("Advanced search basic query executes"):
            self.change_to_current_term()
            sem = Semester.objects.get(year=2022, name="Fall")
            self.open_and_query_adv_search("ca", n_results=7)
            self.select_nth_adv_search_result(1, sem)
            self.select_nth_adv_search_result(2, sem)
            self.close_adv_search()
