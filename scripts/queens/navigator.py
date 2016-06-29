from selenium import webdriver
from selenium.webdriver.support.ui import Select
from time import sleep

#-------------------------------------------------------
#   FOR HEADLESS, LEGIT USAGE
driver = webdriver.PhantomJS()
#-------------------------------------------------------

#-------------------------------------------------------
#   FOR DEBUGGING USE ONLY
# driver = webdriver.Chrome('/home/linoah/chromedriver')
#-------------------------------------------------------

def seleni_run(code):
	while True:
		try:
			return code()
			break
		except:
			continue

def select_subject_by_index(index):
	select = seleni_run(lambda: driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0'))
	select.find_elements_by_tag_name('option')[index].click()

def select_term_by_term_string(term):
	select = Select(seleni_run(lambda: seleni_run(lambda: driver.find_element_by_id('CLASS_SRCH_WRK2_STRM$35$'))))
	select.select_by_visible_text(term)
	sleep(2)

def click_search():
	seleni_run(lambda: driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH').click())
	sleep(2)

def return_to_search():
	while True:
		try: # try to find error
			driver.find_element_by_id('win0divDERIVED_CLSMSG_ERROR_TEXT')
			return
		except: # no error
			try: # try to find return to search button
				driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_MODIFY').click()
				return
			except:
				continue # try again

print "LOGGING IN"
driver.get('https://my.queensu.ca/')
seleni_run(lambda: driver.find_element_by_id('username').send_keys('1dc4'))
seleni_run(lambda: driver.find_element_by_id('password').send_keys('***REMOVED***'))
seleni_run(lambda: driver.find_element_by_class_name('Btn1Def').click())

print "NAVIGATING TO SOLUS"
seleni_run(lambda: driver.find_element_by_link_text("SOLUS").click())

print "NAVIGATING TO SEARCH PAGE"
iframe = seleni_run(lambda: driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
driver.switch_to_frame(iframe)
seleni_run(lambda: driver.find_element_by_link_text("Search").click())

print "SELECTING TERM 2016 Fall"
select_term_by_term_string("2016 Fall")

num_subjects = len(seleni_run(lambda: driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0')).find_elements_by_tag_name('option'))
for i in range(1,num_subjects):
	print "SELECTING " + str(i) + "th SUBJECT"
	select_subject_by_index(i)
	print "SEARCH"
	click_search()
	#---------------------------------
	#INSERT SEARCH SCRAPING LOGIC HERE
	#---------------------------------
	print "RETURN"
	return_to_search()