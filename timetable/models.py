import os
import re
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from django.forms.models import model_to_dict
from django.db import models


#----------- Global Models  ----------------
class Textbook(models.Model):
  isbn = models.BigIntegerField(primary_key=True)
  detail_url = models.URLField(max_length=1000)
  image_url = models.URLField(max_length=1000)
  author = models.CharField(max_length=500)
  title = models.CharField(max_length=1500)

  def get_info(self):
    return model_to_dict(self)

class Updates(models.Model):
  school = models.CharField(max_length=100)
  update_field = models.CharField(max_length=100) #e.g. 'textbook', 'course'
  last_updated = models.DateTimeField(auto_now=True)
  reason = models.CharField(max_length=200, default='Scheduled Update')


class Course(models.Model):
  school = models.CharField(db_index=True, max_length=100)
  code = models.CharField(max_length=20)
  name = models.CharField(max_length=250)
  description = models.TextField(max_length=1500, default='')
  unstopped_description = models.TextField(max_length=1500, default='')
  campus = models.TextField(max_length=300, default='')
  prerequisites = models.TextField(max_length=1000, default='')
  exclusions = models.TextField(max_length=1000, default='')
  num_credits = models.FloatField(default=-1)
  areas = models.CharField(max_length=300, default='', null=True)
  department = models.CharField(max_length=250, default='', null=True)
  level = models.CharField(max_length=30, default='', null=True)
  cores = models.CharField(max_length=50, null=True, blank=True)
  geneds = models.CharField(max_length=50, null=True, blank=True)
  related_courses = models.ManyToManyField("self", blank=True)

  def __unicode__(self):
    return self.code + ": " + self.name

  def get_reactions(self, student=None):
    result = list(self.reaction_set.values('title') \
      .annotate(count=models.Count('title')).distinct().all())
    if not student:
      return result
    for i, r in enumerate(result):
      result[i]['reacted'] = self.reaction_set.filter(student=student,title=r['title']).exists()
    return result

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

class Section(models.Model):
  course = models.ForeignKey(Course)
  name = models.CharField(max_length=50)
  size = models.IntegerField(default=-1)
  enrolment = models.IntegerField(default=-1)
  waitlist = models.IntegerField(default=0)
  section_type = models.CharField(max_length=50, default='L')
  instructors = models.CharField(max_length=500, default='TBA')
  semester = models.CharField(max_length=2)

class Offering(models.Model):
  section = models.ForeignKey(Section)
  day = models.CharField(max_length=1)
  time_start = models.CharField(max_length=15)
  time_end = models.CharField(max_length=15)
  location = models.CharField(max_length=200, default='TBA')


  def get_textbooks(self):
    textbooks = []
    temp = []
    tbs = self.textbooks.all()
    for tb in tbs:
      textbooks.append(tb.get_info())
    return textbooks

  def __unicode__(self):
    # return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
    return "Day: %s, Time: %s - %s" % (self.day, self.start_time, self.end_time)


class Evaluation(models.Model):
  course = models.ForeignKey(Course)
  score = models.FloatField(default=5.0)
  summary = models.TextField(max_length=1500)
  professor = models.CharField(max_length=250)
  course_code = models.CharField(max_length=20)
  year = models.CharField(max_length=200)



class TextbookLink(models.Model):
  textbook = models.ForeignKey(Textbook)
  is_required = models.BooleanField(default=False)
  section = models.ForeignKey(Section)
  