import re
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'
from operator import itemgetter

from django.forms.models import model_to_dict
from django.db import models
from django.db.models import Count


class Semester(models.Model):
    """
    Represents a semester which is composed of a name (e.g. Spring, Fall)
    and a year (e.g. 2017). 

    Attributes:
        name (CharField): the name (e.g. Spring, Fall)
        year (CharField): the year (e.g. 2017, 2018)
    """
    name = models.CharField(max_length=50)
    year = models.CharField(max_length=4)

    def __unicode__(self):
        return "%s %s" % (self.name, self.year)


class Textbook(models.Model):
    """
    A textbook which is associated with sections of courses. Stores 
    information from the Amazon product API including a detail url
    and ISBN.

    Attributes:
        isbn (BigIntegerField): the primary (unique) key ISBN number
        detail_url (URLField): url to the detail page on Amazon.com
        image_url (URLField): url to product image hosted on Amazon.com
        author (CharField): authors first and last name
        title (CharField): the title of the book
    """
    isbn = models.BigIntegerField(primary_key=True)
    detail_url = models.URLField(max_length=1000)
    image_url = models.URLField(max_length=1000)
    author = models.CharField(max_length=500)
    title = models.CharField(max_length=1500)

    def get_info(self):
        return model_to_dict(self)


class Updates(models.Model):
    school = models.CharField(max_length=100)
    update_field = models.CharField(max_length=100)  # e.g. 'textbook', 'course'
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
    same_as = models.ForeignKey('self', null=True)

    def __unicode__(self):
        return self.code + ": " + self.name

    def get_reactions(self, student=None):
        """
        Return a list of dicts for each type of reaction (by title) for this course. Each dict has:
        title: the title of the reaction
        count: number of reactions with this title that this course has received
        reacted: True if the student provided has given a reaction with this title
        """
        result = list(self.reaction_set.values('title') \
                      .annotate(count=models.Count('title')).distinct().all())
        if not student:
            return result
        # TODO: rewrite as a single DB query
        for i, reaction in enumerate(result):
            result[i]['reacted'] = self.reaction_set.filter(student=student,
                                                            title=reaction['title']).exists()
        return result

    def get_related_course_info(self, semester=None, limit=None):
        info = []
        related = self.related_courses.all()
        if semester:
            related = related.filter(section__semester=semester).distinct()
        if limit and limit > 0:
            related = related[:limit]
        for course in related:
            info.append(model_to_dict(course, exclude=['related_courses', 'unstopped_description']))
        return info

    def get_eval_info(self):
        eval_info = map(model_to_dict, Evaluation.objects.filter(course=self))
        return sorted(eval_info, key=itemgetter('year'))

    def get_avg_rating(self):
        ratings_sum, ratings_count = self._get_ratings_sum_count()
        if self.same_as: # include ratings for equivalent courses in the average
            eq_sum, eq_count = self.same_as._get_ratings_sum_count()
            ratings_sum += eq_sum
            ratings_count += eq_count
        return (ratings_sum / ratings_count) if ratings_count else 0

    def _get_ratings_sum_count(self):
        """ Return the sum and count of ratings of this course not counting equivalent courses. """
        ratings = Evaluation.objects.only('course', 'score').filter(course=self)
        return sum([rating.score for rating in ratings]), len(ratings)

    def get_textbooks(self, semester):
        textbooks = []
        isbns = set()
        for section in self.section_set.filter(semester=semester):
            for textbook in section.textbooks.all():
                if textbook.isbn not in isbns:
                    textbooks.append(textbook.get_info())
                    isbns.add(textbook.isbn)

        return textbooks

    def get_course_integrations(self):
        ids = CourseIntegration.objects.filter(course__id=self.id).values_list("integration",
                                                                               flat=True)
        return Integration.objects.filter(id__in=ids).values_list("name", flat=True)

    def eval_add_unique_term_year_flag(self):
        """
        Flag all eval instances s.t. there exists repeated term+year values.
        Return:
          List of modified evaluation dictionaries (added flag 'unique_term_year')
        """
        evals = self.get_eval_info()
        years = Evaluation.objects.filter(course=self).values('year').annotate(Count('id'))\
            .filter(id__count__gt=1).values_list('year')
        years = {e[0] for e in years}
        for course_eval in evals:
            course_eval['unique_term_year'] = not course_eval['year'] in years
        return evals

    def get_percentage_enrolled(self, sem):
        """ Return percentage of course capacity that is filled. """
        tts_with_course = self.personaltimetable_set.filter(semester=sem)
        num_students_in_course = tts_with_course.values('student').distinct().count()
        sections = self.section_set.filter(semester=sem)
        course_capacity = sum(sections.values_list('size', flat=True)) if sections else 0
        return num_students_in_course / float(course_capacity) if course_capacity else 0

    def get_regexed_courses(self, school):
        """
        Given course data, search for all occurrences of a course code in the course description and
        prereq info and return a map from course code to course name for each course code.
        """
        school_to_course_regex = {
            'jhu': r'([A-Z]{2}\.\d{3}\.\d{3})',
            'uoft': r'([A-Z]{3}[A-Z0-9]\d{2}[HY]\d)',
            'vandy': r'([A-Z-&]{2,7}\s\d{4}[W]?)',
            'gw': r'([A-Z]{2,5}\s\d{4}[W]?)',
            'umich': r'([A-Z]{2,8}\s\d{3})',
            'chapman': r'([A-Z]{2,4}\s\d{3})',
            'salisbury': r'([A-Z]{3,4} \d{2,3})',
        }
        course_code_to_name = {}
        if school in school_to_course_regex:
            course_code_matches = re.findall(school_to_course_regex[school],
                                             self.description + self.prerequisites)
            # TODO: get all course objects in one db access
            for course_code in course_code_matches:
                try:
                    course = Course.objects.get(school=school, code__icontains=course_code)
                    course_code_to_name[course_code] = course.name
                except (Course.DoesNotExist, Course.MultipleObjectsReturned):
                    pass
        return course_code_to_name


class Section(models.Model):
  course = models.ForeignKey(Course)
  meeting_section = models.CharField(max_length=50)
  size = models.IntegerField(default=-1)
  enrolment = models.IntegerField(default=-1)
  waitlist = models.IntegerField(default=-1)
  waitlist_size = models.IntegerField(default=-1)
  section_type = models.CharField(max_length=50, default='L')
  instructors = models.CharField(max_length=500, default='TBA')
  semester = models.ForeignKey(Semester)
  _semester = models.CharField(max_length=2)  # deprecated
  textbooks = models.ManyToManyField(Textbook, through='TextbookLink')
  was_full = models.BooleanField(default=False)

  def get_textbooks(self):
    return [tb.get_info() for tb in self.textbooks.all()]

  def __unicode__(self):
    return "Course: %s; Section: %s; Semester: %s" % (str(self.course), self.meeting_section, str(self.semester))


class Offering(models.Model):
    section = models.ForeignKey(Section)
    day = models.CharField(max_length=1)
    time_start = models.CharField(max_length=15)
    time_end = models.CharField(max_length=15)
    location = models.CharField(max_length=200, default='TBA')

    def __unicode__(self):
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
