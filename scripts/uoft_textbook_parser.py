from amazonproduct import API
from amazonproduct.errors import InvalidParameterValue
from fake_useragent import UserAgent
from bs4 import BeautifulSoup
from django.db.models import Q
from django.utils.encoding import smart_str
import cookielib, django, os, re, requests, sys, time

api = API(locale='us')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import Course, CourseOffering, Textbook, Link

SESSION = requests.Session()

def randomize_ua():
    return UserAgent().random

def get_request(url):
    cookies = cookielib.CookieJar()
    headers = {
        'User-Agent': randomize_ua(),
        'Accept' : '*/*',
        'Host' : 'uoftbookstore.com',
        'Referer' : 'http://uoftbookstore.com/buy_courselisting.asp',
        'Content-Length' : '0',
        'Content-Type' : 'application/x-www-form-urlencoded'
    }

    base_url = "http://uoftbookstore.com/textbooks_xml.asp?"
    url = base_url + url
    headers['User-Agent'] = randomize_ua()
    response = SESSION.get(url=url, cookies=cookies, headers=headers)
    return response

def parse_results(source):
    textbooks_found_count = 0

    soup = BeautifulSoup(source)
    page_source = soup.find(id="course-bookdisplay")

    # of all of these headers, we'll need to filter out the ones
    # that don't have textbooks
    section_headers = page_source.find_all("h3")

    for section_header in section_headers:
        sibling = section_header.find_next_sibling()
        if "not been informed" in sibling.text.lower(): # filter out the textbook-less sections
            continue

        matches = re.search("- (.+)[YS], section (.+?) ", section_header.text)
        all_textbooks_info = sibling.find_all('td', class_="book-desc")
        print "\t\t\tFor %s section %s, found %d textbook(s). These are:" % (
            matches.group(1), matches.group(2), len(all_textbooks_info))
        course = Course.objects.get(code=matches.group(1))
        course_offerings = CourseOffering.objects.filter(course=course,
                                                         meeting_section=matches.group(2))
        for textbook_info in all_textbooks_info:
            try:
                title = textbook_info.find('span', class_="book-title").text
                author = textbook_info.find('span', class_="book-author").text
                isbn = textbook_info.find('span', class_="isbn").text.replace("-", "")
            except:
                continue
            req = textbook_info.find('p', class_="book-req").text

            info = get_amazon_fields(isbn)
            if info is None:
                continue
            textbook_data = {
                'detail_url': info['DetailPageURL'],
                'image_url': info["ImageURL"],
                'author': info["Author"],
                'title': info["Title"]
            }
            textbook, created = Textbook.objects.update_or_create(isbn=isbn,
                                                        defaults=textbook_data)
            textbooks_found_count += int(created)
            for offering in course_offerings:
                if offering.textbooks.filter(isbn=isbn).exists():
                    continue
                new_link = Link(courseoffering=offering, textbook=textbook,
                                is_required=(req.strip().lower() == "required"))
                new_link.save()

            print "\t\t\t %s by: %s." % (title, author)
            print "\t\t\t ISBN: %s, Book is %s. Saved!" % (isbn, req)

    return textbooks_found_count

def get_amazon_fields(isbn):
    try:
        result = api.item_lookup(isbn.strip(),
                                 IdType='ISBN',
                                 SearchIndex='Books',
                                 ResponseGroup='Large')
        info = {
            "DetailPageURL" : get_detail_page(result),
            "ImageURL" : get_image_url(result),
            "Author" : get_author(result),
            "Title" : get_title(result)
        }
    except InvalidParameterValue:
        print "\t\t\tInvalidParameterException. ISBN: " + isbn
        info = None

    except:
        import traceback
        traceback.print_exc()
        info = None

    return info

def get_detail_page(result):
    try:
        return smart_str(result.Items.Item.DetailPageURL)
    except:
        return "Cannot Be Found"

def get_image_url(result):
    try:
        return smart_str(result.Items.Item.MediumImage.URL)
    except:
        return "Cannot Be Found"

def get_author(result):
    try:
        return smart_str(result.Items.Item.ItemAttributes.Author)
    except:
        return "Cannot Be Found"

def get_title(result):
    try:
        return smart_str(result.Items.Item.ItemAttributes.Title)
    except:
        return "Cannot Be Found"

def get_all_sections(crs, semester):
    offerings = CourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), \
                                            course=crs)
    sections = []
    for off in offerings:
        if off.meeting_section not in sections:
            sections.append(off.meeting_section)
    return sections


def process_campus(campus_info):
    print "Now processing textbooks for %s." % (campus_info['name'])

    rest = "control=campus&campus=%s&term=%s" % (campus_info['campus_id'], campus_info['term'])
    response = get_request(rest)
    department_soup = BeautifulSoup(response.text)
    depts = department_soup.findAll('department')
    department_to_dept_id = {}
    for dept in depts:
        department_to_dept_id[dept['abrev']] = dept['id']

    campus_courses = Course.objects.filter(code__endswith=campus_info['ending']).order_by('code')
    current_dept = ""
    for i, course in enumerate(campus_courses):
        available_sections = get_all_sections(course, "S")
        if available_sections == []:
            continue
        print "%d. On Course: %s" % (i + 1, course.code)
        # new dept, get course info for this dept and store it in course_to_course_id
        if course.get_dept() != current_dept:
            if course.get_dept() not in department_to_dept_id:
                continue
            current_dept = course.get_dept()

            rest = "control=department&dept=%s&term=%s" % (department_to_dept_id[current_dept],
                                                           campus_info['term'])
            response = get_request(rest)
            course_soup = BeautifulSoup(response.text)
            soup_courses = course_soup.findAll('course')
            course_to_course_id = {}
            for soup_course in soup_courses:
                course_to_course_id[soup_course['name'][:-1]] = soup_course['id']

        if course.code not in course_to_course_id:
            continue
        # process this course - get section data and store it in section_to_section_id
        rest = "control=course&course=%s&term=%s" % (course_to_course_id[course.code],
                                                     campus_info['term'])
        response = get_request(rest)
        section_soup = BeautifulSoup(response.text)
        soup_sections = section_soup.findAll('section')
        section_to_section_id = {}
        for soup_section in soup_sections:
            section_to_section_id[soup_section['name']] = soup_section['id']

        # now use the sections actually available for this course in the DB
        for section in available_sections:
            # make section request, get textbook info and store it in DB
            if section not in section_to_section_id:
                continue
            print "\tSection:", section
            rest = "control=section&section=%s&t=%s" % (section_to_section_id[section],
                                                        int(time.time()))
            response = get_request(rest)
            parse_results('<div id="course-bookdisplay">' + response.text + '</div>')

    print "Finished processing textbooks for %s." % (campus_info['name'])

def start():
    # campus_id and term for each campus are retrieved from the requests sent at
    # http://uoftbookstore.com/buy_courselisting.asp
    campus_to_info_map = {
        'St. George': {
            'name': 'St. George',
            'ending': '1',
            'campus_id': '43',
            'term': '546'
        },
        'Scarborough': {
            'name': 'Scarborough',
            'ending': '3',
            'campus_id': '40',
            'term': '547'
        },
        'Mississauga': {
            'name': 'Mississauga',
            'ending': '5',
            'campus_id': '39',
            'term': '543'
        }
    }

    for campus in ["St. George", "Mississauga", "Scarborough"]:
        process_campus(campus_to_info_map[campus])

    print "Hooray! I'm done!"


if __name__ == "__main__":
    start()


