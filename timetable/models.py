import os
import re
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from django.forms.models import model_to_dict
from django.db import models


class Textbook(models.Model):
  isbn = models.CharField(max_length=13)
  is_required = models.BooleanField(default=False)
  detail_url = models.URLField(max_length=1000)
  image_url = models.URLField(max_length=1000)
  author = models.CharField(max_length=500)
  title = models.CharField(max_length=1500)

  def get_info(self):
    return model_to_dict(self)

class HopkinsTextbook(models.Model):
  isbn = models.CharField(max_length=13)
  is_required = models.BooleanField(default=False)
  detail_url = models.URLField(max_length=1000)
  image_url = models.URLField(max_length=1000)
  author = models.CharField(max_length=500)
  title = models.CharField(max_length=1500)

  def get_info(self):
    return model_to_dict(self)


#----------- Abstract Models  ----------------
class BaseCourse(models.Model):
  code = models.CharField(max_length=20)
  name = models.CharField(max_length=250)
  description = models.TextField(max_length=1500, default='')
  unstopped_description = models.TextField(max_length=1500, default='')
  campus = models.TextField(max_length=300, default='')
  prerequisites = models.TextField(max_length=1000, default='')
  exclusions = models.TextField(max_length=1000, default='')
  
  def __unicode__(self):
    return self.code + ": " + self.name

  def get_related_course_info(self):
    info = []
    related = self.related_courses.all()
    for c in related:
      info.append(model_to_dict(c))
    return info

  def base_get_all_textbook_info(self, co_model):
    textbook_info = []
    for co in co_model.objects.filter(course=self):
      tb = {
      "section" : co.meeting_section,
      "textbooks" : co.get_textbooks()
      }
      textbook_info.append(tb)
    final = []
    for i in textbook_info:
      if not any(d['section'] == i['section'] for d in final):
        final.append(i)
    return final

  def base_get_eval_info(self, eval_model):
    eval_info = []
    evals = eval_model.objects.filter(course=self)
    for e in evals:
      eval_info.append(model_to_dict(e))
    final = []
    for i in eval_info:
      if not any(d['year'] == i['year'] for d in final):
        final.append(i)
    return sorted(final, key=lambda k: k['year']) 

  class Meta:
    abstract = True


class BaseCourseOffering(models.Model):
  semester = models.CharField(max_length=2)
  meeting_section = models.CharField(max_length=20)
  instructors = models.CharField(max_length=100, default='TBA')
  day = models.CharField(max_length=1)
  time_start = models.CharField(max_length=15)
  time_end = models.CharField(max_length=15)
  location = models.CharField(max_length=200, default='TBA')
  size = models.IntegerField(default=-1)
  enrolment = models.IntegerField(default=-1)
  # if no section_type is specified, we assume it's a lecture
  section_type = models.CharField(max_length=5, default='L')

  def get_textbooks(self):
    textbooks = []
    temp = []
    tbs = self.textbooks.all()
    for tb in tbs:
      textbooks.append(tb.get_info())
    return textbooks

  def __unicode__(self):
    # return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
    return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)

  def get_evaluations(self):
    return self.course.get_eval_info()

  class Meta:
    abstract = True


class BaseCourseEvaluation(models.Model):
  score = models.FloatField(default=5.0)
  summary = models.TextField(max_length=1500)
  professor = models.CharField(max_length=250)
  course_code = models.CharField(max_length=20)
  year = models.CharField(max_length=200)

  class Meta:
    abstract = True

#-----------------------  University of Toronto ------------------------------
class Course(BaseCourse):
  """Uoft Course object"""
  # a course may have multiple breadths - each character represents one
  breadths = models.CharField(max_length=5, default='')
  related_courses = models.ManyToManyField("self", blank=True)
  textbooks = models.ManyToManyField(Textbook)

  def get_dept(self):
    return self.code[:3]

  def get_dept_matches(self):
    department = self.get_dept()
    return Course.objects.filter(code__contains=department)

  def get_all_textbook_info(self):
    return self.base_get_all_textbook_info(CourseOffering)

  def get_eval_info(self):
    return [] # TODO

  def get_breadths(self):
    return map(int, sorted(self.breadths))


class CourseOffering(BaseCourseOffering):
  """Uoft CourseOffering"""
  course = models.ForeignKey(Course)
  alternates = models.BooleanField(default=False)


#---------------------- John Hopkins University ----------------------------
class HopkinsCourse(BaseCourse):
  related_courses = models.ManyToManyField("self", blank=True)
  textbooks = models.ManyToManyField(HopkinsTextbook)

  def get_dept(self):
    pass

  def get_dept_matches(self):
    code_pattern = re.compile(r"(.*\..*)\.(.*)")
    department = re.search(code_pattern, self.code).group(1)
    return HopkinsCourse.objects.filter(code__contains=department)

  def get_all_textbook_info(self):
    return self.base_get_all_textbook_info(HopkinsCourseOffering)

  def get_eval_info(self):
    return self.base_get_eval_info(HopkinsCourseEvaluation)


class HopkinsCourseEvaluation(BaseCourseEvaluation):
	course = models.ForeignKey(HopkinsCourse)


class HopkinsCourseOffering(BaseCourseOffering):
  course = models.ForeignKey(HopkinsCourse)

  def get_course_code(self):
    return self.course.code + self.meeting_section

  def get_course_tag(self):
    return '<course dept="' + self.get_dept().strip() + '" num="' + self.get_course().strip() + '" sect="' + self.get_section().strip() + '" term="W16"/>'

  def get_dept(self):
    code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
    matches = re.search(code_pattern,self.get_course_code())
    return str(matches.group(1))

  def get_course(self):
    code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
    matches = re.search(code_pattern,self.get_course_code())
    return str(matches.group(2))

  def get_section(self):
    code_pattern = pattern = re.compile(r".*\.(.*)\.(.*)\s\((.*)\)")
    matches = re.search(code_pattern,self.get_course_code())
    return str(matches.group(3))


  def __unicode__(self):
    # return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
    return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)
