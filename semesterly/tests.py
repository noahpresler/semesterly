from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from selenium.webdriver.common.action_chains import ActionChains
from django.test.utils import override_settings
from timetable.models import Semester, Course, Section, Offering
from contextlib import contextmanager
import socket, itertools, re

class url_matches_regex(object):
    def __init__(self, pattern):
        self.pattern = re.compile(pattern)

    def __call__(self, driver):
        res = self.pattern.search(driver.current_url)
        if res:
            return res
        else:
            return False

class text_to_be_present_in_element_attribute(object):
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

@contextmanager
def description(descr):
    try:
        yield
    except:
        print "\n======================================================================"
        print 'FAILED TEST CASE: "%s"' % descr
        print "----------------------------------------------------------------------"
        raise

class SeleniumTest(StaticLiveServerTestCase):

    fixtures = [
        'jhu_fall_sample.json',
        'jhu_spring_sample.json'
    ]
    serialized_rollback = True

    @classmethod
    def setUpClass(self):
        super(SeleniumTest, self).setUpClass()
        self.TIMEOUT = 10
        self.driver = None
        socket.setdefaulttimeout(3 * self.TIMEOUT)
        self.driver = webdriver.Chrome()

    @classmethod
    def tearDownClass(self):
        self.driver.quit()
        super(SeleniumTest, self).tearDownClass()

    def setUp(self):
        self.driver.get(self.get_test_url('jhu'))
        WebDriverWait(self.driver, self.TIMEOUT).until(lambda driver: driver.find_element_by_tag_name('body'))

    def tearDown(self):
        self.driver.execute_script('window.localStorage.clear();')
        self.driver.delete_all_cookies()

    def get_test_url(self, school, path = '/'):
        url = '%s%s' % (self.live_server_url, '/')
        return url.replace('http://', 'http://%s.' % school)

    def locate_and_get(self, locator, get_all=False, root=None, clickable=False):
        if get_all and clickable:
            raise RuntimeError("Cannot use both get_all and clickable")
        elif get_all:
           ec = EC.presence_of_all_elements_located(locator)
        elif clickable:
            ec = EC.element_to_be_clickable(locator)
        else:
            ec = EC.visibility_of_element_located(locator)
        try:
            return WebDriverWait(root if root else self.driver, self.TIMEOUT).until(ec)
        except TimeoutException:
            raise RuntimeError('Failed to locate visible element "%s" by %s' % locator[::-1])

    def assert_invisibility(self, locator, root=None):
        try:
            WebDriverWait(root if root else self.driver, self.TIMEOUT).until(
                EC.invisibility_of_element_located(locator)
            )
        except TimeoutException:
            raise RuntimeError('Failed to assert invisibility of element "%s" by %s' % locator[::-1])

    def clear_tutorial(self):
        for _ in range(4):
            arrow = self.locate_and_get((By.XPATH, '//div[@class="tut-modal__nav"]/i[@class="action fa fa-chevron-right"] | //div[@class="tut-modal__nav"]/h4'), clickable = True)
            arrow.click()
        self.assert_invisibility((By.XPATH, '//div[@class="tut-modal__nav"]'))

    def enter_search_query(self, query):
        search_box = self.locate_and_get((By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'))
        search_box.clear()
        search_box.send_keys(query)

    def assert_loader_completes(self):
        self.assert_invisibility((By.CLASS_NAME, 'la-ball-clip-rotate-multiple'))

    def assert_slot_presence(self, n_slots, n_master_slots):
        slots = self.locate_and_get((By.CLASS_NAME, 'slot'), get_all=True)
        self.assertEqual(len(slots), n_slots)
        master_slots = self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True)
        self.assertEqual(len(master_slots), n_master_slots)

    def search_course(self, query, n_results):
        self.enter_search_query(query)
        search_results = self.locate_and_get((By.CLASS_NAME, 'search-results'))
        self.assertEqual(len(search_results.find_elements_by_class_name('search-course')), n_results)

    def add_course(self, course_idx, n_slots, n_master_slots, by_section=False):
        search_box = self.locate_and_get((By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'))
        search_box.send_keys("")
        search_results = self.locate_and_get((By.CLASS_NAME, 'search-results'))
        chosen_course = search_results.find_elements_by_class_name('search-course')[course_idx]
        if not by_section:
            add_button = self.locate_and_get((By.CLASS_NAME, 'search-course-add'), root=chosen_course, clickable=True)
            add_button.click()
        else:
            ActionChains(self.driver).move_to_element(chosen_course).perform()
            side_bar = self.locate_and_get((By.CLASS_NAME, 'search-bar__side'))
            section = self.locate_and_get((
                By.XPATH,
                 "//h5[contains(@class,'sb-side-sections') and " + \
                 "contains(text(),'%s')]" % by_section
            ), clickable=True)
            ActionChains(self.driver).move_to_element(chosen_course)\
                 .move_to_element(section) \
                .click().move_to_element(chosen_course).perform()
        self.assert_loader_completes()
        self.assert_slot_presence(n_slots, n_master_slots)

    def assert_n_elements_found(self, locator, n, root=None):
        if n == 0:
            self.assert_invisibility(locator)
        else:
            n_found = len(self.locate_and_get(locator, root=root, get_all=True))
            self.assertEqual(n_found, n)

    def remove_course(self, course_idx, from_slot=False, n_slots_expected=None):
        n_master_slots_before = len(self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True))
        if from_slot:
            if n_master_slots_before > 0:
                raise RuntimeError('Cannot remove via slot button unless n_courses = 1')
            slot = self.locate_and_get((By.CLASS_NAME, 'slot'), get_all=True)[0]
            del_button = self.locate_and_get((By.CLASS_NAME,'fa-times'), root=slot, clickable=True)
        else:
            master_slot = self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True)[course_idx]
            del_button = self.locate_and_get((By.CLASS_NAME,'fa-times'), root=master_slot, clickable=True)
        del_button.click()
        self.assert_loader_completes()
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before - 1)
        if n_slots_expected:
            self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots_expected)

    def open_course_modal_from_search(self, course_idx):
        search_results = self.locate_and_get((By.CLASS_NAME, 'search-results'))
        chosen_course = search_results.find_elements_by_class_name('search-course')[course_idx]
        chosen_course.click()

    def validate_course_modal(self):
        url_match = WebDriverWait(self.driver, self.TIMEOUT).until(url_matches_regex(r'\/course\/(.*)\/(.*)\/(20..)'))
        code = url_match.group(1)
        semester = Semester.objects.get(
            name = url_match.group(2),
            year = url_match.group(3)
        )
        course = Course.objects.get(code=code)
        modal = self.locate_and_get((By.CLASS_NAME, 'course-modal'))        
        self.validate_course_modal_body(course, modal, semester)
    
    def validate_course_modal_body(self, course, modal, semester):
        modal_body = self.locate_and_get((By.CLASS_NAME, 'modal-body'), root=modal)
        modal_header = self.locate_and_get((By.CLASS_NAME, 'modal-header'), root=modal)
        credit_count = self.locate_and_get((By.CLASS_NAME, 'credits'), root=modal_body)
        self.assertTrue(str(int(course.num_credits)) in credit_count.text or str(course.num_credits) in credit_count.text)
        self.assertTrue(course.name in modal_header.text)
        self.assertTrue(course.code in modal_header.text)
        self.assertTrue(course.prerequisites in modal_body.text)
        self.assertTrue(course.areas in modal_body.text)
        n_sections = Section.objects.filter(
            course=course,
            semester=semester
        ).count()
        self.assertEqual(n_sections, len(self.locate_and_get((By.CLASS_NAME, 'modal-section'), get_all=True)))
        
    def open_course_modal_from_slot(self, course_idx):
        slot = self.locate_and_get((By.CLASS_NAME, 'slot'), clickable=True)
        slot.click()

    def close_course_modal(self):
        modal = self.locate_and_get((By.CLASS_NAME, 'course-modal'))
        modal_header = self.locate_and_get((By.CLASS_NAME, 'modal-header'), root=modal)
        self.locate_and_get((By.CLASS_NAME, 'fa-times'), root=modal_header, clickable=True).click()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))

    def follow_and_validate_url(self, url, validate):
        self.driver.execute_script("window.open()")
        self.driver.switch_to_window(self.driver.window_handles[1])
        self.driver.get(url)
        validate()
        self.driver.close()
        self.driver.switch_to_window(self.driver.window_handles[0])

    def follow_share_link_from_modal(self):
        modal = self.locate_and_get((By.CLASS_NAME, 'course-modal'))
        modal_header = self.locate_and_get((By.CLASS_NAME, 'modal-header'), root=modal)
        self.locate_and_get((By.CLASS_NAME, 'fa-share-alt'), root=modal_header).click()
        url = self.locate_and_get((By.CLASS_NAME, 'share-course-link'), root=modal_header).get_attribute('value')
        self.follow_and_validate_url(url, self.validate_course_modal)

    def follow_share_link_from_slot(self):
        master_slot = self.locate_and_get((By.CLASS_NAME, 'master-slot'), clickable=True)
        share = self.locate_and_get((By.CLASS_NAME,'fa-share-alt'), root=master_slot, clickable=True)
        share.click()
        url = self.locate_and_get((By.CLASS_NAME, 'share-course-link'), root=master_slot).get_attribute('value')
        self.follow_and_validate_url(url, self.validate_course_modal)

    def remove_course_from_course_modal(self, n_slots_expected=None):
        n_master_slots_before = len(self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True))
        modal = self.locate_and_get((By.CLASS_NAME, 'course-modal'))
        modal_header = self.locate_and_get((By.CLASS_NAME, 'modal-header'), root=modal)
        remove = self.locate_and_get((By.CLASS_NAME, 'fa-check'), root=modal_header, clickable=True)
        remove.click()
        self.assert_loader_completes()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before - 1)
        if n_slots_expected:
            self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots_expected)

    def add_course_from_course_modal(self, n_slots, n_master_slots):
        modal = self.locate_and_get((By.CLASS_NAME, 'course-modal'))
        modal_header = self.locate_and_get((By.CLASS_NAME, 'modal-header'), root=modal)
        url_match = WebDriverWait(self.driver, self.TIMEOUT).until(url_matches_regex(r'\/course\/(.*)\/(.*)\/(20..)'))
        course = Course.objects.get(code=url_match.group(1))
        self.locate_and_get((By.CLASS_NAME, 'fa-plus'), root=modal_header).click()
        self.assert_loader_completes()
        self.assert_invisibility((By.CLASS_NAME, 'course-modal'))
        self.assert_slot_presence(n_slots, n_master_slots)
        return course

    def validate_timeable(self, courses):
        slots = self.locate_and_get((By.CLASS_NAME, 'slot'), get_all=True)
        for course in courses:
            any([course.name in slot.text and course.code in slot.text for slot in slots])

    def share_timetable(self, courses):
        top_bar_actions = self.locate_and_get((By.CLASS_NAME, 'fc-right'))
        self.locate_and_get(
            (By.CLASS_NAME, 'fa-share-alt'),
             clickable=True,
             root=top_bar_actions
        ).click()
        url = self.locate_and_get(
            (By.CLASS_NAME, 'share-course-link'),
            root=top_bar_actions
        ).get_attribute('value')
        self.follow_and_validate_url(url, lambda: self.validate_timeable(courses))

    def click_off(self):
        self.locate_and_get((By.CLASS_NAME, 'semesterly-name'), clickable=True).click()

    def lock_course(self):
        self.click_off()
        slot = self.locate_and_get((By.CLASS_NAME, 'slot'), clickable=True)
        ActionChains(self.driver).move_to_element(slot).perform()
        lock = self.locate_and_get((By.CLASS_NAME, 'fa-unlock'), root=slot, clickable=True)
        ActionChains(self.driver).move_to_element(slot).move_to_element(lock).click().perform()
        for slot in self.locate_and_get((By.CLASS_NAME, 'slot'), get_all=True):
            self.locate_and_get((By.CLASS_NAME, 'fa-lock'), clickable=True)
        self.assert_invisibility((By.CLASS_NAME, 'sem-pagination'))

    def execute_action_expect_alert(self, action, alert_text_contains=""):
        action()
        alert = self.locate_and_get(
            (By.XPATH,
            "//div[@class='react-alerts']//div[contains(@class,'alert')]")
        )
        self.assertTrue(alert_text_contains in alert.text)
    
    def take_alert_action(self):
        alert = self.locate_and_get(
            (By.XPATH,
            "//div[@class='react-alerts']//div[contains(@class,'alert')]")
        )
        self.locate_and_get(
            (By.CLASS_NAME,
            "conflict-alert-btn"),
            root=alert,
        ).click()

    def allow_conflicts_add(self, n_slots):
        n_master_slots_before = len(self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True))
        self.take_alert_action()
        self.assert_loader_completes()
        self.assert_n_elements_found((By.CLASS_NAME, 'master-slot'), n_master_slots_before + 1)
        self.assert_n_elements_found((By.CLASS_NAME, 'slot'), n_slots)

    def change_term(self, term, clear_alert=False):
        self.click_off()
        self.locate_and_get((By.CLASS_NAME, 'search-bar__semester')).click() 
        self.locate_and_get((
            By.XPATH,
            "//div[contains(@class,'semester-option') " +
            "and contains(text(),'%s')]" % term
        ), clickable=True).click()
        if clear_alert:
            self.take_alert_action()        
        search_box = self.locate_and_get((By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'))
        search_box.clear()
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(text_to_be_present_in_element_attribute(
                (By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'),
                term, 'placeholder'
            )
        )
    
    def open_and_query_adv_search(self, query, n_results=None):
        self.locate_and_get(
            (By.CLASS_NAME, 'show-exploration'),
            clickable=True
        ).click()
        self.locate_and_get(
            (By.CLASS_NAME, 'exploration-modal'),
            clickable=True
        )
        search = self.locate_and_get((
            By.XPATH,
            '//div[contains(@class,"exploration-header")]//input'
        ))
        search.clear()
        search.send_keys(query)
        if n_results:
            self.assert_n_elements_found((By.CLASS_NAME, 'exp-s-result'), n_results)

    def select_nth_adv_search_result(self, n, semester):
        res = self.locate_and_get((By.CLASS_NAME, 'exp-s-result'), get_all=True)
        code = self.locate_and_get((By.TAG_NAME, 'h5'), root=res[n]).text
        course = Course.objects.get(code=code)        
        ActionChains(self.driver).move_to_element(res[n]).click().perform()
        WebDriverWait(self.driver, self.TIMEOUT) \
            .until(EC.text_to_be_present_in_element(
                (By.XPATH, "//div[contains(@class, 'modal-header')]/h2"),
                course.code
            ))
        modal = self.locate_and_get((By.CLASS_NAME, 'exp-modal'))
        self.validate_course_modal_body(course, modal, semester)

    def test_logged_out_flow(self):
        with description("setup and clear tutorial"):
            self.driver.set_window_size(1440, 1080)
            self.clear_tutorial()
        with description("search, add, then remove course"):
            self.search_course('calc', 3)
            self.add_course(0, n_slots=4, n_master_slots=1)
            self.remove_course(0, n_slots_expected=0)
        with description("open course modal from search and share"):
            self.search_course('calc', 3)
            self.open_course_modal_from_search(1)
            self.validate_course_modal()
            self.follow_share_link_from_modal()
            self.close_course_modal()
        with description("open course modal & follow share link from slot"):
            self.search_course('calc', 3)
            self.add_course(1, n_slots=4, n_master_slots=1)
            self.follow_share_link_from_slot()
            self.open_course_modal_from_slot(0)
            self.validate_course_modal()
            self.close_course_modal()
        with description("Remove course from course modal"):
            self.open_course_modal_from_slot(0)
            self.remove_course_from_course_modal(0)
        with description("Add course from modal and share timetable"):
            self.search_course('calc', 3)
            self.open_course_modal_from_search(1)
            self.share_timetable([
                self.add_course_from_course_modal(
                    n_slots=4, n_master_slots=1
                )
            ])
        with description("lock course then add conflict"):
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
        with description("switch semesters, clear alert and check search/adding"):
            self.change_term("Spring 2017", clear_alert=True)            
            self.search_course('calc', 2)
            self.open_course_modal_from_search(1)
            self.share_timetable([
                self.add_course_from_course_modal(
                    n_slots=4, n_master_slots=1
                )
            ])
        with description("advanced search basic query executes"):
            self.change_term("Fall 2017", clear_alert=True)            
            sem = Semester.objects.get(year=2017, name='Fall')
            self.open_and_query_adv_search('ca', n_results=3)
            self.select_nth_adv_search_result(0, sem)
            self.select_nth_adv_search_result(1, sem)
            #TODO more tests on advanced search
            #TODO have self.sem track semester