from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from django.test.utils import override_settings
import socket, itertools
from time import sleep

class SeleniumTest(StaticLiveServerTestCase):

    serialized_rollback = True
    
    @classmethod
    def setUpClass(self):
        super(SeleniumTest, self).setUpClass()
        self.TIMEOUT = 30
        self.driver = None
        socket.setdefaulttimeout(self.TIMEOUT) 
        self.driver = webdriver.Chrome()        
    
    @classmethod
    def tearDownClass(self):
        super(SeleniumTest, self).tearDownClass()
        self.driver.quit()

    def setUp(self):
        self.driver.get(self.get_test_url('jhu'))
        WebDriverWait(self.driver, self.TIMEOUT).until(lambda driver: driver.find_element_by_tag_name('body'))
    
    def tearDown(self):
        self.driver.execute_script('window.localStorage.clear();')
        self.driver.delete_all_cookies()     
    

    @classmethod
    def get_test_url(self, school, path = '/'):
        url = '%s%s' % (self.live_server_url, '/')
        return url.replace('http://', 'http://%s.' % school)

    @classmethod
    def clear_tutorial(self):
        for _ in range(4):
            arrow = WebDriverWait(self.driver, self.TIMEOUT).until(
                EC.element_to_be_clickable((By.XPATH, '//div[@class="tut-modal__nav"]/i[@class="action fa fa-chevron-right"] | //div[@class="tut-modal__nav"]/h4'))
            )
            arrow.click()

    @override_settings(DEBUG=True)
    def test_can_clear_tutorial(self):
        self.clear_tutorial()
        WebDriverWait(self.driver, self.TIMEOUT).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, 'tut-modal__nav'))
        )

    @override_settings(DEBUG=True)
    def test_again(self):
        self.clear_tutorial()
        WebDriverWait(self.driver, self.TIMEOUT).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, 'tut-modal__nav'))
        )
