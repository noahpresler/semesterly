from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from django.test.utils import override_settings
import socket, itertools

class SeleniumTest(StaticLiveServerTestCase):

    fixtures = ['jhu_fall_sample.json']
    serialized_rollback = True
    
    @classmethod
    def setUpClass(self):
        super(SeleniumTest, self).setUpClass()
        self.TIMEOUT = 10
        self.driver = None
        socket.setdefaulttimeout(self.TIMEOUT) 
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
    
    def locate_and_get(self, locator, get_all=False, root=None):
        try:
            ec = EC.presence_of_all_elements_located(locator) if get_all \
                else EC.visibility_of_element_located(locator)
            return WebDriverWait(root if root else self.driver, self.TIMEOUT).until(ec)
        except TimeoutException:
            raise RuntimeError('Failed to locate visible element "%s" by %s' % locator[::-1])
    
    def assert_invisibility(self, locator, root=None):
        try:        
            WebDriverWait(root if root else self.driver, self.TIMEOUT).until(
                EC.invisibility_of_element_located((By.CLASS_NAME, 'la-ball-clip-rotate-multiple'))
            )
        except TimeoutException:
            raise RuntimeError('Failed to assert invisibility of element "%s" by %s' % locator[::-1])

    def clear_tutorial(self):
        for _ in range(4):
            arrow = WebDriverWait(self.driver, self.TIMEOUT).until(
                EC.element_to_be_clickable((By.XPATH, '//div[@class="tut-modal__nav"]/i[@class="action fa fa-chevron-right"] | //div[@class="tut-modal__nav"]/h4'))
            )
            arrow.click()
    
    def enter_search_query(self, query):
        search_box = self.locate_and_get((By.XPATH, '//div[@class="search-bar__input-wrapper"]/input'))
        search_box.send_keys(query)
    
    def wait_for_timetable_load(self):
        self.locate_and_get((By.CLASS_NAME, 'la-ball-clip-rotate-multiple'))
        self.assert_invisibility((By.CLASS_NAME, 'la-ball-clip-rotate-multiple'))

    def assert_slot_presence(self, n_slots, n_master_slots):
        slots = self.locate_and_get((By.CLASS_NAME, 'slot'), get_all=True)
        self.assertEqual(len(slots), n_slots)
        master_slots = self.locate_and_get((By.CLASS_NAME, 'master-slot'), get_all=True)
        self.assertEqual(len(master_slots), n_master_slots)

    def test_can_clear_tutorial(self):
        self.clear_tutorial()
        self.assert_invisibility((By.CLASS_NAME, 'tut-modal__nav'))
    
    def test_search_add_course(self):
        self.clear_tutorial()
        self.enter_search_query('calc')
        search_results = self.locate_and_get((By.CLASS_NAME, 'search-results'))
        chosen_course = search_results.find_elements_by_class_name('search-course')[0]
        add_button = self.locate_and_get((By.CLASS_NAME, 'search-course-add'), root=chosen_course)
        add_button.click()
        self.wait_for_timetable_load()
        self.assert_slot_presence(4,1)