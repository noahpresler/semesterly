"""
Data Pipeline - Validator.

@org      Semesterly
@author   Michael N. Miller
@date     1/12/17
"""

# TODO - consider something to load db field sizes

from __future__ import absolute_import, division, print_function

import os
import httplib
import re
import sys
import jsonschema
import simplejson as json

# Contains BASE_DIR for absolute path.
from django.conf import settings

from scripts.parser_library.internal_exceptions import \
    JsonDuplicationWarning, JsonValidationError, JsonValidationWarning
from scripts.parser_library.utils import DotDict, make_list, update
from scripts.parser_library.logger import Logger
from scripts.parser_library.tracker import Tracker
from scripts.parser_library.viewer import LogFormatted, ProgressBar
from scripts.parser_library.exceptions import PipelineError, PipelineWarning


class ValidationError(PipelineError, jsonschema.exceptions.ValidationError):
    """Validator error class."""


class ValidationWarning(PipelineWarning):
    """Validator warning class."""


class Validator:
    """Validation engine in parsing data pipeline.
    """

    SCHEMA_PATH = '{}/scripts/parser_library/schemas'.format(settings.BASE_DIR)
    KINDS = {
        'config',
        'datalist',
        'course',
        'section',
        'meeting',
        'directory',
        'eval',
    }

    def __init__(self, config, tracker=None):
        """Construct validator instance."""
        Validator.load_schemas()

        self.config = self.validate_config(config)
        self.course_code_regex = re.compile(self.config.course_code_regex)

        # Running tracker of validated course and section codes
        self.seen = {}
        # TODO - move to tracker

        if tracker is None:  # Used during self-contained validation.
            self.tracker = Tracker(self.config.school.code)
            self.tracker.mode = 'validating'
        else:
            self.tracker = tracker

    @classmethod
    def load_schemas(cls):
        if hasattr(cls, 'SCHEMAS'):
            return

        def load(kind):
            filepath = '{}/{}.json'.format(cls.SCHEMA_PATH, kind)
            with open(filepath, 'r') as file:
                schema = json.load(file)
            resolved = jsonschema.RefResolver(
                'file://{}/'.format(cls.SCHEMA_PATH),
                schema
            )
            return (schema, resolved)

        cls.SCHEMAS = DotDict({
            kind: load(kind) for kind in cls.KINDS
        })

        return cls.SCHEMAS

    @staticmethod
    def schema_validate(data, schema, resolver=None):
        jsonschema.Draft4Validator(schema, resolver=resolver).validate(data)
        # TODO - Create iter_errors from jsonschema validator
        # except jsonschema.exceptions.SchemaError as e:
        #   raise e
        # except jsonschema.exceptions.RefResolutionError as e:
        #   raise e

    @staticmethod
    def filepath_to_json(file, allow_duplicates=False):
        '''Load file pointed to by path into json object dictionary.'''
        with open(file, 'r') as f:
            if allow_duplicates:
                return json.load(f)
            else:
                return json.loads(
                    f.read(),
                    object_pairs_hook=Validator.dict_raise_on_duplicates
                )

    def kind_to_validation_function(self, kind):
        return {
            'course': lambda x, schema=False:
                self.validate_course(x, schema=schema),
            'section': lambda x, schema=False:
                self.validate_section(x, schema=schema),
            'meeting': lambda x, schema=False:
                self.validate_meeting(x, schema=schema),
            'instructor': lambda x, schema=False:
                self.validate_instructor(x, schema=schema),
            'final_exam': lambda x, schema=False:
                self.validate_final_exam(x, schema=schema),
            'textbook': lambda x, schema=False:
                self.validate_textbook(x, schema=schema),
            'textbook_link': lambda x, schema=False:
                self.validate_textbook_link(x, schema=schema),
            'eval': lambda x, schema=False:
                self.validate_eval(x, schema=schema),
        }[kind]

    def validate(self, data):
        """Validation entry/dispatcher.

        Args:
            data (list, dict): Data to validate.
        """
        # Convert to DotDict for `easy-on-the-eyes` element access
        data = [DotDict(d) for d in make_list(data)]
        for obj in data:

            self.kind_to_validation_function(obj.kind)(obj, schema=True)

    def validate_self_contained(self, datafile,
                                break_on_error=False,
                                break_on_warning=False,
                                output_error=None,
                                display_progress_bar=True):

        # Add functionality to tracker.
        # FIXME -- hardcoded master log file
        self.tracker.add_viewer(LogFormatted('scripts/logs/master.log'))
        if display_progress_bar:
            def formatter(stats):
                return '{}/{}'.format(stats['valid'], stats['total'])
            self.tracker.add_viewer(
                ProgressBar(self.config.school.code, formatter)
            )
        self.tracker.start()

        self.logger = Logger(errorfile=output_error)

        try:
            # self.validate_directory(directory)
            data = Validator.filepath_to_json(datafile)
            Validator.schema_validate(data, *Validator.SCHEMAS.datalist)
        except (JsonValidationError, json.scanner.JSONDecodeError) as e:
            self.logger.log(e)
            raise e  # fatal error, cannot continue

        data = [DotDict(d) for d in data]

        # TODO - iter errors and catch exceptions within method
        for obj in data:
            try:
                self.kind_to_validation_function(obj.kind)(obj, schema=False)
                self.tracker.status = dict(kind=obj.kind, status='valid')
            except JsonValidationError as e:
                self.logger.log(e)
                if break_on_error:
                    raise e
            except JsonValidationWarning as e:
                self.logger.log(e)
                if break_on_warning:
                    raise e
            self.tracker.status = dict(kind=obj.kind, status='total')
            # TODO - delay tracker update to progress bar

        self.tracker.end()

    def validate_config(self, config):
        if not isinstance(config, dict):
            try:
                config = Validator.filepath_to_json(config)
            except IOError as e:
                e.message += '\nconfig.json not defined'
                raise e
        return DotDict(config)  # FIXME - DotDict should work here
        # Validator.schema_validate(config, *Validator.SCHEMAS.config)

    def validate_course(self, course, schema=True, relative=True):
        if not isinstance(course, DotDict):
            course = DotDict(course)

        if schema:
            Validator.schema_validate(course, *Validator.SCHEMAS.course)

        if 'kind' in course and course.kind != 'course':
            raise JsonValidationError('course object must be of kind course',
                                      course)

        if self.course_code_regex.match(course.code) is None:
            raise JsonValidationError(
                "course code {} does not match r'{}'".format(
                    course.code,
                    self.config.course_code_regex
                ),
                course
            )

        if ('department' in course and
                'code' in course.department and
                'departments' in self.config):
            department_codes = {d.code for d in self.config.departments}
            if course.department.code not in department_codes:
                raise JsonValidationError(
                    'department {} is not in config.json departments'.format(
                        course.department),
                    course
                )

        if 'homepage' in course:
            self.validate_website(course.homepage)

        for section in course.get('sections', []):
            if 'course' in section and section.course.code != course.code:
                raise JsonValidationError(
                    'nested {} does not match parent {}'.format(
                        section.course.code,
                        course.code
                    ),
                    course
                )

            # NOTE: mutating dictionary
            section.course = {'code': course.code}
            self.validate_section(section, schema=False)

        if relative:
            if course.code in self.seen:
                raise JsonDuplicationWarning(
                    'multiple definitions of course {}'.format(course.code),
                    course
                )
            if course.code not in self.seen:
                self.seen[course.code] = {}

    def validate_section(self, section, schema=True, relative=True):
        if not isinstance(section, DotDict):
            section = DotDict(section)

        if schema:
            Validator.schema_validate(section, *Validator.SCHEMAS.section)

        if 'course' not in section:
            raise JsonValidationError('section doesnt define a parent course',
                                      section)

        if 'kind' in section and section.kind != 'section':
            raise JsonValidationError('section must be of kind "section"',
                                      section)

        if ('course' in section and
                self.course_code_regex.match(section.course.code) is None):
            raise JsonValidationError(
                'course code {} does not match r\'{}\''.format(
                    section.course.code,
                    self.config.course_code_regex
                ),
                section
            )

        if 'term' in section and section.term not in self.config.terms:
            raise JsonValidationError(
                'term {} not in config.json term list'.format(section.term),
                section
            )

        if 'instructors' in section:
            db_instructor_textfield_size = 500
            if len(', '.join(instructor['name'] for instructor in section.instructors)) > db_instructor_textfield_size:
                raise JsonValidationError(
                    'db field too small for comma-joined instructor names',
                    section
                )

        for instructor in section.get('instructors', []):
            self.validate_instructor(instructor)

        if 'final_exam' in section:
            if ('course' in section.final_exam and
                    section.final_exam.course.code != section.course.code):
                raise JsonValidationError(
                    'final exam course {} doesnt match course code {}'.format(
                        section.final_exam.course.code,
                        section.course.code
                    ),
                    section
                )
            if ('section' in section.final_exam and
                    section.final_exam.section.code != section.code):
                raise JsonValidationError(
                    'final exam section {} doesnt match section {}'.format(
                        section.final_exam.section.code,
                        section.code
                    ),
                    section
                )
            # final_exam['course'] = section.course
            # final_exam['section'] = {'code': section.code}
            # self.validate_final_exam(section.final_exam)

        for meeting in section.get('meetings', []):
            if ('course' in meeting and
                    meeting.course.code != section.course.code):
                raise JsonValidationError(
                    'course code {} in meeting doesnt match parent section \
                     course code {}'.format(
                        meeting.course.code,
                        section.course.code
                    ),
                    section
                )
            if 'section' in meeting and meeting.section.code != section.code:
                raise JsonValidationError(
                    'section code {} in nested meeting doesnt match parent \
                     section code {}'.format(
                        meeting.section.code,
                        section.code
                    ),
                    section
                )

            # NOTE: mutating dictionary
            meeting.course = section.course
            meeting.section = {'code': section.code}
            self.validate_meeting(meeting, schema=False)

        if 'textbooks' in section:
            for textbook in section.textbooks:
                self.validate_textbook_link(textbook)

        if relative:
            if section.course.code not in self.seen:
                raise JsonValidationError(
                    'course code {} isnt defined'.format(section.course.code),
                    section
                )
            elif (section.code in self.seen[section.course.code] and
                    section.year in self.seen[section.course.code][section.code] and
                    section.term in self.seen[section.course.code][section.code][section.year]):
                raise JsonDuplicationWarning(
                    'multiple defs for {} {} - {} already defined'.format(
                        section.course.code,
                        section.code, section.year
                    ),
                    section
                )
            else:
                section_essence = {
                    section.code: {
                        section.year: {
                            section.term
                        }
                    }
                }

                update(self.seen[section.course.code], section_essence)

    def validate_meeting(self, meeting, schema=True, relative=True):
        if not isinstance(meeting, DotDict):
            meeting = DotDict(meeting)
        if schema:
            Validator.schema_validate(meeting, *Validator.SCHEMAS.meeting)
        if 'kind' in meeting and meeting.kind != 'meeting':
            raise JsonValidationError('meeting object must be kind instructor',
                                      meeting)
        if ('course' in meeting and
                self.course_code_regex.match(meeting.course.code) is None):
            raise JsonValidationError(
                'course code {} does not match regex \'{}\''.format(
                    meeting.course.code,
                    self.config.course_code_regex
                ),
                meeting
            )
        if 'time' in meeting:
            try:
                self.validate_time_range(meeting.time)
            except (JsonValidationError, JsonValidationWarning) as e:
                e.message = 'meeting for {} {}, '.format(
                    meeting.course.code,
                    meeting.section.code
                ) + e.message
                raise e
        if 'location' in meeting:
            try:
                self.validate_location(meeting.location)
            except JsonValidationError as e:
                e.message = 'meeting for {} {}, '.format(
                    meeting.course.code,
                    meeting.section.code
                ) + e.message
                raise e
        if relative:
            if meeting.course.code not in self.seen:
                raise JsonValidationError(
                    'course code {} isnt defined'.format(meeting.course.code),
                    meeting
                )
            if meeting.section.code not in self.seen[meeting.course.code]:
                raise JsonValidationError(
                    'section {} isnt defined'.format(meeting.section.code),
                    meeting
                )

    def validate_eval(self, course_eval, schema=True):
        if not isinstance(course_eval, DotDict):
            course_eval = DotDict(course_eval)
        if schema:
            Validator.schema_validate(course_eval, *Validator.SCHEMAS.eval)
        if self.course_code_regex.match(course_eval.course.code) is None:
            raise JsonValidationError(
                "course code {} does not match r'{}'".format(
                    course_eval.course.code,
                    self.config.course_code_regex
                ),
                course_eval
            )

    def validate_instructor(self, instructor, schema=False, relative=True):
        if not isinstance(instructor, DotDict):
            instructor = DotDict(instructor)
        if 'kind' in instructor and instructor.kind != 'instructor':
            raise JsonValidationError(
                'instructor object must be of kind instructor',
                instructor
            )

        for class_ in instructor.get('classes', []):
            if ('course' in class_ and
                    self.course_code_regex.match(class_.course.code) is None):
                raise JsonValidationError(
                    'course code {} does not match given regex {}'.format(
                        class_.course.code,
                        self.config.course_code_regex
                    ),
                    instructor
                )

        if 'department' in instructor and 'departments' in self.config:
            dept_codes = {d.code for d in self.config.departments}
            if instructor.department not in dept_codes:
                raise JsonValidationError(
                    'department {} not listed in config.json'.format(
                        instructor.department
                    ),
                    instructor
                )

        if 'homepage' in instructor:
            try:
                self.validate_homepage(instructor.homepage)
            except JsonValidationError as e:
                e.message = '@instructor {} office, {}'.format(instructor.name,
                                                               e.message)
                raise e

        if 'office' in instructor:
            try:
                if 'location' in instructor.office:
                    self.validate_location(instructor.office.location)
                for office_hour in instructor.office.get('hours', []):
                    self.validate_meeting(office_hour)
            except JsonValidationError as e:
                e.message = '@instructor {} office, {}'.format(instructor.name,
                                                               e.message)
                raise e

    def validate_final_exam(self, final_exam, schema=False, relative=True):
        if not isinstance(final_exam, DotDict):
            final_exam = DotDict(final_exam)
        if 'kind' in final_exam and final_exam.kind != 'final_exam':
            raise JsonValidationError(
                'final_exam object must be of kind "final_exam"',
                final_exam
            )
        try:
            self.validate_meeting(final_exam.meeting)
        except JsonValidationError as e:
            e.message = '@final_exam ' + e.message
            raise e

    def validate_textbook(self, textbook, schema=False, relative=True):
        if not isinstance(textbook, DotDict):
            textbook = DotDict(textbook)

    def validate_textbook_link(self, textbook_link,
                               schema=False,
                               relative=True):
        if not isinstance(textbook_link, DotDict):
            textbook_link = DotDict(textbook_link)
        if ('course' in textbook_link and
                self.course_code_regex.match(textbook_link.course.code) is None):
            raise JsonValidationError(
                'textbook_link course code doent match course code regex',
                textbook_link
            )

    def validate_location(self, location):
        if 'campus' in location and 'campuses' in self.config:
            if location.campus not in self.config.campuses:
                raise JsonValidationWarning(
                    'location at campus {} not defined in config.json campuses'.format(location.campus), location)
        if 'building' in location and 'buildings' in self.config:
            if location.building not in self.config.buildings:
                raise JsonValidationWarning(
                    'location at building {} not defined in config.json buildings'.format(location.building), location)

    @staticmethod
    def validate_website(url):
        '''Validate url by sending HEAD request and analyzing response.'''
        c = httplib.HTTPConnection(url)
        c.request("HEAD", '')
        # NOTE: 200 - good status
        #       301 - redirected
        if c.getresponse().status == 200 or c.getresponse().status == 301:
            return
        raise JsonValidationError('invalid website w/url "%s"'.format(url),
                                  {'url': url})

    def validate_time_range(self, time_range):
        start, end = time_range.start, time_range.end

        def extract(x):
            return re.match(r'(\d{1,2}):(\d{2})', x)

        # Check individual time bounds
        for time in [start, end]:
            rtime = extract(time)
            hour, minute = int(rtime.group(1)), int(rtime.group(2))
            if hour > 23 or minute > 59:
                raise JsonValidationError('{} isnt a valid time'.format(time))
            # self.update_time_granularity(hour, minute)

        # Check interaction between times
        rstart = extract(start)
        rend = extract(end)
        start_hour, start_minute = int(rstart.group(1)), int(rstart.group(2))
        end_hour, end_minute = int(rend.group(1)), int(rend.group(2))
        for i in [start_hour, start_minute, end_hour, end_minute]:
            i = int(i)

        # NOTE: edge case if class going till midnight
        if ((end_hour != 0 and start_hour > end_hour) or
                (start_hour == end_hour and start_minute > end_minute)):
            raise JsonValidationError('start time is greater than end time',
                                      time_range)

        # NOTE: this check is done after the others to give errors higher
        # priorities than warnings
        for time in [start, end]:
            hour, minute = int(rtime.group(1)), int(rtime.group(2))
            if hour < 8 or hour > 21:
                raise JsonValidationWarning('time will not land on timetable',
                                            time_range)

    def validate_directory(self, directory):
        if isinstance(directory, str):
            try:
                name = directory
                directory = dir_to_dict(directory)
                directory['name'] = name
            except IOError as e:
                print('ERROR: invalid directory path\n' + str(e),
                      file=sys.stderr)
                raise e
        Validator.schema_validate(directory, *Validator.SCHEMAS.directory)

    @staticmethod
    def dict_raise_on_duplicates(ordered_pairs):
        """Reject duplicate keys in dictionary."""
        d = {}
        for k, v in ordered_pairs:
            if k in d:
                raise JsonValidationError("duplicate key: %r" % (k,))
            else:
                d[k] = v
        return d


def dir_to_dict(path):
    """Recursively create nested dictionary representing directory contents.

    Args:
        path (str): The path of the directory.

    Returns:
        dict: Dictionary representation of the directory.

        Example::
            {
                "name": ""
                "kind": "directory",
                "children": [
                    {
                        "name": "child_dir_a",
                        "kind": "directory",
                        "children": [
                            {
                                "name": "file0",
                                "kind": "file"
                            }
                        ]
                    },
                    {
                        "name": "file1.txt",
                        "kind": "file"
                    }
                ]
            }
    """
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['kind'] = "directory"
        d['children'] = [
            dir_to_dict(os.path.join(path, x)) for x in os.listdir(path)
        ]
    else:
        d['kind'] = "file"
    return d
