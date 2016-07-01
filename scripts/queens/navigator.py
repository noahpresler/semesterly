from selenium import webdriver
from selenium.webdriver.support.ui import Select
from time import sleep

#-------------------------------------------------------
#   FOR HEADLESS, LEGIT USAGE
# driver = webdriver.PhantomJS()
#-------------------------------------------------------

#-------------------------------------------------------
#   FOR DEBUGGING USE ONLY
driver = webdriver.Chrome('/home/linoah/chromedriver')
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

def focus_iframe():
	print "FOCUSING IFRAME"
	iframe = seleni_run(lambda: driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
	driver.switch_to_frame(iframe)

def get_nth_class_element(n,num_sections):
	# focus_iframe()
	print "GETTING CLASS ELEMENTS"
	while True:
		sections = seleni_run(lambda: driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))
		if len(sections) == num_sections:
			return sections[n]

def get_class_elements():
	# focus_iframe()
	print "GETTING CLASS ELEMENTS"
	return seleni_run(lambda: driver.find_elements_by_css_selector("a[id^='MTG_CLASS_NBR']"))

def felix_parses_this_shit(html):
	print "FELIX IS PARSING"
	# THIS PARSES HTML FOR *ONE* SECTION PAGE
	#---------------------------------
	#INSERT SEARCH SCRAPING LOGIC HERE
	# @FELIX - HTML IS STORED IN html
	# writing it to workfile.html for fun
	f = open('workfile.html','w')
	f.write(html.encode("utf-8"))
	f.close()
	# you can delete that obviously
	#---------------------------------

def get_section_html(num_sections):
	print "GETTING SECTIONS HTML"
	for n in range(num_sections):
		print "CLICKING"
		print str(n) + "/" + str(num_sections)
		get_nth_class_element(n,num_sections).click()
		print "WAITING FOR PAGE LOAD"
		seleni_run(lambda: driver.find_element_by_class_name('PALEVEL0SECONDARY'))
		felix_parses_this_shit(driver.page_source)
		print "RETURNING"
		seleni_run(lambda: driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_BACK')).click()

print "LOGGING IN"
driver.get('https://my.queensu.ca/')
seleni_run(lambda: driver.find_element_by_id('username').send_keys('1dc4'))
seleni_run(lambda: driver.find_element_by_id('password').send_keys('CREOmule1'))
seleni_run(lambda: driver.find_element_by_class_name('Btn1Def').click())

print "NAVIGATING TO SOLUS"
seleni_run(lambda: driver.find_element_by_link_text("SOLUS").click())

print "NAVIGATING TO SEARCH PAGE"
focus_iframe()
seleni_run(lambda: driver.find_element_by_link_text("Search").click())

print "SELECTING TERM 2016 Fall"
select_term_by_term_string("2016 Fall")

num_subjects = len(seleni_run(lambda: driver.find_element_by_id('SSR_CLSRCH_WRK_SUBJECT_SRCH$0')).find_elements_by_tag_name('option'))
for i in range(1,num_subjects):
	print "SELECTING SUBJECT #" + str(i)
	select_subject_by_index(i)
	print "SEARCH"
	click_search()
	sections = get_class_elements()
	html = get_section_html(len(sections))
	print "RETURN"
	return_to_search()