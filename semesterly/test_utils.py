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

import datetime
import inspect
import itertools
import os
import re
import shutil
import socket
from contextlib import contextmanager
from importlib import import_module

from django.contrib.auth import BACKEND_SESSION_KEY
from django.contrib.auth import HASH_SESSION_KEY
from django.contrib.auth import SESSION_KEY
from django.contrib.auth.models import User
from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from social_django.models import UserSocialAuth

from student.models import PersonalTimetable
from student.models import Student
from timetable.models import Course
from timetable.models import Offering
from timetable.models import Section
from timetable.models import Semester
from timetable.utils import get_current_semesters


class SeleniumTestCase(StaticLiveServerTestCase):
    """
    This test case extends the Django StaticLiveServerTestCase.
    It creates a selenium ChromeDriver instance on setUp of each
    test. It navigates to the live url for the static live server.
    It also provides utilities and assertions for navigating and
    testing presence of elements or behavior.

    Attributes:
        img_dir (str): Directory to save screenshots on failure.

        driver (WebDriver): Chrome WebDriver instance.

        timeout (int): Socket default timeout.

    """

    serialized_rollback = True

    def __init__(self, *args, **kwargs):
        super(SeleniumTestCase, self).__init__(*args, **kwargs)
        if settings.DEBUG == False:
            settings.DEBUG = True

    @classmethod
    def setUpClass(cls):
        super(SeleniumTestCase, cls).setUpClass()
        cls.TIMEOUT = 10
        cls.chrome_options = webdriver.ChromeOptions()
        cls.chrome_options.add_experimental_option(
            "prefs",
            {"profile.default_content_setting_values.notifications" : 2}
        )
        cls.chrome_options.add_argument("--no-sandbox") # Allow running chrome as root in Docker
        cls.chrome_options.add_argument("--headless")  # Do not require a display
        cls.chrome_options.add_argument("--disable-dev-shm-usage") # for docker

    def setUp(self):
        self.img_dir = os.path.dirname(os.path.realpath(__file__)) + '/test_failures'
        self.init_screenshot_dir()
        self.driver = webdriver.Chrome(chrome_options=self.chrome_options)
        sem = get_current_semesters('jhu')[0]
        sem, _ = Semester.objects.update_or_create(name=sem['name'], year=sem['year'])
        for section in Section.objects.filter(semester__name="Fall", semester__year=2017):
            section.semester = sem
            section.save()
        self.current_sem = sem
        self.driver.get(self.get_test_url('jhu'))
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(lambda driver: driver.find_element_by_tag_name('body'))

    def tearDown(self):
        self.driver.quit()

    def init_screenshot_dir(self):
        """Initializes directory to which we store test failure screenshots"""
        if os.path.exists(self.img_dir):
            shutil.rmtree(self.img_dir)
        os.makedirs(self.img_dir)

    @contextmanager
    def description(self, descr):
        """A context manager which wraps a group of code and adds details to any exceptions thrown
        by the enclosed lines. Upon such an exception, the context manager will also take a screenshot
        of the current state of self.driver, writing a PNG to self.img_dir, labeled by the provided
        description and a timetstamp.
        """
        socket.setdefaulttimeout(10 * self.TIMEOUT)
        try:
            yield
        except Exception as exc:
            filename = self.img_dir + "/%s%s.png" % (descr, datetime.datetime.now())
            msg = "\n"  + '=' * 70 +"\n"
            msg += "FAILED TEST CASE: '%s'\n" % descr
            msg += "SCREENSHOT MAY BE FOUND IN: %s\n" % self.img_dir
            msg += "" + '-' * 70 + "\n"
            self.driver.save_screenshot(filename)
            trace = ['\n\nFull Traceback (most recent call last):']
            for item in inspect.trace():
                trace.append(' File "{1}", line {2}, in {3}'.format(*item))
                for line in item[4]:
                    trace.append(' ' + line.strip())
            raise type(exc)(str(exc) + '\n'.join(trace) + msg)

    def get_test_url(self, school, path=''):
        """Get's the live server testing url for a given school.

        Args:
            school (str): the string for which to create the test url
            path (str): the appended path to file or page with trailing /

        Returns:
            the testing url
        """
        url = '%s%s' % (self.live_server_url, '/')
        url = url.replace('http://', 'http://%s.' % school)
        return url.replace('localhost', 'sem.ly') + path

    def find(self, locator, get_all=False, root=None, clickable=False, hidden=False):
        """Locates element in the DOM and returns it when found.

        Args:
            locator: A tuple of (By.*, 'indentifier')
            get_all (bool, optional): If true, will return list of matching elements
            root (bool, optional): The root element to search from, root of DOM if None
            clickable (bool, optional): If true, waits for clickability of element
            hidden (bool, optional): If true, will allow for hidden elements

        Returns:
           The WebElement object returned by self.driver (Selenium)
        """
        if get_all and clickable:
            raise RuntimeError("Cannot use both get_all and clickable")
        elif get_all:
            condition = EC.presence_of_all_elements_located(locator)
        elif clickable:
            condition = EC.element_to_be_clickable(locator)
        elif hidden:
            condition = EC.presence_of_element_located(locator)
        else:
            condition = EC.visibility_of_element_located(locator)
        try:
            return WebDriverWait(root if root else self.driver, self.TIMEOUT).until(condition)
        except TimeoutException:
            raise RuntimeError('Failed to locate visible element "%s" by %s' % locator[::-1])

    def assert_invisibility(self, locator, root=None):
        """Asserts the invisibility of the provided element

        Args:
            locator: A tuple of (By.*, 'indentifier')
            root (bool, optional): The root element to search from, root of DOM if None
        """
        try:
            WebDriverWait(root if root else self.driver, self.TIMEOUT).until(
                EC.invisibility_of_element_located(locator)
            )
        except TimeoutException:
            raise RuntimeError(
                'Failed to assert invisibility of element "%s" by %s' % locator[::-1])

    def clear_tutorial(self):
        """Clears the tutorial modal for first time users"""
        for _ in range(4):
            arrow = self.find(
                (By.XPATH,
                 ('//div[@class="tut-modal__nav"]'
                  '/i[@class="action fa fa-chevron-right"] |'
                  '//div[@class="tut-modal__nav"]/h4')
                ), clickable=True)
            arrow.click()
        self.assert_invisibility((By.XPATH, '//div[@class="tut-modal__nav"]'))

    def enter_search_query(self, query):
        """Enters the provided query into the search box"""
        search_box = self.find(
            (By.XPATH,
             '//div[@class="search-bar__input-wrapper"]/input')
        )
        search_box.clear()
        search_box.send_keys(query)
        self.assert_invisibility((By.CLASS_NAME, 'results-loading-gif'))

    def assert_loader_completes(self):
        """Asserts that the semester.ly page loader has completed"""
        self.assert_invisibility((By.CLASS_NAME, 'la-ball-clip-rotate-multiple'))

    def assert_slot_presence(self, n_slots, n_master_slots):
        """Assert n_slots and n_master_slots are on the page"""
        slots = self.find((By.CLASS_NAME, 'slot'), get_all=True)
        self.assertEqual(len(slots), n_slots)
        master_slots = self.find((By.CLASS_NAME, 'master-slot'), get_all=True)
        self.assertEqual(len(master_slots), n_master_slots)

    def search_course(self, query, n_results):
        """Searches a course and asserts n_results elements are found"""
        self.enter_search_query(query)
        search_results = self.find((By.CLASS_NAME, 'search-results'))
        self.assert_n_elements_found(
            (By.CLASS_NAME, 'search-course'),
            n_results
        )

    def add_course(self, course_idx, n_slots, n_master_slots, by_section='', code=None):
        """Adds a course via search results and asserts the corresponding number of slots are found

        Args:
            course_idx (int): index into the search results corresponding the to course to add
            n_slots (int): the number of slots expected after add
            n_master_slots (int): the number of master slots expected after add
            by_section (str, optional): if provided adds the specific section of the course
            code (str, optional): the course code to add, validates presence if provided
        """
        # Focus the search box
        search_box = self.find(
            (By.XPATH, '//div[@class="search-bar__input-wrapper"]/input')
        )
        search_box.send_keys("")
        search_results = self.find((By.CLASS_NAME, 'search-results'))
        if code:
            chosen_course = WebDriverWait(self.driver, self.TIMEOUT) \
                    .until(text_to_be_present_in_nth_element(
                            (By.CLASS_NAME, 'search-course'),
                            code,
                            course_idx)
                        )
        else:
            chosen_course = search_results.find_elements_by_class_name('search-course')[course_idx]
        if not by_section:
            add_button = self.find(
                (By.CLASS_NAME, 'search-course-add'),
                root=chosen_course,
                clickable=True
            )
            add_button.click()
        else:
            ActionChains(self.driver).move_to_element(chosen_course).perform()
            # ensure that the side bar is visible
            self.find((By.CLASS_NAME, 'search-bar__side'))
            section = self.find((
                By.XPATH,
                "//h5[contains(@class,'sb-side-sections') and " + \
                "contains(text(),'%s')]" % by_section
            ), clickable=True)
            ActionChains(self.driver).move_to_element(chosen_course)\
                 .move_to_element(section) \
                .click().perform()
        self.assert_loader_completes()
        self.assert_slot_presence(n_slots, n_master_slots)
        self.click_off()

    def assert_n_elements_found(self, locator, n_elements, root=None):
        """Asserts that n_elements are found by the provided locator"""
        if n_elements == 0:
            self.assert_invisibility(locator)
        else:
            WebDriverWait(self.driver, self.TIMEOUT) \
                .until(n_elements_to_be_found(locator, n_elements))

    def remove_course(self, course_idx, from_slot=False, n_slots_expected=None):
        """Removes a course from the user's timetable, asserts master slot is removed.

        Args:
            course_idx (int): the index of the course for which to remove
            from_slot (bool, optional): if provided, removes via slot rather than via a master_slot
            n_slots_expected (int, optional): if provided, asserts n slots found after removal
        """
        n_master_slots_before = len(self.find((By.CLASS_NAME, 'master-slot'), get_all=True))
        if from_slot:
            if n_master_slots_before > 0:
                raise RuntimeError('Cannot remove via slot button unless n_courses = 1')
            slot = self.find((By.CLASS_NAME, 'slot'), get_all=True)[0]
            del_button = self.find((By.CLASS_NAME, 'fa-times'), root=slot, clickable=True)
        else:
            master_slot = self.find((By.CLASS_NAME, 'master-slot'), get_all=True)[course_idx]
            del_button = self.find((By.CLASS_NAME, 'fa-times'), root=master_slot, clickable=True)
        del_button.click()
        self.assert_loader_completes()
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before - 1)
        if n_slots_expected:
            self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots_expected)

    def open_course_modal_from_search(self, course_idx):
        """Opens course modal from search by search result index"""
        search_results = self.find((By.CLASS_NAME, 'search-results'))
        chosen_course = search_results.find_elements_by_class_name('search-course')[course_idx]
        chosen_course.click()

    def validate_course_modal(self):
        """Validates the course modal displays proper course data"""
        url_match = WebDriverWait(self.driver, self.TIMEOUT) \
            .until(url_matches_regex(r'\/course\/(.*)\/(.*)\/(20..)'))
        code = url_match.group(1)
        semester = Semester.objects.get(
            name=url_match.group(2),
            year=url_match.group(3)
        )
        course = Course.objects.get(code=code)
        modal = self.find((By.CLASS_NAME, 'course-modal'))
        self.validate_course_modal_body(course, modal, semester)

    def validate_course_modal_body(self, course, modal, semester):
        """Validates the course modal body displays credits, name, code, etc."""
        modal_body = self.find((By.CLASS_NAME, 'modal-body'), root=modal)
        modal_header = self.find((By.CLASS_NAME, 'modal-header'), root=modal)
        credit_count = self.find((By.CLASS_NAME, 'credits'), root=modal_body)
        self.assertTrue(str(int(course.num_credits)) in credit_count.text  \
            or str(course.num_credits) in credit_count.text)
        self.assertTrue(course.name in modal_header.text)
        self.assertTrue(course.code in modal_header.text)
        self.assertTrue(course.prerequisites in modal_body.text)
        # self.assertTrue(course.areas in modal_body.text)
        # n_sections = Section.objects.filter(
        #     course=course,
        #     semester=semester
        # ).count()
        # WebDriverWait(self.driver, self.TIMEOUT) \
        #         .until(n_elements_to_be_found((By.CLASS_NAME, 'modal-section'), n_sections))

    def open_course_modal_from_slot(self, course_idx):
        """Opens the course modal from the nth slot"""
        slot = self.find((By.CLASS_NAME, 'slot'), clickable=True)
        slot.click()

    def close_course_modal(self):
        """Closes the course modal using the (x) button"""
        modal = self.find((By.CLASS_NAME, 'course-modal'))
        modal_header = self.find((By.CLASS_NAME, 'modal-header'), root=modal)
        self.find((By.CLASS_NAME, 'fa-times'), root=modal_header, clickable=True).click()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))

    def follow_and_validate_url(self, url, validate):
        """Opens a new window, switches to it, gets the url and validates it
        using the provided validating function.

        Args:
            url (str): the url to follow and validate
            validate (func): the function which validates the new page
        """
        # Some versions of chrome don't like if url does not start with http
        if not str(url).startswith("http"):
            url = '%s%s' % ('http://', url)
        self.driver.execute_script("window.open()")
        self.driver.switch_to_window(self.driver.window_handles[1])
        self.driver.get(url)
        validate()
        self.driver.close()
        self.driver.switch_to_window(self.driver.window_handles[0])

    def follow_share_link_from_modal(self):
        modal = self.find((By.CLASS_NAME, 'course-modal'))
        modal_header = self.find((By.CLASS_NAME, 'modal-header'), root=modal)
        self.find((By.CLASS_NAME, 'fa-share-alt'), root=modal_header).click()
        url = self.find((By.CLASS_NAME, 'share-course-link'), root=modal_header) \
            .get_attribute('value')
        self.follow_and_validate_url(url, self.validate_course_modal)

    def follow_share_link_from_slot(self):
        """Click the share link on the slot and follow it then validate the course modal"""
        master_slot = self.find((By.CLASS_NAME, 'master-slot'), clickable=True)
        share = self.find((By.CLASS_NAME, 'fa-share-alt'), root=master_slot, clickable=True)
        share.click()
        url = self.find((By.CLASS_NAME, 'share-course-link'), root=master_slot) \
            .get_attribute('value')
        self.follow_and_validate_url(url, self.validate_course_modal)

    def remove_course_from_course_modal(self, n_slots_expected=None):
        """Removes course via the action within the course's course modal.
        Requires that the course modal be open.
        """
        n_master_slots_before = len(self.find((By.CLASS_NAME, 'master-slot'), get_all=True))
        modal = self.find((By.CLASS_NAME, 'course-modal'))
        modal_header = self.find((By.CLASS_NAME, 'modal-header'), root=modal)
        remove = self.find((By.CLASS_NAME, 'fa-check'), root=modal_header, clickable=True)
        remove.click()
        self.assert_loader_completes()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before - 1)
        if n_slots_expected:
            self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots_expected)

    def add_course_from_course_modal(self, n_slots, n_master_slots):
        """Adds a course via the course modal action.
        Requires that the course modal be open.
        """
        modal = self.find((By.CLASS_NAME, 'course-modal'))
        modal_header = self.find((By.CLASS_NAME, 'modal-header'), root=modal)
        url_match = WebDriverWait(self.driver, self.TIMEOUT) \
            .until(url_matches_regex(r'\/course\/(.*)\/(.*)\/(20..)'))
        course = Course.objects.get(code=url_match.group(1))
        self.find((By.CLASS_NAME, 'fa-plus'), root=modal_header).click()
        self.assert_loader_completes()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))
        self.assert_slot_presence(n_slots, n_master_slots)
        return course

    def validate_timeable(self, courses):
        """Validate timetable by checking that for each course provided, a slot exists
        with that course's name and course code."""
        slots = self.find((By.CLASS_NAME, 'slot'), get_all=True)
        for course in courses:
            any([course.name in slot.text and course.code in slot.text for slot in slots])

    def share_timetable(self, courses):
        """Clicks the share button via the top bar and validates it.
        Validation is done by following the url and checking the timetable using
        the validate_timetable function
        """
        top_bar_actions = self.find((By.CLASS_NAME, 'fc-right'))
        self.find(
            (By.CLASS_NAME, 'fa-share-alt'),
            clickable=True,
            root=top_bar_actions
        ).click()
        url = self.find(
            (By.CLASS_NAME, 'share-course-link'),
            root=top_bar_actions
        ).get_attribute('value')
        self.follow_and_validate_url(url, lambda: self.validate_timeable(courses))

    def click_off(self):
        """Clears the focus of the driver"""
        self.find((By.CLASS_NAME, 'semesterly-name'), clickable=True).click()

    def lock_course(self):
        """Locks the first course on the timetable"""
        self.click_off()
        slot = self.find((By.CLASS_NAME, 'slot'), clickable=True)
        ActionChains(self.driver).move_to_element(slot).perform()
        lock = self.find((By.CLASS_NAME, 'fa-unlock'), root=slot, clickable=True)
        ActionChains(self.driver).move_to_element(slot).move_to_element(lock).click().perform()
        for slot in self.find((By.CLASS_NAME, 'slot'), get_all=True):
            self.find((By.CLASS_NAME, 'fa-lock'), clickable=True)
        self.assert_invisibility((By.CLASS_NAME, 'sem-pagination'))

    def execute_action_expect_alert(self, action, alert_text_contains=""):
        """Executes the provided action, asserts that an alert appears and validates
        that the alert text contains the provided string (when provided)"""
        action()
        alert = self.find(
            (By.XPATH,
             "//div[@class='react-alerts']//div[contains(@class,'alert')]")
        )
        self.assertTrue(alert_text_contains in alert.text)

    def take_alert_action(self):
        """Takes the action provided by the alert by clicking the button on when visible"""
        alert = self.find(
            (By.XPATH,
             "//div[@class='react-alerts']//div[contains(@class,'alert')]")
        )
        self.find(
            (By.CLASS_NAME,
             "conflict-alert-btn"),
            root=alert,
        ).click()

    def allow_conflicts_add(self, n_slots):
        """Allows conflicts via the conflict alert action,
        then validates that the course was added
        """
        n_master_slots_before = len(self.find((By.CLASS_NAME, 'master-slot'), get_all=True))
        self.take_alert_action()
        self.assert_loader_completes()
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before + 1)
        self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots)

    def change_term(self, term, clear_alert=False):
        """Changes the term to the provided term by matching the string to the string
        found in the semester dropdown on Semester.ly"""
        self.click_off()
        self.find((By.CLASS_NAME, 'search-bar__semester')).click()
        self.find((
            By.XPATH,
            "//div[contains(@class,'semester-option') " +
            "and contains(text(),'%s')]" % term
        ), clickable=True).click()
        if clear_alert:
            self.take_alert_action()
        search_box = self.find((By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'))
        search_box.clear()
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(text_to_be_present_in_element_attribute(
                (By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'),
                term, 'placeholder'
            )
        )

    def change_to_current_term(self, clear_alert=False):
        sem = get_current_semesters('jhu')[0]
        self.change_term("%s %s" % (sem['name'], sem['year']), clear_alert=clear_alert)

    def open_and_query_adv_search(self, query, n_results=None):
        """Open's the advanced search modal and types in the provided query,
        asserting that n_results are then returned"""
        self.find(
            (By.CLASS_NAME, 'show-exploration'),
            clickable=True
        ).click()
        self.find(
            (By.CLASS_NAME, 'exploration-modal'),
            clickable=True
        )
        search = self.find((
            By.XPATH,
            '//div[contains(@class,"exploration-header")]//input'
        ))
        search.clear()
        search.send_keys(query)
        if n_results:
            self.assert_n_elements_found((By.CLASS_NAME, 'exp-s-result'), n_results)

    def login_via_fb(self, email, password):
        """Login user via fb by clicking continue with Facebook in the signup modal,
        entering the user's credentials into Facebook, then returns to Semester.ly

        Args:
            email (str): User's email
            password (str): User's password
        """
        self.find((By.CLASS_NAME, 'social-login'), clickable=True).click()
        self.find((By.CLASS_NAME, 'fb-btn'), clickable=True).click()
        self.find((By.XPATH, '/html[@id="facebook"]'))
        email_input = self.find((By.ID, 'email'))
        email_input.send_keys(email)
        pass_input = self.find((By.ID, 'pass'))
        pass_input.send_keys(password)
        self.find((By.ID, 'loginbutton')).click()

    def login_via_google(self, email, password, **kwargs):
        """Mocks the login of a user via Google by clicking continue with Facebook
        in the signup modal. Then manually creates and logins a user. All kwargs are
        passed to the user model on creation (e.g. name and email).

        Args:
            email (str): User's email
            password (str): User's password
        """
        self.find((By.CLASS_NAME, 'social-login'), clickable=True).click()
        self.find(
            (By.XPATH,
             ("//span[contains(text(), 'Continue with Google')]"
              "/ancestor::button[contains(@class, 'btn')]")),
            clickable=True
        ).click()
        #ensure that we are on the google page
        self.find((By.ID, 'identifierId'))
        user = User.objects.create(
            username='temporary',
            password='temporary',
            **kwargs
        )
        student = Student.objects.create(
            user=user,
            img_url=self.get_test_url('jhu', path="static/img/user2-160x160.jpg")
        )
        social_user = UserSocialAuth.objects.create(
            user=user,
            uid='12345678987654321',
            provider="google-oauth2",
            extra_data={
                'access_token': '12345678987654321',
                'expires': 'never'
            }
        )
        user.save()
        student.save()
        social_user.save()
        force_login(user, self.driver, self.get_test_url('jhu'))

    def select_nth_adv_search_result(self, index, semester):
        """Selects the nth advanced search result with a click.
        Validates the course modal body displayed in the search reuslts"""
        res = self.find((By.CLASS_NAME, 'exp-s-result'), get_all=True)
        code = self.find((By.TAG_NAME, 'h5'), root=res[index]).text
        course = Course.objects.get(code=code)
        ActionChains(self.driver).move_to_element(res[index]).click().perform()
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(EC.text_to_be_present_in_element(
                (By.XPATH, "//div[contains(@class, 'modal-header')]/h2"),
                course.code
            ))
        modal = self.find((By.CLASS_NAME, 'exp-modal'))
        self.validate_course_modal_body(course, modal, semester)

    def save_user_settings(self):
        """Saves user setttings by clicking the button, asserts that the
        modal is then invisible"""
        self.find((By.CLASS_NAME, 'signup-button')).click()
        self.assert_invisibility((By.CLASS_NAME, 'welcome-modal'))

    def complete_user_settings_basics(self, major, class_year):
        """Completes major/class year/TOS agreement via the welcome modal

        Args:
            major (str): Student's major
            class_year (str): Student's class year
        """
        # Assert welcome modal is open
        self.find((By.CLASS_NAME, 'welcome-modal'))
        major_select, year_select = self.find(
            (By.XPATH,
             "//div[contains(@class,'Select-input')]//input"),
            get_all=True,
            hidden=True
        )
        major_select.send_keys(major)
        self.find(
            (By.XPATH,
             "//div[contains(@id,'react-select-')]"),
        ).click()
        year_select.send_keys(class_year)
        self.find(
            (By.XPATH,
             "//div[contains(@id,'react-select-')]"),
        ).click()
        self.find(
            (By.XPATH,
             "//span[contains(@class, 'switch-label') and contains(@data-off, 'CLICK TO ACCEPT')]")
        ).click()
        self.find((
            By.XPATH,
            "//input[contains(@id, 'tos-agreed-input') and contains(@value, 'on')]"
        ), hidden=True)
        self.save_user_settings()
        self.assert_invisibility((By.CLASS_NAME, 'welcome-modal'))

    def change_ptt_name(self, name):
        """Changes personal timetable name to the provided title"""
        name_input = self.find((By.CLASS_NAME, 'timetable-name'))
        name_input.clear()
        name_input.send_keys(name)
        self.click_off()

    def save_ptt(self):
        """Saves the user's current personal timetable and returs a tuple representation"""
        self.find((By.CLASS_NAME, 'fa-floppy-o')).click()
        self.assert_invisibility(
            (By.XPATH,
             "//input[contains(@class, 'timetable-name) and contains(@class, 'unsaved')]")
        )
        return self.ptt_to_tuple()

    def assert_ptt_const_across_refresh(self):
        """Refreshes the browser and asserts that the tuple
        version of the personal timetable is equivalent to pre-refresh
        """
        ptt = self.ptt_to_tuple()
        self.driver.refresh()
        self.assert_ptt_equals(ptt)

    def assert_ptt_equals(self, ptt):
        """Asserts equivalency between the provided ptt tuple and the current ptt"""
        try:
            WebDriverWait(self.driver, self.TIMEOUT) \
                .until(function_returns_true(lambda: self.ptt_equals(ptt)))
        except TimeoutException:
            #ptt equivalency check failed. Run check one final time for useful debug info
            self.ptt_equals(ptt)
            raise RuntimeError("PTTs are not equal.")

    def ptt_equals(self, ptt):
        slots, master_slots, tt_name = ptt
        self.assertCountEqual(slots, self.get_elements_as_text((By.CLASS_NAME, 'slot')))
        self.assertCountEqual(master_slots,
            self.get_elements_as_text((By.CLASS_NAME, 'master-slot')))
        self.assertCountEqual(tt_name, self.get_elements_as_text((By.CLASS_NAME, 'timetable-name')))
        return True

    def ptt_to_tuple(self):
        """Converts personal timetable to a tuple representation"""
        slots = self.get_elements_as_text((By.CLASS_NAME, 'slot'))
        master_slots = self.get_elements_as_text((By.CLASS_NAME, 'master-slot'))
        tt_name = self.get_elements_as_text((By.CLASS_NAME, 'timetable-name'))
        return (slots, master_slots, tt_name)

    def get_elements_as_text(self, locator):
        """Gets elements using self.get and represents them as text"""
        eles = self.find(locator, get_all=True)
        return [s.text for s in eles]

    def create_ptt(self, name=None):
        """Create a personaltimetable with the provided name when provided"""
        self.find((
            By.XPATH,
            "//button[contains(@class,'add-button')]//i[contains(@class,'fa fa-plus')]"
        )).click()
        name_input = self.find((By.CLASS_NAME, 'timetable-name'))
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(EC.text_to_be_present_in_element_value(
                (By.CLASS_NAME, 'timetable-name'),
                'Untitled Schedule'
            ))
        if name:
            name_input.clear()
            name_input.send_keys(name)

    def create_friend(self, first_name, last_name, **kwargs):
        """Creates a friend of the primary (first) user"""
        user = User.objects.create(
            first_name=first_name,
            last_name=last_name
        )
        friend = Student.objects.create(
            user=user,
            img_url=self.get_test_url('jhu', path="static/img/user2-160x160.jpg"),
            **kwargs
        )
        friend.friends.add(Student.objects.first())
        friend.save()
        return friend

    def create_personal_timetable_obj(self, friend, courses, semester):
        """Creates a personal timetable object belonging to the provided user
        with the given courses and semester"""
        ptt = PersonalTimetable.objects.create(
            student=friend,
            semester_id=semester.id
        )
        for course in courses:
            ptt.courses.add(course)
        ptt.save()
        return ptt

    def assert_friend_image_found(self, friend):
        """Asserts that the provided friend's image is found on the page"""
        self.assert_n_elements_found((By.CLASS_NAME, 'ms-friend'), 1)
        self.find((
            By.XPATH,
            "//div[contains(@class,'ms-friend') and contains(@style,'%s')]" % friend.img_url
        ))

    def assert_friend_in_modal(self, friend):
        """Asserts that the provided friend's image is found on the modal"""
        friend_div = self.assert_n_elements_found((By.CLASS_NAME, 'friend'), 1)
        self.find((
            By.XPATH,
            "//div[contains(@class,'ms-friend') and contains(@style,'%s')]" % friend.img_url
        ), root=friend_div)

    def switch_to_ptt(self, name):
        """Switches to the personal timetable with matching name"""
        self.find((By.CLASS_NAME, 'timetable-drop-it-down')).click()
        self.find((
            By.XPATH,
            "//div[@class='tt-name' and contains(text(),'%s')]" % name
        ), clickable=True).click()
        self.find((
            By.XPATH,
            "//input[contains(@class, 'timetable-name') and @value='%s']" % name
        ))

class url_matches_regex:
    """Expected Condition which waits until the browser's url matches the provided regex"""
    def __init__(self, pattern):
        self.pattern = re.compile(pattern)

    def __call__(self, driver):
        res = self.pattern.search(driver.current_url)
        if res:
            return res
        else:
            return False

class text_to_be_present_in_element_attribute:
    """
    An expectation for checking if the given text is present in the element's
    locator, text
    """
    def __init__(self, locator, text_, attribute_):
        self.locator = locator
        self.text = text_
        self.attribute = attribute_

    def __call__(self, driver):
        try:
            element_text = driver.find_element(*self.locator).get_attribute(self.attribute)
            if element_text:
                return self.text in element_text
            else:
                return False
        except StaleElementReferenceException:
            return False

class text_to_be_present_in_nth_element:
    """
    An expectation for checking if the given text is present in the nth element's
    locator, text
    """
    def __init__(self, locator, text_, index_):
        self.locator = locator
        self.text = text_
        self.index = index_

    def __call__(self, driver):
        try:
            element = driver.find_elements(*self.locator)[self.index]
            if element.text and self.text in element.text:
                return element
            else:
                return False
        except StaleElementReferenceException:
            return False


class n_elements_to_be_found:
    """
    An expectation for checking if the n elements are found
    locator, text
    """
    def __init__(self, locator, n_):
        self.locator = locator
        self.n_found = n_

    def __call__(self, driver):
        try:
            eles_found = driver.find_elements(*self.locator)
            if len(eles_found) == self.n_found:
                return True
            else:
                return False
        except StaleElementReferenceException:
            return False

class function_returns_true:
    """
    An expectation for checking if the provided function returns true
    """
    def __init__(self, func):
        self.function = func

    def __call__(self, driver):
        try:
            return self.function()
        except:
            return False

def force_login(user, driver, base_url):
    """Forces the login of the provided user setting all cookies.
    Function will refresh the provided drivfer and the user will be logged in to that session.
    """
    from django.conf import settings
    session_store = import_module(settings.SESSION_ENGINE).SessionStore
    driver.get(base_url)

    session = session_store()
    session[SESSION_KEY] = user.id
    session[BACKEND_SESSION_KEY] = settings.AUTHENTICATION_BACKENDS[0]
    session[HASH_SESSION_KEY] = user.get_session_auth_hash()
    session.save()

    domain = base_url.split(':')[-2].split('/')[-1]
    cookie = {
        'name': settings.SESSION_COOKIE_NAME,
        'value': session.session_key,
        'path': '/',
        'secure': False,
        'domain': domain
    }

    driver.add_cookie(cookie)
    driver.refresh()
