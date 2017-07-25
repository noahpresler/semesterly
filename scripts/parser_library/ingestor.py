"""
Parsing library Ingestor.

@org      Semeseterly
@author   Michael N. Miller
@date     1/13/17
"""

from __future__ import absolute_import, division, print_function

import jsonschema

from scripts.parser_library.internal_utils import *

from scripts.parser_library.internal_exceptions import IngestorWarning
from scripts.parser_library.internal_exceptions import JsonValidationError, \
    JsonValidationWarning, JsonDuplicationWarning
from scripts.parser_library.logger import JsonListLogger
from scripts.parser_library.tracker import NullTracker
from scripts.parser_library.validator import Validator


class Ingestor(dict):
    """Ingest parsing data into formatted json."""

    ALL_KEYS = {
        'school',
        'kind',
        'department',
        'dept',
        'department_name',
        'department_code',
        'dept_name',
        'dept_code',
        'code',
        'course_code',
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
        """Construct ingestor object and resolve kwargs."""
        self.school = school
        self.validate = validate
        self.break_on_error = break_on_error
        self.break_on_warning = break_on_warning
        self.skip_shallow_duplicates = skip_shallow_duplicates

        # TODO - validate that this directory actually exists and is correct
        directory = 'scripts/{}'.format(school)
        if not config_path:
            config_path = '{}/config.json'.format(directory)
        if not output_path:
            output_path = '{}/data/courses.json'.format(directory)
        if not output_error_path:
            output_error_path = '{}/logs/error.log'.format(directory)

        # Initialize loggers for json and errors.
        self.logger = JsonListLogger(logfile=output_path,
                                     errorfile=output_error_path)
        self.logger.open()

        # Setup tracker for digestion and progress bar.
        self.tracker = tracker
        self.tracker.set_mode('ingesting')

        self.validator = Validator(config_path, tracker=self.tracker)

        super(Ingestor, self).__init__()  # Adds dictionary functionality.

    def getchain(self, *keys):
        """Match the first key found in self dictionary."""
        for key in keys:
            if key in self:
                return self[key]
        return None

    def ingest_course(self):
        """Create course json from info in model map.

        Returns:
            json object model for a course
        """
        # support nested and non-nested department ingestion
        department = self.get('department')
        if ('department' not in self) or
                ('department_name' in self or
                    'department_code' in self or
                    'dept_name' in self or
                    'dept_code' in self):
            # if not isinstance(self.getchain('department', 'dept'), dict):
            department = {
                'name': self.getchain('department_name', 'dept_name'),
                'code': self.getchain('department_code', 'dept_code')
            }

        course = {
            'kind': 'course',
            'school': {
                'code': self.school
            },
            'code': self.getchain('code', 'course_code'),
            'name': self.getchain('name', 'course_name'),
            'department': department,
            'credits': self.getchain('credits', 'num_credits'),
            'prerequisites': deep_clean(make_list(self.getchain('prerequisites', 'prereqs'))),
            'corequisites': deep_clean(make_list(self.getchain('corequisites', 'coreqs'))),
            'exclusions': deep_clean(make_list(self.get('exclusions'))),
            'description': deep_clean(make_list(self.getchain('description', 'descr'))),
            'areas': deep_clean(self.get('areas')),
            'level': self.get('level'),
            'cores': deep_clean(make_list(self.get('cores'))),
            'geneds': deep_clean(make_list(self.get('geneds'))),
            'sections': self.get('sections'),
            'homepage': self.getchain('homepage', 'website'),
        }
        course = cleandict(course)
        self._validate_and_log(course)
        if 'department' in course:
            self.tracker.track_department(course['department'])
        return course

    def ingest_section(self, course):
        """Create section json object from info in model map.

        Args:
            course: course info mapping

        Returns:
            json object model for a section
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

        if len(instr_keys) == 0:
            pass
        elif len(instr_keys) > 1:
            raise IngestorWarning('cannot resolve instructors data ({})'.format(','.join(instr_keys)), self)
        else:  # len(instr_keys) == 1
            instructors = self[list(instr_keys)[0]]
            instructors = deep_clean(make_list(instructors))
            if instructors is not None:
                for i in range(len(instructors)):
                    if isinstance(instructors[i], basestring):
                        instructors[i] = {'name': instructors[i]}

        section = {
            'kind': 'section',
            'course': {
                'code': course['code']
            },
            'code': self.getchain('section_code', 'section', 'meeting_section'), # NOTE: design conflict with code in course
            'name': self.get('section_name'),
            'term': self.getchain('term', 'semester'),
            'year': self.get('year'),
            'instructors': instructors,
            'capacity': self.getchain('capacity', 'size'),
            'enrollment': self.getchain('enrollment', 'enrolment'),
            'waitlist': self.get('waitlist'),
            'waitlist_size': self.get('waitlist_size'),
            'remaining_seats': self.get('remaining_seats'),
            'type': self.getchain('type', 'section_type'),
            'fees': self.getchain('fees', 'fee'),
            'final_exam': self.get('final_exam'),
            'textbooks': self.get('textbooks'),
            'meetings': self.get('offerings')
        }

        section = cleandict(section)
        self._validate_and_log(section)
        self.tracker.track_year(section['year'])
        self.tracker.track_term(section['term'])
        return section

    def ingest_offerings(self, section):
        self.ingest_meeting(section)

    def ingest_offering(self, section):
        self.ingest_meeting(section)

    def ingest_meeting(self, section):
        """Create meeting ingested json map.

        Args:
            section: section info mapping
        Returns:
            json object model for a meeting
        """
        # Handle nested time definition.
        time = self.get('time')
        if 'time' not in self:
            time = {
                'start': self.getchain('time_start', 'start_time'),
                'end': self.getchain('time_end', 'end_time')
            }

        # handle nested location definition
        location = self.get('location')
        if isinstance(self.getchain('location', 'loc', 'where'), basestring):
            location = {'where': self.getchain('location', 'loc', 'where')}

        meeting = {
            'kind': 'meeting',
            'course': section['course'],
            'section': {
                'code': section['code'],
                'year': self.get('year'),
                'term': self.getchain('term', 'semester')
            },
            'days': deep_clean(make_list(self.getchain('days', 'day'))),
            'dates': deep_clean(make_list(self.getchain('dates', 'date'))),
            'time': time,
            'location': location
        }

        meeting = cleandict(meeting)
        self._validate_and_log(meeting)
        return meeting

    def ingest_textbook_link(self, section=None):
        """Create textbook link json object.

        Args:
            section{dict}: valid section definition
        Returns:
            the textbook_link as a json object
        """
        textbook_link = {
            'kind': 'textbook_link',
            'school': {
                'code': self.getchain('school', 'school_code')
            },
            'course': {
                'code': self.get('course_code')
            },
            'section': {
                'code': self.get('section_code'),
                'year': self.get('year'),
                'term': self.getchain('term', 'semester')
            },
            'isbn': self.get('isbn'),
            'required': self.get('required')
        }

        textbook_link = cleandict(textbook_link)
        self._validate_and_log(textbook_link)
        self.tracker.track_year(textbook_link['section']['year'])
        self.tracker.track_term(textbook_link['section']['term'])
        if 'department' in self:
            self.tracker.track_department(self['department'])
        return textbook_link

    def ingest_textbook(self):
        """Create textbook json object.

        Returns:
            json object model for textbook
        """
        textbook = {
            'kind': 'textbook',
            'isbn': self.get('isbn'),
            'detail_url': self.get('detail_url'),
            'image_url': self.get('image_url'),
            'author': self.get('author'),
            'title': self.get('title')
        }

        textbook = cleandict(textbook)
        self._validate_and_log(textbook)
        if 'department' in self:
            self.tracker.track_department(self['department'])
        return textbook

    def wrap_up(self):
        """Finish ingesting by closing i/o and clearing internal state."""
        self.logger.close()
        self.clear()

    def _validate_and_log(self, obj):
        if self.validate:
            is_valid, skip = self._run_validator(obj)
            if skip:
                return
            if is_valid:
                self.logger.log(obj)
            # Ingestor warning
            try:
                for key in self:
                    if key not in Ingestor.ALL_KEYS:
                        raise IngestorWarning(
                            'ingestor does not support key {}'.format(key),
                            self
                        )
            except IngestorWarning as e:
                is_valid = True
                self.logger.log(e)
                if self.break_on_warning:
                    raise e
        else:
            self.logger.log(obj)
        self.tracker.track_count(obj['kind'], 'total')

    def _run_validator(self, data):
        is_valid, full_skip = False, False
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
