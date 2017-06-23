import itertools
from operator import attrgetter


def is_waitlist_only(course, semester):
    return any(sections_are_filled(sections)
               for _, sections in get_sections_by_section_type(course, semester).iteritems())

def get_sections_by_section_type(course, semester):
    """ Return a map from section type to Sections for a given course and semester. """
    sections = course.section_set.filter(semester=semester).order_by('section_type')
    return {section_type: list(grouped)
            for (section_type, grouped) in itertools.groupby(sections, attrgetter('section_type'))}

def sections_are_filled(sections):
    return all(section.is_full() for section in sections)