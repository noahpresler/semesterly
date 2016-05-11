import logging
import json
import os
from os import path

from config import OUTPUT_DIR


def json_datetime_dump(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError('Object of type %s with value of %s is not JSON serializable' % (type(obj), repr(obj)))


def out_path(dirname):
    """
    Ensure that the output directory exists.
    Returns False if no output directory is specified
    """

    if not OUTPUT_DIR:
        return False

    out = os.path.join(OUTPUT_DIR, dirname)
    try:
        os.makedirs(out)
    except:
        pass

    return out


def write_course(course):

    # Merge the basic and extra information into a single dict
    # I should probably just do this at a lower level, but this works too
    merged_course = course['basic'].copy()
    merged_course.update(course['extra'])

    filename = '{subject}_{number}.json'.format(**merged_course)

    write_json_file(course, filename, 'courses')


def write_subject(subject):

    filename = '{abbreviation}.json'.format(**subject)

    write_json_file(subject, filename, 'subjects')


def write_section(section):

    merged_section = section['basic']

    filename = '{year}_{season}_{subject}_{course}_({solus_id}).json'.format(**merged_section)

    write_json_file(section, filename, 'sections')


def write_textbook(subject, course, textbook):
    out = out_path('textbooks')

    isbn = textbook['isbn_13'] or textbook['isbn_10']

    filename = '{}.json'.format(isbn)
    filepath = os.path.join(out, filename)

    course_id = '{} {}'.format(subject, course)

    if os.path.isfile(filepath):
        # The file already exists, add this course
        with open(filepath, 'r+t') as f:
            oldtextbook = json.loads(f.read())
            oldtextbook['courses'].append(course_id)
            f.seek(0)
            f.write(json.dumps(oldtextbook, indent=4, sort_keys=True))
    else:
        textbook['courses'] = [course_id]
        write_json_file(textbook, filename, 'textbooks')


def write_json_file(obj, filename, output_dir):
    """
    Dumps an object and pretty prints it to a file.
    """

    out = out_path(output_dir)

    with open(os.path.join(out, filename), 'w') as f:
        f.write(json.dumps(obj, indent=4, default=json_datetime_dump, sort_keys=True))
