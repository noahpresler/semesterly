"""Filler."""

# TODO - consider something to load db field sizes into validator
#        However, that would ruin the purity of the adapter.

from __future__ import absolute_import, division, print_function

import httplib
import re
import sys
import jsonschema
import simplejson as json

import dateutil.parser as dparser

# Contains BASE_DIR and PARSING_DIR.
from django.conf import settings

from scripts.library.internal_exceptions import \
    JsonDuplicationWarning, JsonValidationError, JsonValidationWarning
from scripts.library.utils import DotDict, make_list, update, \
    dir_to_dict
from scripts.library.logger import Logger
from scripts.library.tracker import Tracker
from scripts.library.viewer import ProgressBar
from scripts.library.exceptions import PipelineError, PipelineWarning


class ValidationError(PipelineError, jsonschema.exceptions.ValidationError):
    """Validator error class."""


class ValidationWarning(PipelineWarning):
    """Validator warning class."""


class Validator:
    """Validation engine in parsing data pipeline.

    Attributes:
        config (DotDict): Loaded config.json.
        course_code_regex (re): Regex to match course code.
        kind_to_validation_function (dict):
            Map kind to validation function defined within this class.
        KINDS (set): Kinds of objects that validator validates.
        relative (bool): Enforce relative ordering in validation.
        seen (dict): Running monitor of seen courses and sections
        tracker (scripts.parsing_library.tracker.Tracker): Tracker.
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

    def __init__(self, config_path, tracker=None, relative=True):
        """Construct validator instance.

        Args:
            config_path (str): School config file path.
            tracker (None, optional): Description
            relative (bool, optional): Enforce relative ordering in validation.
        """
        Validator.load_schemas()

        self.kind_to_validation_function = {
            kind: getattr(self, 'validate_' + kind)
            if hasattr(self, 'validate_' + kind) else lambda *_, **__: None
            for kind in Validator.KINDS
        }

        self.config = DotDict(Validator.file_to_json(config_path))
        self.config['kind'] = 'config'
        self.validate(self.config)

        self.course_code_regex = re.compile(self.config.course_code_regex)
        self.relative = relative

        # Running monitor of validated course and section codes.
        self.seen = {}

        if tracker is None:  # Used during self-contained validation.
            self.tracker = Tracker(self.config.school.code)
            self.tracker.mode = 'validating'
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
                settings.PARSING_DIR
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

    @staticmethod
    def schema_validate(data, schema, resolver=None):
        """Validate data object with JSON schema alone.

        Args:
            data (dict): Data object to validate
            schema (TYPE): JSON schema to validate against.
            resolver (None, optional): JSON Schema reference resolution.

        Raises:
            jsonschema.exceptions.ValidationError: Invalid object.
        """
        jsonschema.Draft4Validator(schema, resolver=resolver).validate(data)
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
                    raise JsonValidationError("duplicate key: %r" % (k,))
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

    def validate_self_contained(self, datafile,
                                break_on_error=False,
                                break_on_warning=False,
                                output_error=None,
                                display_progress_bar=True):

        # Add functionality to tracker.
        # TODO -- fix hardcoded master log file
        self.tracker.add_viewer(settings.PARSING_DIR + '/logs/master.log')
        if display_progress_bar:
            def formatter(stats):
                return '{}/{}'.format(stats['valid'], stats['total'])
            self.tracker.add_viewer(
                ProgressBar(self.config.school.code, formatter)
            )
        self.tracker.start()

        logger = Logger(errorfile=output_error)

        try:
            # self.validate_directory(directory)
            data = Validator.file_to_json(datafile)
            Validator.schema_validate(data, *Validator.SCHEMAS.datalist)
        except (JsonValidationError, json.scanner.JSONDecodeError) as e:
            logger.log(e)
            raise e  # fatal error, cannot continue

        # TODO - iter errors and catch exceptions within method
        for obj in data:
            obj = DotDict(obj)
            try:
                self.kind_to_validation_function[obj.kind](obj)
                self.tracker.status = dict(kind=obj.kind, status='valid')
            except JsonValidationError as e:
                logger.log(e)
                if break_on_error:
                    raise e
            except JsonValidationWarning as e:
                logger.log(e)
                if break_on_warning:
                    raise e
            self.tracker.status = dict(kind=obj.kind, status='total')
            # TODO - delay tracker update to progress bar

        self.tracker.end()

    def validate_course(self, course):
        """Validate course.

        Args:
            course (DotDict): Course object to validate.

        Raises:
            JsonDuplicationWarning: TODO
            JsonValidationError: Invalid course.
        """
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
            self.validate_section(section)

        if not self.relative:
            return

        if course.code in self.seen:
            raise JsonDuplicationWarning(
                'multiple definitions of course {}'.format(course.code),
                course
            )
        self.seen.setdefault(course.code, {})

    def validate_section(self, section):
        """Validate section object.

        Args:
            section (DotDict): Section object to validate.

        Raises:
            JsonDuplicationWarning: TODO
            JsonValidationError: Invalid section.
        """
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

            # NOTE: mutating obj
            meeting.course = section.course
            meeting.section = {'code': section.code}
            self.validate_meeting(meeting)

        if 'textbooks' in section:
            for textbook in section.textbooks:
                self.validate_textbook_link(textbook)

        if not self.relative:
            return

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
                    section.code,
                    section.year
                ),
                section
            )

        update(self.seen[section.course.code],
               {section.code: {section.year: section.term}})

    def validate_meeting(self, meeting):
        """Validate meeting object.

        Args:
            meeting (DotDict): Meeting object to validate.

        Raises:
            e: TODO
            JsonValidationError: Invalid meeting.
        """
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
                self.validate_time_range(meeting.time.start, meeting.time.end)
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
        if not self.relative:
            return
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

    def validate_eval(self, course_eval):
        """Validate evaluation object.

        Args:
            course_eval (DotDict): Evaluation to validate.

        Raises:
            JsonValidationError: Invalid evaulation.
        """
        if not isinstance(course_eval, DotDict):
            course_eval = DotDict(course_eval)
        if self.course_code_regex.match(course_eval.course.code) is None:
            raise JsonValidationError(
                "course code {} does not match r'{}'".format(
                    course_eval.course.code,
                    self.config.course_code_regex
                ),
                course_eval
            )

    def validate_instructor(self, instructor):
        """Validate instructor object.

        Args:
            instructor (DotDict): Instructor object to validate.

        Raises:
            e: TODO
            JsonValidationError: Invalid instructor.
        """
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

    def validate_final_exam(self, final_exam):
        """Validate final exam.

        Args:
            final_exam (DotDict): Final Exam object to validate.

        Raises:
            e: TODO
            JsonValidationError: Invalid Final Exam.
        """
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

    def validate_textbook_link(self, textbook_link):
        """Validate textbook link.

        Args:
            textbook_link (DotDict): Textbook link object to validate.

        Raises:
            JsonValidationError: Invalid textbook link.
        """
        if 'course' not in textbook_link:
            return
        if self.course_code_regex.match(textbook_link.course.code) is not None:
            return
        raise JsonValidationError(
            'textbook_link course code doent match course code regex',
            textbook_link
        )

    def validate_location(self, location):
        """Validate location.

        Args:
            location (DotDict): Location object to validate.

        Raises:
            JsonValidationWarning: Invalid location.
        """
        if 'campus' in location and 'campuses' in self.config:
            if location.campus not in self.config.campuses:
                raise JsonValidationWarning(
                    'campus {} not in config'.format(location.campus),
                    location
                )
        if 'building' in location and 'buildings' in self.config:
            if location.building not in self.config.buildings:
                raise JsonValidationWarning(
                    'building {} not in config'.format(location.building),
                    location
                )

    @staticmethod
    def validate_website(url):
        """Validate url by sending HEAD request and analyzing response.

        Args:
            url (str): URL to validate.

        Raises:
            JsonValidationError: If URL is invalid.
        """
        c = httplib.HTTPConnection(url)
        c.request('HEAD', '')
        # NOTE: 200 - good status
        #       301 - redirected
        if c.getresponse().status == 200 or c.getresponse().status == 301:
            return
        raise JsonValidationError('invalid website w/url "%s"'.format(url),
                                  {'url': url})

    def validate_time_range(self, start, end):
        """Validate start time is less than end time.

        There exists an unhandled case if the end time is midnight.

        Args:
            start (str): Start time.
            end (str): End time.

        Raises:
            JsonValidationError: If time range invalid.
        """
        try:
            start, end = map(dparser.parse, [start, end])
        except ValueError:
            raise JsonValidationError('invalid time range {}-{}', start, end)

        if start >= end:
            raise JsonValidationError('start {} >= end {}', start, end)
        # NOTE: there exists an unhandled case if the end time is midnight.

    def validate_directory(self, directory):
        """Validate directory.

        Args:
            directory (str, dict): Directory to validate.
                May be either path or object.

        Raises:
            e: TODO
        """
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
