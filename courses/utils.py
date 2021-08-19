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

import itertools
from operator import attrgetter


def is_waitlist_only(course, semester):
    return any(sections_are_filled(sections)
               for _, sections in get_sections_by_section_type(course, semester).items())

def get_sections_by_section_type(course, semester):
    """ Return a map from section type to Sections for a given course and semester. """
    sections = course.section_set.filter(semester=semester).order_by('section_type')
    return {section_type: list(grouped)
            for (section_type, grouped) in itertools.groupby(sections, attrgetter('section_type'))}

def sections_are_filled(sections):
    """ Return True if all sections are filled beyond their max enrollment. """
    return all(section.is_full() for section in sections)