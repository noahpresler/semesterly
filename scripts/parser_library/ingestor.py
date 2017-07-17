"""
Data Pipeline - Ingestor.

@org      Semesterly
@author   Michael N. Miller
@date     07/17/2017
"""

from __future__ import absolute_import, division, print_function

import re
import jsonschema

from scripts.parser_library.internal_exceptions import IngestorError, \
    IngestorWarning
from scripts.parser_library.internal_exceptions import JsonValidationError, \
    JsonValidationWarning, JsonDuplicationWarning
from scripts.parser_library.internal_utils import make_list
from scripts.parser_library.logger import JsonListLogger
from scripts.parser_library.tracker import NullTracker
from scripts.parser_library.validator import Validator


class Ingestor(dict):
    """Ingest parsing data into formatted json.

    Mimics functionality of dict.

    Attributes:
        ALL_KEYS (set): Set of keys supported by Ingestor.
        break_on_error (bool): Break/cont on errors.
        break_on_warning (bool): Break/cont on warnings.
        logger (parser_library.logger): Logger object.
        school (str): School code (e.g. jhu, gw, umich).
        skip_shallow_duplicates (bool): Hide warnings for repeated definitions.
        tracker (parser_library.tracker): Tracker object.
        UNICODE_WHITESPACE (TYPE): regex that matches Unicode whitespace.
        validate (bool): Enable/disable validation.
        validator (parser_library.validator): Validator instance.
    """

    UNICODE_WHITESPACE = re.compile(r'(?:\u00a0)|(?:\xc2\xa0)', re.IGNORECASE)

    ALL_KEYS = {
        'school',
        'kind',
        'department',
        'dept',
        'department_name',
        'department_code',
        'dept_name',
        'dept_code',
        'code', 'course_code', 'course',
        'name',
        'course_name',
        'prerequisites',
        'prereqs',
        'corequisites',
        'coreqs',
        'exclusions',
        'description',
        'descr',
        'areas',
        'level',
        'cores',
        'geneds',
        'homepage',
        'website',
        'instructors',
        'instructors', 'instructor', 'instr', 'instrs', 'instr_name',
        'instr_names', 'instructor', 'instructor_name',
        'section', 'sections', 'section_code', 'section_name',
        'meeting_section',
        'section_type', 'type',
        'term',
        'semester',
        'year',
        'instructors',
        'capacity', 'size',
        'enrollment', 'enrolment',
        'waitlist', 'waitlist_size',
        'remaining_seats',
        'fees', 'fee',
        'final_exam',
        'offerings',
        'time_start',
        'start_time',
        'time_end',
        'end_time',
        'location',
        'loc', 'where',
        'days', 'day', 'dates', 'date',
        'time',
        'credits', 'num_credits',
        'campus',  # NOTE: not really
        'textbooks', 'isbn', 'required',
        'detail_url', 'image_url', 'author', 'title',
    }

    def __init__(self, school,
                 validate=True,
                 config_path=None,
                 output_path=None,
                 output_error_path=None,
                 break_on_error=True,
                 break_on_warning=False,
                 skip_shallow_duplicates=True,
                 hide_progress_bar=False,
                 tracker=NullTracker()):
        """Construct ingestor object and resolve options.

        Also validates school directory.

        Args:
            school (string): The school code (e.g. jhu, gw, umich).
            validate (bool, optional): Perform validation?
            config_path (None, optional): Configuration file path.
            output_path (None, optional): Json output path.
            output_error_path (None, optional): Pipeline error path.
            break_on_error (bool, optional): Stop ingesting on error.
            break_on_warning (bool, optional): Stop ingesting on warning.
            skip_shallow_duplicates (bool, optional): Skip ingesting courses
                that have already been seen.
            hide_progress_bar (bool, optional): Hide ingestion progress bar?
            tracker (parser_library.tracker, optional): tracker object
        """
        self.school = school
        self.validate = validate
        self.break_on_error = break_on_error
        self.break_on_warning = break_on_warning
        self.skip_shallow_duplicates = skip_shallow_duplicates

        directory = 'scripts/{}'.format(school)
        # Validator.validate_school_directory(directory)
        if config_path is None:
            config_path = '{}/config.json'.format(directory)
        if output_path is None:
            output_path = '{}/data/courses.json'.format(directory)
        if output_error_path is None:
            output_error_path = '{}/logs/error.log'.format(directory)

        # Initialize loggers for json and errors.
        self.logger = JsonListLogger(logfile=output_path,
                                     errorfile=output_error_path)
        self.logger.open()

        self.tracker = tracker
        self.tracker.set_mode('ingesting')

        self.validator = Validator(config_path, tracker=self.tracker)

        # Inherit dictionary functionality.
        super(Ingestor, self).__init__()

    def _get(self, *keys, **kwargs):
        """Match the first key found in self dictionary.

        Note that this is purposefully not an override to __get__.
        This allows the Ingestor to maintain dictionary-like
        functionality for the API user while internally checking itself.

        Args:
            *keys: The list of keys.
            **kwargs: default return option
                TODO - Change on update to Python3

        Returns:
            The value of the key in the Ingestor instance.

        Raises:
            IngestorError: Enforce Ingestor.ALL_KEYS
        """
        default = kwargs.get('default')
        for key in keys:
            if key not in Ingestor.ALL_KEYS:
                raise IngestorError('{} not in Ingestor.ALL_KEYS'.format(key))
            if key not in self:
                continue
            return self[key]
        return default

    def ingest_course(self):
        """Create course json from info in model map.

        Returns:
            dict: course
        """
        # support nested and non-nested department ingestion
        department = self._get('department')
        if ('department' not in self or
                ('department_name' in self or
                    'department_code' in self or
                    'dept_name' in self or
                    'dept_code' in self)):
            # if not isinstance(self._get('department', 'dept'), dict):
            department = {
                'name': self._get('department_name', 'dept_name'),
                'code': self._get('department_code', 'dept_code')
            }

        course = {
            'kind': 'course',
            'school': {
                'code': self.school
            },
            'code': self._get('course_code', 'code', 'course'),
            'name': self._get('name', 'course_name'),
            'department': department,
            'credits': self._get('credits', 'num_credits'),
            'prerequisites': make_list(self._get('prerequisites', 'prereqs')),
            'corequisites': make_list(self._get('corequisites', 'coreqs')),
            'exclusions': make_list(self._get('exclusions')),
            'description': make_list(self._get('description', 'descr')),
            'areas': self._get('areas'),
            'level': self._get('level'),
            'cores': make_list(self._get('cores')),
            'geneds': make_list(self._get('geneds')),
            'sections': self._get('sections'),
            'homepage': self._get('homepage', 'website'),
        }

        course = Ingestor._clean(course)
        self._validate_and_log(course)
        if 'department' in course:
            self.tracker.track_department(course['department'])
        return course

    def ingest_section(self, course):
        """Create section json object from info in model map.

        Args:
            course (dict): mapping

        Returns:
            dict: section

        Raises:
            IngestorWarning: cannot resolve key
        """
        # handle nested instructor definition and resolution
        instructors = None
        instr_keys = set(
            [
                'instructors',
                'instructor',
                'instr',
                'instrs',
                'instr_name',
                'instr_names',
                'instructor',
                'instructor_name',
                'instructors'
            ]) & set(self)

        if len(instr_keys) == 1:
            instructors = self[list(instr_keys)[0]]
            instructors = Ingestor._clean(make_list(instructors))
            if instructors is not None:
                for i in range(len(instructors)):
                    if isinstance(instructors[i], basestring):
                        instructors[i] = {'name': instructors[i]}
        elif len(instr_keys) > 1:
            raise IngestorWarning(
                'cannot resolve instructors from keys: {}'.format(
                    ','.join(instr_keys)
                ),
                self
            )

        section = {
            'kind': 'section',
            'course': {
                'code': course['code']
            },
            'code': self._get('section_code', 'section',
                              'meeting_section'),
            'name': self._get('section_name'),
            'term': self._get('term', 'semester'),
            'year': self._get('year'),
            'instructors': instructors,
            'capacity': self._get('capacity', 'size'),
            'enrollment': self._get('enrollment', 'enrolment'),
            'waitlist': self._get('waitlist'),
            'waitlist_size': self._get('waitlist_size'),
            'remaining_seats': self._get('remaining_seats'),
            'type': self._get('type', 'section_type'),
            'fees': self._get('fees', 'fee'),
            'final_exam': self._get('final_exam'),
            'textbooks': self._get('textbooks'),
            'meetings': self._get('offerings')
        }

        section = Ingestor._clean(section)
        self._validate_and_log(section)
        self.tracker.track_year(section['year'])
        self.tracker.track_term(section['term'])
        return section

    def ingest_meeting(self, section):
        """Create meeting ingested json map.

        Args:
            section (dict): section info

        Returns:
            dict: meeting
        """
        # Nested time definition.
        time = self._get('time')
        if 'time' not in self:
            time = {
                'start': self._get('time_start', 'start_time'),
                'end': self._get('time_end', 'end_time')
            }

        # Nested location definition.
        location = self._get('location')
        if isinstance(self._get('location', 'loc', 'where'), basestring):
            location = {'where': self._get('location', 'loc', 'where')}

        meeting = {
            'kind': 'meeting',
            'course': section['course'],
            'section': {
                'code': section['code'],
                'year': self._get('year'),
                'term': self._get('term', 'semester')
            },
            'days': make_list(self._get('days', 'day')),
            'dates': make_list(self._get('dates', 'date')),
            'time': time,
            'location': location
        }

        meeting = Ingestor._clean(meeting)
        self._validate_and_log(meeting)
        return meeting

    def ingest_textbook_link(self, section=None):
        """Create textbook link json object.

        Args:
            section (None, :obj:`dict`, optional): Description
        Returns:
            dict: textbook link.
        """
        textbook_link = {
            'kind': 'textbook_link',
            'school': {
                'code': self._get('school', 'school_code')
            },
            'course': {
                'code': self._get('course_code')
            },
            'section': {
                'code': self._get('section_code'),
                'year': self._get('year'),
                'term': self._get('term', 'semester')
            },
            'isbn': self._get('isbn'),
            'required': self._get('required')
        }

        textbook_link = Ingestor._clean(textbook_link)
        self._validate_and_log(textbook_link)
        self.tracker.track_year(textbook_link['section']['year'])
        self.tracker.track_term(textbook_link['section']['term'])
        if 'department' in self:
            self.tracker.track_department(self['department'])
        return textbook_link

    def ingest_textbook(self):
        """Create textbook json object.

        Returns:
            dict: textbook
        """
        textbook = {
            'kind': 'textbook',
            'isbn': self._get('isbn'),
            'detail_url': self._get('detail_url'),
            'image_url': self._get('image_url'),
            'author': self._get('author'),
            'title': self._get('title')
        }

        textbook = Ingestor._clean(textbook)
        self._validate_and_log(textbook)
        if 'department' in self:
            self.tracker.track_department(self['department'])
        return textbook

    def wrap_up(self):
        """Finish ingesting by closing i/o and clearing internal state."""
        self.logger.close()
        self.clear()

    def _validate_and_log(self, obj):
        if self.validate is False:
            self.logger.log(obj)
            self.tracker.track_count(obj['kind'], 'total')
            return

        is_valid, skip = self._run_validator(obj)
        if skip:
            return
        if is_valid:
            self.logger.log(obj)
        try:
            for key in self:
                if key in Ingestor.ALL_KEYS:
                    continue
                raise IngestorWarning(
                    'ingestor does not support key {}'.format(key),
                    self
                )
        except IngestorWarning as e:
            is_valid = True
            self.logger.log(e)
            if self.break_on_warning:
                raise e
        self.tracker.track_count(obj['kind'], 'total')

    def _run_validator(self, data):
        is_valid = False
        full_skip = False

        try:
            self.validator.validate(data)
            self.tracker.track_count(data['kind'], 'valid')
            is_valid = True
        except jsonschema.exceptions.ValidationError as e:
            # Wrap error along with json object in another error
            e = JsonValidationError(str(e), data)
            self.logger.log(e)
            if self.break_on_error:
                raise e
        except JsonValidationError as e:
            self.logger.log(e)
            if self.break_on_error:
                raise e
        except (JsonValidationWarning, JsonDuplicationWarning) as e:
            if (isinstance(e, JsonDuplicationWarning) and
                    self.skip_shallow_duplicates):
                full_skip = True
            else:
                is_valid = True
                self.logger.log(e)
                if self.break_on_warning:
                    raise e

        return is_valid, full_skip

    @staticmethod
    def _clean(dirt):
        """Recursively clean json-like object.

        `list`::
            - remove `None` elements
            - `None` on empty list

        `dict`::
            - filter out None valued key, value pairs
            - `None` on empty dict

        `basestring`::
            - convert unicode whitespace to ascii
            - strip extra whitespace
            - None on empty string

        Args:
            dirt: the object to clean

        Returns:
            Cleaned `dict`, cleaned `list`, cleaned `string`, or pass-through.
        """
        cleaned = None

        if isinstance(dirt, dict):
            cleaned = {}
            for k, v in dirt.items():
                cleaned_value = Ingestor._clean(v)
                if cleaned_value is None:
                    continue
                cleaned[k] = cleaned_value
        elif isinstance(dirt, list):
            cleaned = filter(
                lambda x: x is not None,
                map(Ingestor._clean, dirt)
            )
        elif isinstance(dirt, basestring):
            cleaned = Ingestor.UNICODE_WHITESPACE.sub(' ', dirt).strip()
        else:
            return dirt

        if len(cleaned) == 0:
            return None
        return cleaned
