def sections_are_filled(sections):
    """
    Checks if all sections are filled beyond their maximum enrollment.
    """
    return all(section.enrolment >= section.size for section in sections)