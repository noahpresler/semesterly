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
    """
    Stores the date/time that the school's data was last updated.
    This is updated when digestion into the database completes.

    Attributes: 
        school (CharField): the school code that was updated (e.g. jhu)
        update_field (CharField): which field was updated
        last_updated (DateTimeField): the datetime last updated
        reason (Charfield): the reason it was updated (default Scheduled Update)
    """
    school = models.CharField(max_length=100)
    update_field = models.CharField(max_length=100)  # e.g. 'textbook', 'course'
    last_updated = models.DateTimeField(auto_now=True)
    reason = models.CharField(max_length=200, default='Scheduled Update')


class Course(models.Model):
    """
    Represents a course at a school, made unique by its course code.
    Courses persist across semesters and years. Their presence in a semester or year
    is indicated by the existence of sections assigned to that course for that semester
    or year. This is why a course does not have fields like professor, those varies.

    The course model maintains only attributes which tend not to vary across semesters
    or years.

    A course has many :obj:`Section` which a student can enroll in.

    Attributes:
        school (:obj:`CharField`): the school code corresponding to the school for the course
        code (:obj:`CharField`): the course code without indication of section (E.g. EN.600.100)
        name (:obj:`CharField`): the general name of the course (E.g. Calculus I)
        description (:obj:`TextField`): the explanation of the content of the courzse
        notes (:obj:`TextField`, optional): usually notes pertaining to registration (e.g. Lab Fees)
        info (:obj:`TextField`, optional): similar to notes
        unstopped_description (:obj:`TextField`): automatically generated description without stopwords 
        campus (:obj:`CharField`, optional): an indicator for which campus the course is taught on
        prerequisites (:obj:`TextField`, optional): courses required before taking this course
        corequisites (:obj:`TextField`, optional): courses required concurrently with this course
        exclusions (:obj:`TextField`, optional): reasons why a student would not be able to take this
        num_credits (:obj:`FloatField`): the number of credit hours this course is worth
        areas (:obj:`CharField`): comma seperated list of all degree areas this course satisfies
        department (:obj:`CharField`): department offering course (e.g. Computer Science)
        level (:obj:`CharField`): indicator of level of course (e.g. 100, 200, Upper, Lower, Grad)
        cores (:obj:`CharField`): core areas satisfied by this course
        geneds (:obj:`CharField`): geneds satisfied by this course
        related_courses (:obj:`ManyToManyField` of :obj:`Course`, optional): courses computed similar to this course
        same_as (:obj:`ForeignKey`): If this course is the same as another course, provide Foreign key
    """
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

        **title**: the title of the reaction

        **count:** number of reactions with this title that this course has received

        **reacted:** True if the student provided has given a reaction with this title
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
        """
        Returns a list of dictionaries representing courses which are related to the 
        given course as judged by recommender.py. This is used on the course modal
        side bar to display slots for related courses.abs

        Args: 
            semester (Semester, optional): if provided, filters by courses offered that semester
            limit (int, optional): limits the number of related courses if provided
        Returns:
            (:obj:`list` of :obj:`dict`): list of dictionaries of courses
        """
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
        """
        Returns:
            (:obj:`list` of :obj:`dict`): list of dictionaries representing evaluations for a course, sorted by year.
        """
        eval_info = map(model_to_dict, Evaluation.objects.filter(course=self))
        return sorted(eval_info, key=itemgetter('year'))

    def get_avg_rating(self):
        """
        Calculates the avg rating for a course, 0 if no ratings. Includes all courses
        that are marked as the same by the self.same_as field on the model nstance.

        Returns:
            (:obj:`float`): the average course rating
        """
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
        """
        Returns:
            (:obj:`list` of :obj:`dict` representing :obj:`Textbook`): 
                list of dictionaries representing the textbooks for the course for a given semester
        """
        textbooks = []
        isbns = set()
        for section in self.section_set.filter(semester=semester):
            for textbook in section.textbooks.all():
                if textbook.isbn not in isbns:
                    textbooks.append(textbook.get_info())
                    isbns.add(textbook.isbn)

        return textbooks

    def get_course_integrations(self):
        """
        Returns: List of Integration names associated with this course
        """
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
    """
    Represents one (of possibly many) choice(s) for a student to enroll in a :obj:`Course` 
    for a specific semester. Since this model is specific to a semester, it contains 
    enrollment data, instructor information, textbooks, etc.

    A section can come in different forms. For example, a lecture which is required
    for every student. However, it can also be a tutorial or practical. During
    timetable generation we allow a user to select one of each, and we can automatically 
    choose the best combonation for a user as well.

    A section has many offerings related to it. For example, section 1 of a :obj:`Course` could
    have 3 offerings (one that meets each day: Monday, Wednesday, Friday). Section 2 of 
    a :obj:`Course` could have 3 other offerings (one that meets each: Tuesday, Thursday).

    Attributes:
        course (:obj:`Course`): The course this section belongs to
        meeting_section (:obj:`CharField`): the name of the section (e.g. 001, L01, LAB2)
        size (:obj:`IntegerField`): the capacity of the course (the enrollment cap)
        enrolment (:obj:`IntegerField`): the number of students registered so far
        waitlist (:obj:`IntegerField`): the number of students waitlisted so far
        waitlist_size (:obj:`IntegerField`): the max size of the waitlist
        section_type (:obj:`CharField`): 
            the section type, example 'L' is lecture, 'T' is tutorial, `P` is practical
        instructors (:obj:`CharField`): comma seperated list of instructors
        semester (:obj:`ForeignKey` to :obj:`Semester`): the semester for the section
        textbooks (:obj:`ManyToManyField` of :obj:`Textbook`):
            textbooks for this section via the :obj:`TextbookLink` model
        was_full (:obj:`BooleanField`): whether the course was full during the last parse
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
    _semester = models.CharField(max_length=2)  # deprecated
    textbooks = models.ManyToManyField(Textbook, through='TextbookLink')
    was_full = models.BooleanField(default=False)

    def get_textbooks(self):
        """
        Returns the textbook info using `tb.get_info()` for each textbook
        """
        return [tb.get_info() for tb in self.textbooks.all()]

    def __unicode__(self):
        return "Course: %s; Section: %s; Semester: %s" % (str(self.course), self.meeting_section, str(self.semester))


class Offering(models.Model):
    """
    An Offering is the most granular part of the Course heirarchy. An offering 
    may be looked at as the backend equivalent of a single slot on a timetable.
    For each day/time which a section meets, an offering is created.abs

    Attributes:
        section (:obj:`ForeignKey` to :obj:`Section`):
            the section which is the parent of this offering
        day (:obj:`CharField`): 
            the day the course is offered (single character M,T,W,R,F,S,U)
        time_start (:obj:`CharField`): 
            the time the slot starts in 24hrs time in the format (HH:MM) or (H:MM)
        time_end (:obj:`CharField`): 
            the time it ends in 24hrs time in the format (HH:MM) or (H:MM)
        location (:obj:`CharField`, optional):
            the location the course takes place, defaulting to TBA if not provided
    """
    section = models.ForeignKey(Section)
    day = models.CharField(max_length=1)
    time_start = models.CharField(max_length=15)
    time_end = models.CharField(max_length=15)
    location = models.CharField(max_length=200, default='TBA')

    def __unicode__(self):
        return "Day: %s, Time: %s - %s" % (self.day, self.time_start, self.time_end)


class Evaluation(models.Model):
    """
    A review of a course represented as a score out of 5, a summary/comment, along
    with the professor and year the review is in subject of.

    course (:obj:`ForeignKey` to :obj:`Course`):
        the course this evaluation belongs to
    score (:obj:`FloatField`): score out of 5.0
    summary (:obj:`TextField`): text with information about why the rating was given
    professor (:obj:`CharField`): the professor(s) this review pertains to
    year (:obj:`CharField`): the year of the review
    course_code (:obj:`Charfield`): a string of the course code, along with section indicator
    """
    course = models.ForeignKey(Course)
    score = models.FloatField(default=5.0)
    summary = models.TextField()
    professor = models.CharField(max_length=250)
    course_code = models.CharField(max_length=20)
    year = models.CharField(max_length=200)


class TextbookLink(models.Model):
    """
    This model serves as a ManyToMany link betwen a :obj:`Section`
    anda textbook. The reason for this additional model is because 
    the edge that connects a :obj:`Section` has a label which is 
    whether that textbook is required. Thus, a seperate model/table
    exists to link the two with this label.abs

    Attributes:
        textbook (:obj:`ForeignKey` to :obj:`Textbook`): the textbook
        is_required (:obj:`BooleanField`): whether or not the textbook is required
        section (:obj:`Section`): the section the textbook is linked to
    """
    textbook = models.ForeignKey(Textbook)
    is_required = models.BooleanField(default=False)
    section = models.ForeignKey(Section)


class Integration(models.Model):
    name = models.CharField(max_length=250)


class CourseIntegration(models.Model):
    course = models.ForeignKey(Course)
    integration = models.ForeignKey(Integration)
    json = models.TextField()
