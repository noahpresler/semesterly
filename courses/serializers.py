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

import re

from django.forms import model_to_dict
from django.db import models
from rest_framework import serializers

from timetable.models import (
    Course,
    Section,
    Evaluation,
    Semester,
)
from . import utils


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = "__all__"


class CourseSearchSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()

    def get_sections(self, course):
        return [
            SectionSerializer(section).data
            for section in course.section_set.filter(semester=self.context["semester"])
        ]

    class Meta:
        model = Course
        fields = fields = (
            "id",
            "code",
            "name",
            "sections",
        )


class CourseSerializer(serializers.ModelSerializer):
    """
    Serialize a Course into a dictionary with detailed information about the course, and
    all related entities (eg Sections). Used for search results and course modals.

    Takes a context with parameters:
    school: str (required)
    semester: Semester (required)
    student: Student (optional)
    """

    evals = serializers.SerializerMethodField()
    related_courses = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    regexed_courses = serializers.SerializerMethodField()
    popularity_percent = serializers.SerializerMethodField()
    is_waitlist_only = serializers.SerializerMethodField()

    sections = serializers.SerializerMethodField()

    def get_evals(self, course):
        """
        Append all eval instances with a flag designating whether there exists another eval for the course with the same term+year values.
        Returns:
          List of modified evaluation dictionaries (added flag 'unique_term_year')
        """
        evals = list(
            map(
                model_to_dict, Evaluation.objects.filter(course=course).order_by("year")
            )
        )
        years = (
            Evaluation.objects.filter(course=course)
            .values("year")
            .annotate(models.Count("id"))
            .filter(id__count__gt=1)
            .values_list("year")
        )
        years = {e[0] for e in years}
        for course_eval in evals:
            course_eval["unique_term_year"] = course_eval["year"] not in years
        return evals

    def get_related_courses(self, course):
        related = course.related_courses.filter(
            section__semester=self.context["semester"]
        ).distinct()[:5]
        return [
            model_to_dict(course, exclude=["related_courses", "unstopped_description"])
            for course in related
        ]

    def get_reactions(self, course):
        return course.get_reactions(self.context.get("student"))

    def get_regexed_courses(self, course):
        """
        Given course data, search for all occurrences of a course code in the course
        description and prereq info and return a map from course code to course name for
        each course code.
        """
        school_to_course_regex = {
            "jhu": r"([A-Z]{2}\.\d{3}\.\d{3})",
            "uoft": r"([A-Z]{3}[A-Z0-9]\d{2}[HY]\d)",
            "vandy": r"([A-Z-&]{2,7}\s\d{4}[W]?)",
            "gw": r"([A-Z]{2,5}\s\d{4}[W]?)",
            "umich": r"([A-Z]{2,8}\s\d{3})",
            "chapman": r"([A-Z]{2,4}\s\d{3})",
            "salisbury": r"([A-Z]{3,4} \d{2,3})",
        }
        course_code_to_name = {}
        if self.context["school"] in school_to_course_regex:
            course_code_matches = re.findall(
                school_to_course_regex[self.context["school"]],
                course.description + course.prerequisites,
            )

            courses = Course.objects.filter(school=self.context["school"])
            for course_code in course_code_matches:
                try:
                    course = courses.filter(code__icontains=course_code).get()
                    course_code_to_name[course_code] = course.name
                except (Course.DoesNotExist, Course.MultipleObjectsReturned):
                    pass
        return course_code_to_name

    def get_popularity_percent(self, course):
        """Return percentage of course capacity that is filled by registered
        students.
        """
        tts_with_course = course.personaltimetable_set.filter(
            semester=self.context["semester"]
        )
        num_students_in_course = tts_with_course.values("student").distinct().count()
        # print("num students: " + str(num_students_in_course))
        sections = course.section_set.filter(semester=self.context["semester"])
        course_capacity = (
            sum(sections.values_list("size", flat=True)) if sections else 0
        )
        return num_students_in_course / float(course_capacity) if course_capacity else 0

    def get_is_waitlist_only(self, course):
        return utils.is_waitlist_only(course, self.context["semester"])

    def get_sections(self, course):
        return [
            SectionSerializer(section).data
            for section in course.section_set.filter(semester=self.context["semester"])
        ]

    class Meta:
        model = Course
        fields = (
            "code",
            "name",
            "id",
            "description",
            "department",
            "num_credits",
            "areas",
            "campus",
            "evals",
            "related_courses",
            "reactions",
            "regexed_courses",
            "popularity_percent",
            "sections",
            "prerequisites",
            "exclusions",
            "corequisites",
            "areas",
            "is_waitlist_only",
            "pos",
            "writing_intensive",
            "sub_school",
        )


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = (
            "id",
            "meeting_section",
            "size",
            "enrolment",
            "waitlist",
            "waitlist_size",
            "section_type",
            "instructors",
            "semester",
            "offering_set",
            "course_section_id",
        )
        depth = 1  # also serializer offerings


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        fields = "__all__"
        model = Semester


def get_section_dict(section):
    """Returns a dictionary of a section including indicator of whether that section is
    filled"""
    section_data = model_to_dict(section)
    section_data["is_section_filled"] = section.is_full()
    return section_data
