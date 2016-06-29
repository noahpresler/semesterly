from selenium import webdriver
from selenium.webdriver.support.ui import Select
from time import sleep
# driver = webdriver.PhantomJS()
driver = webdriver.Chrome('/home/linoah/chromedriver')
# f = open('workfile.html', 'w')

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

def return_to_search():
	try: 
		driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH')
	except:
		seleni_run(lambda: driver.find_element_by_id('CLASS_SRCH_WRK2_SSR_PB_MODIFY').click())

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
	sleep(1)
	#---------------------------------
	print "RETURN"
	return_to_search()

# f.write(driver.page_source.encode("utf-8"))
# f.close()