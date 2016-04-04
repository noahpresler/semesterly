import abc
import time
import progressbar

class BaseParser:
  __metaclass__ = abc.ABCMeta

  def __init__(self, course_model, offering_model, entry_url, semester, driver):
    self.update_or_create_course = course_model.objects.update_or_create
    self.update_or_create_offering = offering_model.objects.update_or_create
    self.semesters = semester
    self.num_courses = None

  def parse_courses(self):
    """Update database with courses and offerings for given semester."""
    max_val = self.num_courses or progressbar.UnknownLength
    bar = progressbar.ProgressBar(max_value=max_val)
    for i, course_element in enumerate(self.get_course_elements()):
      self.parse_and_save_course(course_element)
      bar.update(i)

  def parse_and_save_course(self, course_element):
    """
    Update database with new course and its offerings corresponding to the given
    bs4 element.
    """
    course_code, course_data = self.parse_course_element(course_element)
    if course_code:
      course_obj, created = self.update_or_create_course(code=course_code,
                                                        defaults=course_data)
      for section_element in self.get_section_elements(course_element):
        self.parse_and_save_section(section_element, course_obj)

  def parse_and_save_section(self, section_element, course_obj):
    """
    Update database with new section and its offerings corresponding to the given
    bs4 element and django course object.
    """
    section_code, section_data = self.parse_section_element(section_element)
    if section_code:
      for meeting_element in self.get_meeting_elements(section_element):
        self.parse_and_save_meeting(meeting_element, section_data, section_code, 
                                    course_obj)

  def parse_and_save_meeting(self, meeting_element, section_data, section_code, 
                                    course_obj):
    """
    Update database with new offering corresponding to the given bs4 element 
    and other data.
    """
    meeting_data = self.parse_meeting_element(meeting_element)
    if meeting_data:
      meeting_data.update(section_data)
      self.update_or_create_offering(course=course_obj,
                                      semester=self.semester,
                                      meeting_section=section_code,
                                      defaults=meeting_data)

  @abc.abstractmethod
  def get_course_elements(self):
    """
    Return a generator of bs4 elements each corresponding to a single course.
    Optionally, set self.num_courses to the number of courses to be parsed
    (if known before hand) to enable progress bar display.
    """

  @abc.abstractmethod
  def parse_course_element(self, course_element):
    """
    Take a bs4 element corresponding to a course, and return the course code
    for the course, and a dictionary of any other attributes to be saved from
    that course. The keys of the dictionary should match the column names in
    the model for the course (e.g. name, description). If invalid data, return
    None, None
    """

  @abc.abstractmethod
  def get_section_elements(self, course_element):
    """
    Return a generator of bs4 elements corresponding to the sections of the
    given course.
    """

  @abc.abstractmethod
  def parse_section_element(self, section_element):
    """
    Take a bs4 element corresponding to a section, and return the section code
    for the section, and a dictionary of any other attributes to be saved from
    that section. The keys of the dictionary should match the column names in
    the model for the section (e.g. instructors, section_type). If invalid
    data, return None, None
    """

  @abc.abstractmethod
  def get_meeting_elements(self, section_element):
    """
    Return a generator of bs4 elements corresponding to the meetings of the
    given section.
    """

  @abc.abstractmethod
  def parse_meeting_element(self, meeting_element):
    """
    Take a bs4 element corresponding to a meeting, and return a dictionary 
    of attributes to be saved from that meeting. The keys of the dictionary 
    should match the column names in the model for the section (e.g. day, 
    time_start, time_end, location, etc.). If invalid data, return None.
    """

