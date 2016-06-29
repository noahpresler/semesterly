
course_title_id = "DERIVED_CLSRCH_DESCR200"
class_number_id = "SSR_CLS_DTL_WRK_CLASS_NBR"
units_id = "SSR_CLS_DTL_WRK_UNITS_RANGE"
campus_id = "CAMPUS_TBL_DESCR"
prereq_id = 'SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG'
capacity_id = 'SSR_CLS_DTL_WRK_ENRL_CAP'
description_id = 'DERIVED_CLSRCH_DESCRLONG'

def get_field_text(soup, span_id):
  return soup.find('span', {'id': span_id}).text

def extract_prereqs(general_info):
  return general_info # TODO

def extract_exclusions(general_info):
  return general_info # TODO

def parse_course_element(course_element):
  page_title = get_field_text(course_title_id)
  course_code = ' '.join(page_title.split()[:2])
  course_data = {
    # mandatory
    'name': ' '.join(page_title.split()[4:]), 
    'school': 'queens',

    # optional
    'description': get_field_text(description_id),
    'num_credits': int(get_field_text(units_id).split()[0]),
    'campus': get_field_text(campus_id),
    'prerequisites': extract_prereqs(prereq_id),
    'exclusions': extract_exclusions(prereq_id),
    'department': page_title.split()[0],
    'level': course_code.split()[1][0],
  }

  return course_code, course_data

# notes
all_tables = soup.findAll('table', class_='PSGROUPBOXWBO')
avail_table = all_tables[2]
avail_table_content = avail_table.tbody.tbody
rows = content.findAll('tr')
row1 = rows[2]
row2 = rows[4]
rows3 = rows[6]
class_size = row1.findAll('td')[1].find('span').text
waitlist_size = row1.findAll('td')[3].find('span').text
enrolment = row2.findAll('td')[1].find('span').text
waitlist = row2.findAll('td')[2].find('span').text
test = soup.findAll('table', {'class': 'PSLEVEL1GRIDWBO'})
len(test)