"""
Data Pipeline - Ingestor.

@org      Semesterly
@author   Michael N. Miller
@date     07/17/2017
"""

from __future__ import absolute_import, division, print_function

import jsonschema

from parsing.library.internal_exceptions import JsonValidationError, \
    JsonValidationWarning, JsonDuplicationWarning, IngestorError, \
    IngestorWarning
from parsing.library.logger import JsonListLogger
from parsing.library.tracker import NullTracker
from parsing.library.validator import Validator

# from parsing.library.exceptions import PipelineError, PipelineWarning
from parsing.library.utils import clean, make_list


# class IngestorError(PipelineError):
#     """Ingestor error class."""


# class IngestorWarning(PipelineWarning):
#     """Ingestor warning class."""


class Ingestor(dict):
    """Ingest parsing data into formatted json.

    Mimics functionality of dict.

    Attributes:
        ALL_KEYS (set): Set of keys supported by Ingestor.
        break_on_error (bool): Break/cont on errors.
        break_on_warning (bool): Break/cont on warnings.
        logger (library.logger): Logger object.
        school (str): School code (e.g. jhu, gw, umich).
        skip_duplicates (bool): Skip ingestion for repeated definitions.
        tracker (library.tracker): Tracker object.
        UNICODE_WHITESPACE (TYPE): regex that matches Unicode whitespace.
        validate (bool): Enable/disable validation.
        validator (library.validator): Validator instance.
    """

    # INSTRUCTOR = (
    #     'instr',
    #     'instrs',
    # )

    # DEPARTMENT = (
    #     'dept',
    #     ('dept_code', 'dept_name')
    # )

    # LOCATION = (
    #     'loc',
    # )

    # TIME = (
    #     'time',
    #     ('time_start', 'time_end')
    # )

    # def _resolve(self, *args, **kwargs):
    #     unique = kwargs.get('unique', True)
    #     keys = set()
    #     groups = filter(lambda x: isinstance(x, tuple), args)
    #     for group in groups:
    #         keys |= set(self._resolve(group, unique=False))
    #     more_keys |= set(filter(lambda x: isinstance(x, basestring), args)) & set(self)
    #     if more_keys is None:
    #         unique = False
    #     keys |= more_keys
    #     if len(keys) == 0:
    #         return
    #     elif unique and len(keys) > 1:
    #         raise IngestorError('Cannot resolve {}'.format(keys))
    #     if unique:
    #         return list(keys)[0]
    #     return keys

    # def _resolve_instructors(self):
    #     key = self._resolve(*Ingestor.INSTRUCTOR)
    #     if key is None:
    #         return

    #     instructors = make_list(self._get(key))
    #     for idx, instructor in enumerate(instructors):
    #         if not isinstance(instructors[i], basestring):
    #             continue
    #         instructors[idx] = {'name': instructors[idx]}
    #     return instructors

    # def _resolve_department(self):
    #     # key = self._resolve('dept_code', 'dept_name', unique=False)
    #     # if key is not None:
    #     #     return {
    #     #         'code': self._get('dept_code'),
    #     #         'dept': self._get('dept_name')
    #     #     }
    #     # key = self._resolve('time')
    #     # if key is None:
    #     #     return
    #     # return self._get(key)

    #     key = self._resolve(*Ingestor.DEPARTMENT)
    #     if key is None:
    #         return

    #     department = self_get(key)
    #     if isinstance(department, basestring):
    #         department = {'name': department}
    #     return department

    # def _location(self):
    #     location = self._resolve(*Ingestor.LOCATION)
    #     if location is None:
    #         return

    #     if isinstance(location, basestring):
    #         location = {'where': location}
    #     return location

    # def _time(self):
    #     key = self._resolve('time')
    #     keys = self._resolve('time_start', 'time_end', unique=False)
    #     if keys is not None:
    #         if key is not None:
    #             raise IngestorError('Cannot resolve {}'.format(set(keys) | set([key])))
    #         return {
    #             'start': self._get('time_start'),
    #             'end': self._get('time_end')
    #         }
    #     key = self._resolve('time')
    #     if key is None:
    #         return
    #     return self._get(key)

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
        'fees', 'fee', 'cost',
        'final_exam',
        'offerings',
        'time_start', 'start_time',
        'time_end', 'end_time',
        'location',
        'loc', 'where',
        'days', 'day', 'dates', 'date',
        'time',
        'credits', 'num_credits',
        'campus',  # NOTE: not really
        'textbooks', 'isbn', 'required',
        'detail_url', 'image_url', 'author', 'title',
        'score',
        'summary',
    }

    def __init__(self, school, config_path, output_path, output_error_path,
                 break_on_error=True,
                 break_on_warning=False,
                 display_progress_bar=True,
                 skip_duplicates=True,
                 validate=True,
                 tracker=NullTracker()):
        """Construct ingestor object and resolve options.

        Args:
            school (string): The school code (e.g. jhu, gw, umich).
            config_path (str): Configuration file path.
            output_path (str): Output path.
            output_error_path (str): Error output path.
            break_on_error (bool, optional): Stop ingesting on error.
            break_on_warning (bool, optional): Stop ingesting on warning.
            display_progress_bar (bool, optional): display progress bar
            skip_duplicates (bool, optional): Skip ingesting courses
                that have already been seen.
            validate (bool, optional): Perform validation?
            tracker (library.tracker, optional): tracker object
        """
        self.school = school
        self.validate = validate
        self.break_on_error = break_on_error
        self.break_on_warning = break_on_warning
        self.skip_duplicates = skip_duplicates
        self.tracker = tracker

        # Initialize loggers for json and errors.
        self.logger = JsonListLogger(logfile=output_path,
                                     errorfile=output_error_path)
        if self.validate:
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
                TODO - Change if update to Python3

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

    def _resolve_department(self):
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
        return department

    def _resolve_instructors(self):
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
            instructors = clean(make_list(instructors))
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
        return instructors

    def _resolve_time(self):
        time = self._get('time')
        if 'time' not in self:
            time = {
                'start': self._get('time_start', 'start_time'),
                'end': self._get('time_end', 'end_time')
            }
        return time

    def _resolve_location(self):
        location = self._get('location')
        if isinstance(self._get('location', 'loc', 'where'), basestring):
            location = {'where': self._get('location', 'loc', 'where')}
        return location

    def ingest_course(self):
        """Create course json from info in model map.

        Returns:
            dict: course
        """
        course = {
            'kind': 'course',
            'school': {
                'code': self.school
            },
            'code': self._get('course_code', 'code', 'course'),
            'name': self._get('name', 'course_name'),
            'department': self._resolve_department(),
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

        course = clean(course)
        self._validate_and_log(course)
        if 'department' in course:
            self.tracker.department = course['department']
        return course

    def ingest_section(self, course):
        """Create section json object from info in model map.

        Args:
            course (dict): validated course object

        Returns:
            dict: section

        Raises:
            IngestorWarning: cannot resolve key
        """
        section = {
            'kind': 'section',
            'course': {
                'code': course['code']
            },
            'code': self._get('section_code', 'section',
                              'meeting_section'),
            'name': self._get('section_name'),
            'term': self._get('term', 'semester'),
            'year': str(self._get('year')),
            'instructors': self._resolve_instructors(),
            'capacity': self._get('capacity', 'size'),
            'enrollment': self._get('enrollment', 'enrolment'),
            'waitlist': self._get('waitlist'),
            'waitlist_size': self._get('waitlist_size'),
            'remaining_seats': self._get('remaining_seats'),
            'type': self._get('type', 'section_type'),
            'fees': self._get('fees', 'fee', 'cost'),
            'final_exam': self._get('final_exam'),
            'textbooks': self._get('textbooks'),
            'meetings': self._get('offerings')
        }

        section = clean(section)
        self._validate_and_log(section)
        if 'year' in section:
            self.tracker.year = section['year']
        if 'term' in section:
            self.tracker.term = section['term']
        return section

    def ingest_meeting(self, section):
        """Create meeting ingested json map.

        Args:
            section (dict): validated section object

        Returns:
            dict: meeting
        """
        meeting = {
            'kind': 'meeting',
            'course': section['course'],
            'section': {
                'code': section['code'],
                'year': str(self._get('year')),
                'term': self._get('term', 'semester')
            },
            'days': make_list(self._get('days', 'day')),
            'dates': make_list(self._get('dates', 'date')),
            'time': self._resolve_time(),
            'location': self._resolve_location()
        }

        meeting = clean(meeting)
        self._validate_and_log(meeting)
        if 'time' in meeting:
            self.tracker.time = meeting['time']['start']
            self.tracker.time = meeting['time']['end']
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
                'year': str(self._get('year')),
                'term': self._get('term', 'semester')
            },
            'isbn': self._get('isbn'),
            'required': self._get('required')
        }

        textbook_link = clean(textbook_link)
        self._validate_and_log(textbook_link)
        self.tracker.year = textbook_link['section']['year']
        self.tracker.term = textbook_link['section']['term']
        if 'department' in self:
            self.tracker.department = self['department']
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

        textbook = clean(textbook)
        self._validate_and_log(textbook)
        if 'department' in self:
            self.tracker.department = self['department']
        return textbook

    def ingest_eval(self):
        """Create evaluation json object.

        Returns:
            dict: eval
        """
        evaluation = {
            'kind': 'eval',
            'year': str(self._get('year')),
            'term': self._get('term'),
            'score': float(self._get('score')),
            'instructors': self._resolve_instructors(),
            'course': {
                'code': self._get('course_code')
            }
        }

        evaluation = clean(evaluation)
        self._validate_and_log(evaluation)
        self.tracker.year = evaluation['year']
        self.tracker.term = evaluation['term']
        return evaluation

    def wrap_up(self):
        """Finish ingesting by closing i/o and clearing internal state."""
        self.logger.close()
        self.clear()

    def _validate_and_log(self, obj):
        if self.validate is False:
            self.logger.log(obj)
            self.tracker.status = dict(kind=obj['kind'], status='total')
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
        self.tracker.status = dict(kind=obj['kind'], status='total')

    def _run_validator(self, data):
        is_valid = False
        full_skip = False

        try:
            self.validator.validate(data)
            self.tracker.status = dict(kind=data['kind'], status='valid')
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
                    self.skip_duplicates):
                full_skip = True
            else:
                is_valid = True
                self.logger.log(e)
                if self.break_on_warning:
                    raise e

        return is_valid, full_skip
