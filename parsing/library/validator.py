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


# TODO - consider something to load db field sizes into validator
#        However, that would ruin the purity of the adapter.

from __future__ import absolute_import, division, print_function

import dateutil.parser as dparser
import httplib
import jsonschema
import logging
import re
import simplejson as json
import sys
import warnings

# Contains BASE_DIR and PARSING_MODULE.
from django.conf import settings

from parsing.library.tracker import Tracker
from parsing.library.exceptions import PipelineError, PipelineWarning
from parsing.library.utils import DotDict, make_list, update, \
    dir_to_dict


class ValidationError(PipelineError):
    """Validator error class."""


class ValidationWarning(PipelineWarning):
    """Validator warning class."""


class MultipleDefinitionsWarning(ValidationWarning):
    """Duplicated key in data definition."""


class Validator:
    """Validation engine in parsing data pipeline.

    Attributes:
        config (:obj:`DotDict`): Loaded config.json.
        course_code_regex (:obj:`re`): Regex to match course code.
        kind_to_validation_function (:obj:`dict`):
            Map kind to validation function defined within this class.
        KINDS (:obj:`set`): Kinds of objects that validator validates.
        relative (:obj:`bool`): Enforce relative ordering in validation.
        seen (:obj:`dict`): Running monitor of seen courses and sections
        tracker (:obj:`parsing.library.tracker.Tracker`)
    """

    KINDS = {
        'config',
        'datalist',
        'course',
        'section',
        'meeting',
        'directory',
        'eval',
        'instructor',
        'final_exam',
        'textbook',
        'textbook_link',
    }

    def __init__(self, config, tracker=None, relative=True):
        """Construct validator instance.

        Args:
            config (dict): School config dictionary.
            tracker (None, optional): Description
            relative (bool, optional): Enforce relative ordering in validation.
        """
        Validator.load_schemas()

        self.kind_to_validation_function = {
            kind: getattr(self, 'validate_' + kind)
            if hasattr(self, 'validate_' + kind) else lambda *_, **__: None
            for kind in Validator.KINDS
        }

        self.config = DotDict(config)
        self.config['kind'] = 'config'
        self.validate(self.config)

        self.course_code_regex = re.compile(self.config.course_code_regex)
        self.relative = relative

        # Running monitor of validated course and section codes.
        self.seen = {}

        if tracker is None:  # Used during self-contained validation.
            self.tracker = Tracker()
            self.tracker.school = self.config.school.code
            self.tracker.mode = 'validating'
            self.tracker.start()
        else:
            self.tracker = tracker

    @classmethod
    def load_schemas(cls, schema_path=None):
        """Load JSON validation schemas.

        NOTE: Will load schemas as static variable (i.e. once per definition),
              unless schema_path is specifically defined.

        Args:
            schema_path (None, str, optional): Override default schema_path
        """
        if hasattr(cls, 'SCHEMAS') and schema_path is None:
            return

        if schema_path is None:
            schema_path = '{}/{}/library/schemas'.format(
                settings.BASE_DIR,
                settings.PARSING_MODULE
            )

        def load(kind):
            filepath = '{}/{}.json'.format(schema_path, kind)
            with open(filepath, 'r') as file:
                schema = json.load(file)
            resolved = jsonschema.RefResolver(
                'file://{}/'.format(schema_path),
                schema
            )
            return (schema, resolved)

        cls.SCHEMAS = DotDict({
            kind: load(kind) for kind in cls.KINDS
        })
        # TODO - make into a namedtuple instead

    @staticmethod
    def schema_validate(data, schema, resolver=None):
        """Validate data object with JSON schema alone.

        Args:
            data (dict): Data object to validate.
            schema: JSON schema to validate against.
            resolver (None, optional): JSON Schema reference resolution.

        Raises:
            jsonschema.exceptions.ValidationError: Invalid object.
        """
        try:
            jsonschema.Draft4Validator(schema,
                                       resolver=resolver).validate(data)
        except jsonschema.exceptions.ValidationError as e:
            raise ValidationError(data, *e.args)
        # TODO - Create iter_errors from jsonschema validator
        # NOTE: if modifying schemas it may be prudent to catch:
        #       jsonschema.exceptions.SchemaError
        #       jsonschema.exceptions.RefResolutionError

    @staticmethod
    def file_to_json(path, allow_duplicates=False):
        """Load file pointed to by path into json object dictionary.

        Args:
            path (str):
            allow_duplicates (bool, optional): Allow duplicate keys in JSON.

        Returns:
            dict: JSON-compliant dictionary.
        """
        def raise_on_duplicates(ordered_pairs):
            """Reject duplicate keys in dictionary."""
            d = {}
            for k, v in ordered_pairs:
                if k in d:
                    raise ValidationError("duplicate key: %r" % (k,))
                d[k] = v
            return d

        with open(path, 'r') as f:
            if allow_duplicates:
                return json.load(f)
            return json.load(f, object_pairs_hook=raise_on_duplicates)

    def validate(self, data):
        """Validation entry/dispatcher.

        Args:
            data (list, dict): Data to validate.
        """
        for obj in make_list(data):
            obj = DotDict(obj)
            Validator.schema_validate(obj, *Validator.SCHEMAS[obj.kind])
            self.kind_to_validation_function[obj.kind](obj)

    def validate_self_contained(self, data_path,
                                break_on_error=True,
                                break_on_warning=False,
                                output_error=None,
                                display_progress_bar=True,
                                master_log_path=None):
        """Validate JSON file as without ingestor.

        Args:
            data_path (str): Path to data file.
            break_on_error (bool, optional): Description
            break_on_warning (bool, optional): Description
            output_error (None, optional): Error output file path.
            display_progress_bar (bool, optional): Description
            master_log_path (None, optional): Description
            break_on_error (bool, optional)
            break_on_warning (bool, optional)
            display_progress_bar (bool, optional)

        Raises:
            ValidationError: Description
        """
        # if display_progress_bar:
        #     self.tracker.add_viewer(StatProgressBar('{valid}/{total}'))

        # self.validate_directory(directory)
        data = Validator.file_to_json(data_path)['$data']
        Validator.schema_validate(data, *Validator.SCHEMAS.datalist)

        for obj in data:
            obj = DotDict(obj)
            try:
                self.kind_to_validation_function[obj.kind](obj)
                self.tracker.stats = dict(kind=obj.kind, status='valid')
            except ValidationError as e:
                logging.exception('Validation error')
                if break_on_error:
                    raise ValidationError(*e.args)
            except ValidationWarning as e:
                logging.warn(e)
                # warnings.warn('', e, stacklevel=2)
            self.tracker.stats = dict(kind=obj.kind, status='total')

        self.tracker.end()

    def validate_course(self, course):
        """Validate course.

        Args:
            course (DotDict): Course object to validate.

        Raises:
            MultipleDefinitionsWarning: Course has already been validated in
                same session.
            ValidationError: Invalid course.
        """
        if 'kind' in course and course.kind != 'course':
            raise ValidationError(course,
                                  'course object must be of kind course')

        if self.course_code_regex.match(course.code) is None:
            raise ValidationError(
                course,
                "course code {} does not match r'{}'".format(
                    course.code,
                    self.config.course_code_regex
                )
            )

        if ('department' in course and
                'code' in course.department and
                'departments' in self.config):
            department_codes = {d.code for d in self.config.departments}
            if course.department.code not in department_codes:
                raise ValidationError(
                    course,
                    'department {} is not in config.json departments'.format(
                        course.department)
                )

        if 'homepage' in course:
            self.validate_website(course.homepage)

        for section in course.get('sections', []):
            if 'course' in section and section.course.code != course.code:
                raise ValidationError(
                    course,
                    'nested {} does not match parent {}'.format(
                        section.course.code,
                        course.code
                    )
                )

            # NOTE: mutating dictionary
            section.course = {'code': course.code}
            self.validate_section(section)

        if not self.relative:
            return

        if course.code in self.seen:
            raise MultipleDefinitionsWarning(
                course,
                'multiple definitions of course {}'.format(course.code)
            )
        self.seen.setdefault(course.code, {})

    def validate_section(self, section):
        """Validate section object.

        Args:
            section (DotDict): Section object to validate.

        Raises:
            MultipleDefinitionsWarning: Invalid section.
            ValidationError: Description
        """
        if 'course' not in section:
            raise ValidationError(section,
                                  'section doesnt define a parent course')

        if 'kind' in section and section.kind != 'section':
            raise ValidationError(section,
                                  'section must be of kind section')

        if ('course' in section and
                self.course_code_regex.match(section.course.code) is None):
            raise ValidationError(
                section,
                'course code {} does not match r\'{}\''.format(
                    section.course.code,
                    self.config.course_code_regex
                )
            )

        if 'term' in section and section.term not in self.config.terms:
            raise ValidationError(
                section,
                'term {} not in config.json term list'.format(section.term)
            )

        if 'instructors' in section:
            db_instructor_textfield_max_size = 500
            db_instructor_textfield_size = len(
                ', '.join(instructor['name'] for instructor in section.instructors)
            )
            if db_instructor_textfield_size > db_instructor_textfield_max_size:
                raise ValidationError(
                    section,
                    'db field too small for comma-joined instructor names'
                )

        for instructor in section.get('instructors', []):
            self.validate_instructor(instructor)

        if 'final_exam' in section:
            if ('course' in section.final_exam and
                    section.final_exam.course.code != section.course.code):
                raise ValidationError(
                    section,
                    'final exam course {} doesnt match course code {}'.format(
                        section.final_exam.course.code,
                        section.course.code
                    )
                )
            if ('section' in section.final_exam and
                    section.final_exam.section.code != section.code):
                raise ValidationError(
                    section,
                    'final exam section {} doesnt match section {}'.format(
                        section.final_exam.section.code,
                        section.code
                    )
                )
            # final_exam['course'] = section.course
            # final_exam['section'] = {'code': section.code}
            # self.validate_final_exam(section.final_exam)

        for meeting in section.get('meetings', []):
            if ('course' in meeting and
                    meeting.course.code != section.course.code):
                raise ValidationError(
                    section,
                    'course code {} in meeting doesnt match parent section \
                     course code {}'.format(
                        meeting.course.code,
                        section.course.code
                    )
                )
            if 'section' in meeting and meeting.section.code != section.code:
                raise ValidationError(
                    section,
                    'section code {} in nested meeting doesnt match parent \
                     section code {}'.format(
                        meeting.section.code,
                        section.code
                    )
                )

            # NOTE: mutating obj
            # meeting['course'] = section.course
            # meeting['section'] = {'code': section.code}
            self.validate_meeting(DotDict(meeting))

        if 'textbooks' in section:
            for textbook in section.textbooks:
                self.validate_textbook_link(textbook)

        if not self.relative:
            return

        if section.course.code not in self.seen:
            raise ValidationError(
                'course code {} isnt defined'.format(section.course.code),
                section
            )
        elif (section.code in self.seen[section.course.code] and
                section.year in self.seen[section.course.code][section.code] and
                section.term in self.seen[section.course.code][section.code][section.year]):
            raise MultipleDefinitionsWarning(
                section,
                'multiple defs for {} {} - {} already defined'.format(
                    section.course.code,
                    section.code,
                    section.year
                )
            )

        update(self.seen[section.course.code],
               {section.code: {section.year: section.term}})

    def validate_meeting(self, meeting):
        """Validate meeting object.

        Args:
            meeting (DotDict): Meeting object to validate.

        Raises:
            ValidationError: Invalid meeting.
            ValidationWarning: Description
        """
        if 'kind' in meeting and meeting.kind != 'meeting':
            raise ValidationError(meeting,
                                  'meeting object must be kind instructor')
        if ('course' in meeting and
                self.course_code_regex.match(meeting.course.code) is None):
            raise ValidationError(
                meeting,
                'course code {} does not match regex \'{}\''.format(
                    meeting.course.code,
                    self.config.course_code_regex
                )
            )
        if 'time' in meeting:
            try:
                self.validate_time_range(meeting.time.start, meeting.time.end)
            except (ValidationError, ValidationWarning) as e:
                message = 'meeting for {} {}, '.format(
                    meeting.course.code,
                    meeting.section.code
                )
                if isinstance(e, ValidationError):
                    raise ValidationError(message, e.args)
                raise ValidationWarning(message, e.args)
        if 'location' in meeting:
            try:
                self.validate_location(meeting.location)
            except ValidationError as e:
                message = 'meeting for {} {}, '.format(
                    meeting.course.code,
                    meeting.section.code
                )
                raise ValidationError(message, e.args)

        if not self.relative:
            return

        if 'course' in meeting and meeting.course.code not in self.seen:
            raise ValidationError(
                meeting,
                'course code {} isnt defined'.format(meeting.course.code)
            )
        if ('section' in meeting and
                meeting.section.code not in self.seen[meeting.course.code]):
            raise ValidationError(
                meeting,
                'section {} isnt defined'.format(meeting.section.code)
            )

    def validate_eval(self, course_eval):
        """Validate evaluation object.

        Args:
            course_eval (DotDict): Evaluation to validate.

        Raises:
            ValidationError: Invalid evaulation.
        """
        if self.course_code_regex.match(course_eval.course.code) is None:
            raise ValidationError(
                course_eval,
                "course code {} does not match r'{}'".format(
                    course_eval.course.code,
                    self.config.course_code_regex
                )
            )

    def validate_instructor(self, instructor):
        """Validate instructor object.

        Args:
            instructor (DotDict): Instructor object to validate.

        Raises:
            ValidationError: Invalid instructor.
        """
        if 'kind' in instructor and instructor.kind != 'instructor':
            raise ValidationError(
                instructor,
                'instructor object must be of kind instructor'
            )

        for class_ in instructor.get('classes', []):
            if ('course' in class_ and
                    self.course_code_regex.match(class_.course.code) is None):
                raise ValidationError(
                    instructor,
                    'course code {} does not match given regex {}'.format(
                        class_.course.code,
                        self.config.course_code_regex
                    )
                )

        if 'department' in instructor and 'departments' in self.config:
            dept_codes = {d.code for d in self.config.departments}
            if instructor.department not in dept_codes:
                raise ValidationError(
                    instructor,
                    'department {} not listed in config.json'.format(
                        instructor.department
                    )
                )

        if 'homepage' in instructor:
            try:
                self.validate_homepage(instructor.homepage)
            except ValidationError as e:
                message = 'instructor {} office, {}'.format(instructor.name)
                raise ValidationError(message, e.args)

        if 'office' in instructor:
            try:
                if 'location' in instructor.office:
                    self.validate_location(instructor.office.location)
                for office_hour in instructor.office.get('hours', []):
                    self.validate_meeting(office_hour)
            except ValidationError as e:
                message = 'instructor {} office, {}'.format(instructor.name)
                raise ValidationError(message, e.args)

    def validate_final_exam(self, final_exam):
        """Validate final exam.

        NOTE: currently unused.

        Args:
            final_exam (DotDict): Final Exam object to validate.

        Raises:
            ValidationError: Invalid final exam.
        """
        if 'kind' in final_exam and final_exam.kind != 'final_exam':
            raise ValidationError(
                final_exam,
                'final_exam object must be of kind "final_exam"'
            )
        try:
            self.validate_meeting(final_exam.meeting)
        except ValidationError as e:
            raise ValidationError(final_exam, e.args)

    def validate_textbook_link(self, textbook_link):
        """Validate textbook link.

        Args:
            textbook_link (DotDict): Textbook link object to validate.

        Raises:
            ValidationError: Invalid textbook link.
        """
        if 'course' not in textbook_link:
            return
        if self.course_code_regex.match(textbook_link.course.code) is not None:
            return
        raise ValidationError(
            textbook_link,
            'textbook_link course code doent match course code regex'
        )

    def validate_location(self, location):
        """Validate location.

        Args:
            location (DotDict): Location object to validate.

        Raises:
            ValidationWarning: Invalid location.
        """
        if 'campus' in location and 'campuses' in self.config:
            if location.campus not in self.config.campuses:
                raise ValidationWarning(
                    location,
                    'campus {} not in config'.format(location.campus),
                )
        if 'building' in location and 'buildings' in self.config:
            if location.building not in self.config.buildings:
                raise ValidationWarning(
                    location,
                    'building {} not in config'.format(location.building),
                )

    @staticmethod
    def validate_website(url):
        """Validate url by sending HEAD request and analyzing response.

        Args:
            url (str): URL to validate.

        Raises:
            ValidationError: URL is invalid.
        """
        c = httplib.HTTPConnection(url)
        c.request('HEAD', '')
        # NOTE: 200 - good status
        #       301 - redirected
        if c.getresponse().status == 200 or c.getresponse().status == 301:
            return
        raise ValidationError(url, 'invalid website w/url "%s"'.format(url))

    def validate_time_range(self, start, end):
        """Validate start time and end time.

        There exists an unhandled case if the end time is midnight.

        Args:
            start (str): Start time.
            end (str): End time.

        Raises:
            ValidationError: Time range is invalid.
        """
        try:
            start, end = map(dparser.parse, [start, end])
        except ValueError:
            raise ValidationError('invalid time format {}-{}'.format(start, end))

        if start >= end:
            raise ValidationError('start {} >= end {}'.format(start, end))
        # NOTE: there exists an unhandled case if the end time is midnight.

    def validate_directory(self, directory):
        """Validate directory.

        Args:
            directory (str, dict): Directory to validate.
                May be either path or object.

        Raises:
            ValidationError: encapsulated IOError
        """
        if isinstance(directory, str):
            try:
                name = directory
                directory = dir_to_dict(directory)
                directory['name'] = name
            except IOError as e:
                raise ValidationError(str(e))
        Validator.schema_validate(directory, *Validator.SCHEMAS.directory)
