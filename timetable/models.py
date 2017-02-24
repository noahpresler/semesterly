import os
import re
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from django.forms.models import model_to_dict
from django.db import models


class Semester(models.Model):
  name = models.CharField(max_length=50)
  year = models.CharField(max_length=4)


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
  description = models.TextField(default='')
  notes = models.TextField(default='', null=True)
  info = models.TextField(default='', null=True)
  unstopped_description = models.TextField(default='')
  campus = models.CharField(max_length=300, default='')
  prerequisites = models.TextField(default='', null=True)
  corequisites = models.TextField(default='', null=True)
  exclusions = models.TextField(default='')
  num_credits = models.FloatField(default=-1)
  areas = models.CharField(max_length=600, default='', null=True)
  department = models.CharField(max_length=250, default='', null=True)
  level = models.CharField(max_length=30, default='', null=True)
  cores = models.CharField(max_length=50, null=True, blank=True)
  geneds = models.CharField(max_length=300, null=True, blank=True)
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

  def get_related_course_info(self, semester=None, limit=None):
    info = []
    related = self.related_courses.all()
    if semester:
      related = related.filter(section__sem_name__in=[semester.name, 'Y'],
                              section__year=semester.year).distinct()
    if limit and limit > 0:
      related = related[:limit]
    for c in related:
      info.append(model_to_dict(c, exclude=['related_courses', 'unstopped_description']))

    return info

  def get_eval_info(self):
    eval_info = map(model_to_dict, Evaluation.objects.filter(course=self))
    return sorted(eval_info, key=lambda eval: eval['year']) 

  def get_avg_rating(self):
    ratings = Evaluation.objects.only('course', 'score').filter(course=self)
    return sum([rating.score for rating in ratings])/len(ratings) if ratings else 0

  def get_textbooks(self, semester):
    textbooks = []
    isbns = set()
    for section in self.section_set.filter(sem_name__in=[semester.name, 'Y'], 
                                          year=semester.year):
      for textbook in section.textbooks.all():
        if textbook.isbn not in isbns:
          textbooks.append(textbook.get_info())
          isbns.add(textbook.isbn)

    return textbooks

  def get_course_integrations(self):
    ids = CourseIntegration.objects.filter(course__id=self.id).values_list("integration", flat=True)
    return Integration.objects.filter(id__in = ids).values_list("name", flat=True)


class Section(models.Model):
  course = models.ForeignKey(Course)
  meeting_section = models.CharField(max_length=50)
  size = models.IntegerField(default=-1)
  enrolment = models.IntegerField(default=-1)
  waitlist = models.IntegerField(default=-1)
  waitlist_size = models.IntegerField(default=-1)
  section_type = models.CharField(max_length=50, default='L')
  instructors = models.CharField(max_length=500, default='TBA')
  semester = models.CharField(max_length=2) # will evenutally be replaced by sem_name
  sem_name = models.CharField(max_length=50)
  year = models.CharField(max_length=4)
  textbooks = models.ManyToManyField(Textbook, through='TextbookLink')

  def get_textbooks(self):
    return [tb.get_info() for tb in self.textbooks.all()]

  def __unicode__(self):
    return "Course: %s; Section: %s; Semester: %s" % (str(self.course), self.meeting_section, self.semester)


class Offering(models.Model):
  section = models.ForeignKey(Section)
  day = models.CharField(max_length=1)
  time_start = models.CharField(max_length=15)
  time_end = models.CharField(max_length=15)
  location = models.CharField(max_length=200, default='TBA')

  def __unicode__(self):
    # return "Semester: %s, Section: %s, Time: %s" % (self.semester, self.meeting_section, self.time)
    return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)


class Evaluation(models.Model):
  course = models.ForeignKey(Course)
  score = models.FloatField(default=5.0)
  summary = models.TextField()
  professor = models.CharField(max_length=250)
  course_code = models.CharField(max_length=20)
  year = models.CharField(max_length=200)


class TextbookLink(models.Model):
  textbook = models.ForeignKey(Textbook)
  is_required = models.BooleanField(default=False)
  section = models.ForeignKey(Section)


class Integration(models.Model):
  name = models.CharField(max_length=250)


class CourseIntegration(models.Model):
  course = models.ForeignKey(Course)
  integration = models.ForeignKey(Integration)
  json = models.TextField()
