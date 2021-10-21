# -*- coding: utf-8 -*-
# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'semesterly.settings'

from django.forms.models import model_to_dict
from django.db import models
from picklefield.fields import PickledObjectField
from django.contrib.postgres.fields import ArrayField


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
        return '{} {}'.format(self.name, self.year)

    def __str__(self):
        return '{} {}'.format(self.name, self.year)


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
    detail_url = models.URLField(max_length=1000, null=True)
    image_url = models.URLField(max_length=1000, null=True)
    author = models.CharField(max_length=500, null=True)
    title = models.CharField(max_length=1500, null=True)

    def get_info(self):
        return model_to_dict(self)


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
        vector (:obj:`PickleObjectField`): the vector representation of a course transformed from course vectorizer
    """
    school = models.CharField(db_index=True, max_length=100)
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    description = models.TextField(default='')
    notes = models.TextField(default='', null=True)
    info = models.TextField(default='', null=True)
    unstopped_description = models.TextField(default='')
    campus = models.CharField(max_length=300, default='')
    prerequisites = models.TextField(default='', null=True)
    corequisites = models.TextField(default='', null=True)
    exclusions = models.TextField(default='')
    num_credits = models.FloatField(default=-1)
    department = models.CharField(max_length=255, default='', null=True)
    level = models.CharField(max_length=500, default='', null=True)
    # TODO generalize core/gened/breadth field
    cores = models.CharField(max_length=50, null=True, blank=True)
    geneds = models.CharField(max_length=300, null=True, blank=True)
    related_courses = models.ManyToManyField('self', blank=True)
    same_as = models.ForeignKey('self', null=True, on_delete=models.deletion.CASCADE)
    vector = PickledObjectField(default=None, null=True)
    pos = ArrayField(models.TextField(default='', null=True), default=list)
    areas = ArrayField(models.TextField(default='', null=True), default=list)
    sub_school = models.TextField(default='', null=True)
    writing_intensive = models.TextField(default='', null=True)


    def __str__(self):
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

    def get_avg_rating(self):
        """
        Calculates the avg rating for a course, -1 if no ratings. Includes all courses
        that are marked as the same by the self.same_as field on the model nstance.

        Returns:
            (:obj:`float`): the average course rating
        """
        ratings_sum, ratings_count = self._get_ratings_sum_count()
        if self.same_as:  # include ratings for equivalent courses in the average
            eq_sum, eq_count = self.same_as._get_ratings_sum_count()
            ratings_sum += eq_sum
            ratings_count += eq_count
        return (ratings_sum / ratings_count) if ratings_count else -1

    def _get_ratings_sum_count(self):
        """ Return the sum and count of ratings of this course not counting equivalent courses. """
        ratings = Evaluation.objects.only('course', 'score').filter(course=self)
        return sum([rating.score for rating in ratings]), len(ratings)

    def __unicode__(self):
        return u'%s' % (self.name)


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
    course = models.ForeignKey(Course, on_delete=models.deletion.CASCADE)
    meeting_section = models.CharField(max_length=50)
    size = models.IntegerField(default=-1)
    enrolment = models.IntegerField(default=-1)
    waitlist = models.IntegerField(default=-1)
    waitlist_size = models.IntegerField(default=-1)
    section_type = models.CharField(max_length=50, default='L')
    instructors = models.CharField(max_length=500, default='TBA')
    semester = models.ForeignKey(Semester, on_delete=models.deletion.CASCADE)
    textbooks = models.ManyToManyField(Textbook, through='TextbookLink')
    was_full = models.BooleanField(default=False)
    course_section_id = models.IntegerField(default=0)

    def get_textbooks(self):
        """ Returns the textbook info using `tb.get_info()` for each textbook """
        return [tb.get_info() for tb in self.textbooks.all()]

    def is_full(self):
        return self.enrolment >= 0 and self.size >= 0 and self.enrolment >= self.size

    def __str__(self):
        return "Course: {0}; Section: {0}; Semester: {0}".format(self.course, self.meeting_section, self.semester)

    def __unicode__(self):
        return "Course: %s; Section: %s; Semester: %s" % (self.course, self.meeting_section, self.semester)


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
    section = models.ForeignKey(Section, on_delete=models.deletion.CASCADE)
    day = models.CharField(max_length=1)
    date_start = models.CharField(max_length=15, null=True)
    date_end = models.CharField(max_length=15, null=True)
    time_start = models.CharField(max_length=15)
    time_end = models.CharField(max_length=15)
    location = models.CharField(max_length=200, default='TBA')
    is_short_course = models.BooleanField(default=False)

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
    course = models.ForeignKey(Course, on_delete=models.deletion.CASCADE)
    score = models.FloatField(default=5.0)
    summary = models.TextField()
    professor = models.CharField(max_length=255)
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
    textbook = models.ForeignKey(Textbook, on_delete=models.deletion.CASCADE)
    is_required = models.BooleanField(default=False)
    section = models.ForeignKey(Section, on_delete=models.deletion.CASCADE)


class Integration(models.Model):
    name = models.CharField(max_length=255)


class CourseIntegration(models.Model):
    course = models.ForeignKey(Course, on_delete=models.deletion.CASCADE)
    integration = models.ForeignKey(Integration, on_delete=models.deletion.CASCADE)
    json = models.TextField()
    semester = models.ManyToManyField(Semester)


class Timetable(models.Model):
    courses = models.ManyToManyField(Course)
    sections = models.ManyToManyField(Section)
    semester = models.ForeignKey(Semester, on_delete=models.deletion.CASCADE)
    school = models.CharField(max_length=50)

    class Meta:
        abstract = True