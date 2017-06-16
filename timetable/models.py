import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'

from django.forms.models import model_to_dict
from django.db import models


class Semester(models.Model):
    name = models.CharField(max_length=50)
    year = models.CharField(max_length=4)

    def __unicode__(self):
        return "%s %s" % (self.name, self.year)


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

    def __str__(self):
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

    def get_avg_rating(self):
        ratings_sum, ratings_count = self._get_ratings_sum_count()
        if self.same_as:  # include ratings for equivalent courses in the average
            eq_sum, eq_count = self.same_as._get_ratings_sum_count()
            ratings_sum += eq_sum
            ratings_count += eq_count
        return (ratings_sum / ratings_count) if ratings_count else 0

    def _get_ratings_sum_count(self):
        """ Return the sum and count of ratings of this course not counting equivalent courses. """
        ratings = Evaluation.objects.only('course', 'score').filter(course=self)
        return sum([rating.score for rating in ratings]), len(ratings)


class Section(models.Model):
    """
    Represents a possible lecture/tutorial/etc. of a Course.
    Attributes:
        course: Course that this Section belongs to
        meeting_section: an ID unique among other Sections for this Section's Course
        size: max number of students that can be enrolled in this Section
        enrolment: number of students currently enrolled
        waitlist: number of students currently on the waitlist (should be 0 if size <= enrolment)
        waitlist_size: max number of students that can be on the waitlist
        section_type: category of this section, e.g. lecture, tutorial, practical, etc.
        instructors: comma separated list of instructors
        semester: Semester that this section is offered in
        textbooks: Textbooks required for this section
        was_full: True if this section was full at some point. Used for the mailing list
    """
    course = models.ForeignKey(Course)
    meeting_section = models.CharField(max_length=50)
    size = models.IntegerField(default=-1)
    enrolment = models.IntegerField(default=-1)
    waitlist = models.IntegerField(default=-1)
    waitlist_size = models.IntegerField(default=-1)
    section_type = models.CharField(max_length=50, default='L')
    instructors = models.CharField(max_length=500, default='TBA')
    semester = models.ForeignKey(Semester)
    textbooks = models.ManyToManyField(Textbook, through='TextbookLink')
    was_full = models.BooleanField(default=False)

    def get_textbooks(self):
        return [tb.get_info() for tb in self.textbooks.all()]

    def is_full(self):
        return self.enrolment >= 0 and self.size >= 0 and self.enrolment >= self.size

    def __str__(self):
        return "Course: {0}; Section: {0}; Semester: {0}".format(self.course, self.meeting_section,
                                                                 self.semester)


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


class Timetable(models.Model):
    courses = models.ManyToManyField(Course)
    sections = models.ManyToManyField(Section)
    semester = models.ForeignKey(Semester)
    school = models.CharField(max_length=50)

    class Meta:
        abstract = True
