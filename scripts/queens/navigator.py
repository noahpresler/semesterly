from selenium import webdriver
# driver = webdriver.PhantomJS()
driver = webdriver.Chrome('/home/linoah/chromedriver')
f = open('workfile.html', 'w')

def seleni_run(code):
	while True:
		try:
			return code()
			break
		except:
			continue

print "LOGGING IN"
driver.get('https://my.queensu.ca/')
seleni_run(lambda: driver.find_element_by_id('username').send_keys('1dc4'))
seleni_run(lambda: driver.find_element_by_id('password').send_keys('CREOmule1'))
seleni_run(lambda: driver.find_element_by_class_name('Btn1Def').click())

print "NAVIGATING TO SOLUS"
seleni_run(lambda: driver.find_element_by_link_text("SOLUS").click())

print "NAVIGATING TO SEARCH PAGE"
iframe = seleni_run(lambda: driver.find_element_by_xpath("//iframe[@id='ptifrmtgtframe']"))
driver.switch_to_frame(iframe)
seleni_run(lambda: driver.find_element_by_link_text("Search").click())


f.write(driver.page_source.encode("utf-8"))
f.close()