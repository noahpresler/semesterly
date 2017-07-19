"""
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
"""

import itertools

from django.forms import model_to_dict
from rest_framework import serializers

from timetable.models import Course


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer which generates a representation of a course including:
    code, name, id, description, department, num_credits, areas, campus
    """
    class Meta:
        model = Course
        fields = ('code', 'name', 'id', 'description', 'department', 'num_credits', 'areas', 'campus')


def get_detailed_course_json(school, course, sem, student=None):
    """
    Generates a detailed course json by adding to the basic course json. 
    Adds evaluations, related courses, reactions, textbooks, integrations, 
    regexed courses, and popularity percentage.
    """
    json_data = get_basic_course_json(course, sem, ['prerequisites', 'exclusions', 'areas'])
    json_data['eval_info'] = course.eval_add_unique_term_year_flag()
    json_data['related_courses'] = course.get_related_course_info(sem, limit=5)
    json_data['reactions'] = course.get_reactions(student)
    json_data['textbooks'] = course.get_textbooks(sem)
    json_data['integrations'] = list(course.get_course_integrations())
    json_data['regexed_courses'] = course.get_regexed_courses(school)
    json_data['popularity_percent'] = course.get_percentage_enrolled(sem)
    return json_data


def get_basic_course_json(course, sem, extra_model_fields=None):
    """
    Converts course to dictionary using only basic fields unless 
    additional fields are provided. 

    Basic fields: code, name, id, description, department, num_credits, areas, campus

    Includes mapping from section type (L, T, P) to the sections of that type.
    """
    extra_model_fields = extra_model_fields or []
    basic_fields = 'code name id description department num_credits areas campus'.split()
    course_json = model_to_dict(course, basic_fields + extra_model_fields)
    course_json['evals'] = course.get_eval_info()
    course_json['integrations'] = list(course.get_course_integrations())
    course_json['sections'] = {}

    course_section_list = sorted(course.section_set.filter(semester=sem),
                                 key=lambda section: section.section_type)

    # TODO: flatten dictionary with one key
    for section_type, sections in itertools.groupby(course_section_list, lambda s: s.section_type):
        course_json['sections'][section_type] = {
            section.meeting_section: get_section_offerings(section) for section in sections
        }

    return course_json


def get_section_offerings(section):
    """ Return a list of model dicts of each offering of a section. """
    return [dict(model_to_dict(co), **model_to_dict(section)) for co in section.offering_set.all()]


def get_section_dict(section):
    """
    Returns a dictionary of a section including indicator of whether that section is filled
    """
    section_data = model_to_dict(section)
    section_data['is_section_filled'] = section.enrolment >= section.size
    return section_data


def augment_course_dict(course_dict, sections):
    """
    Augments a course dictioanry with enrolled sections, textbooks and slots.
    """
    sections = list(sections)
    slot_objects = [dict(get_section_dict(section), **model_to_dict(co))
                    for _, section, course_offerings in sections
                    for co in course_offerings]
    course_dict['enrolled_sections'] = [section.meeting_section for _, section, _ in sections]
    course_dict['textbooks'] = {section.meeting_section: section.get_textbooks() for _, section, _ in sections}
    course_dict['slots'] = slot_objects
    return course_dict