def sections_are_filled(sections):
    return all(section.enrolment >= section.size for section in sections)