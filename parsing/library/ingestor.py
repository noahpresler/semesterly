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

import logging

from parsing.library.logger import JSONStreamWriter
from parsing.library.tracker import NullTracker
from parsing.library.validator import Validator
from parsing.library.viewer import Hoarder
from parsing.library.utils import clean, make_list, safe_cast, titlize, time24, short_date
from parsing.library.exceptions import PipelineError, PipelineWarning
from parsing.library.validator import ValidationError, ValidationWarning, \
    MultipleDefinitionsWarning


class IngestionError(PipelineError):
    """Ingestor error class."""


class IngestionWarning(PipelineWarning):
    """Ingestor warning class."""


class Ingestor(dict):
    """Ingest parsing data into formatted json.

    Mimics functionality of dict.

    Attributes:
        ALL_KEYS (set): Set of keys supported by Ingestor.
        break_on_error (bool): Break/cont on errors.
        break_on_warning (bool): Break/cont on warnings.
        school (str): School code (e.g. jhu, gw, umich).
        skip_duplicates (bool): Skip ingestion for repeated definitions.
        tracker (library.tracker): Tracker object.
        UNICODE_WHITESPACE (TYPE): regex that matches Unicode whitespace.
        validate (bool): Enable/disable validation.
        validator (library.validator): Validator instance.
    """

    ALL_KEYS = {
        'school',
        'school_subdivision_code', 'school_subdivision_name',
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
        'offerings', 'meetings',
        'time_start', 'start_time',
        'time_end', 'end_time',
        'date_start',
        'date_end',
        'location',
        'loc', 'where',
        'days', 'day', 'dates', 'date',
        'time',
        'credits', 'num_credits',
        'campus',  # TODO - not really
        'textbooks', 'isbn', 'required',
        'detail_url', 'image_url', 'author', 'title',
        'score',
        'summary',
        'same_as',
        'pos',
        'writing_intensive',
        'sub_school',
        'course_section_id',
    }

    def __init__(self, config, output,
                 break_on_error=True,
                 break_on_warning=False,
                 display_progress_bar=True,
                 skip_duplicates=True,
                 validate=True,
                 tracker=NullTracker()):
        """Construct ingestor object and resolve options.

        Args:
            school (string): The school code (e.g. jhu, gw, umich).
            config (dict): Configuration dictionary.
            output (str, file): Output path or file object.
            break_on_error (bool, optional): Stop ingesting on error.
            break_on_warning (bool, optional): Stop ingesting on warning.
            display_progress_bar (bool, optional): display progress bar
            skip_duplicates (bool, optional): Skip ingesting courses
                that have already been seen.
            validate (bool, optional): Perform validation.
            tracker (library.tracker, optional): tracker object
        """
        self.school = config['school']['code']
        self.validate = validate
        self.break_on_error = break_on_error
        self.break_on_warning = break_on_warning
        self.skip_duplicates = skip_duplicates
        self.tracker = tracker
        self.hoarder = Hoarder()
        self.tracker.add_viewer(self.hoarder)
        self.tracker.school = self.school

        # Initialize loggers for json and errors.
        self.json = JSONStreamWriter(output, type_=dict).enter()
        self.data_list = self.json.write('$data', type_=list).enter()
        if self.validate:
            self.validator = Validator(config, tracker=self.tracker)

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
                raise IngestionWarning(key + ' not in Ingestor.ALL_KEYS')
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
                'name': titlize(self._get('department_name', 'dept_name')),
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
                    if isinstance(instructors[i], str):
                        instructors[i] = {'name': instructors[i]}
        elif len(instr_keys) > 1:
            raise IngestionWarning(
                'cannot resolve instructors from keys: {}'.format(
                    ','.join(instr_keys)
                ),
                self
            )
        return instructors

    def _resolve_date(self):
        dates = self._get('date')
        if 'dates' not in self:
            dates = {
                'start': short_date(self._get('date_start')),
                'end': short_date(self._get('date_end'))
            }
        return dates

    def _resolve_time(self):
        time = self._get('time')
        if 'time' not in self:
            time = {
                'start': time24(self._get('time_start', 'start_time')),
                'end': time24(self._get('time_end', 'end_time'))
            }
        return time

    def _resolve_location(self):
        location = self._get('location')
        if isinstance(self._get('location', 'loc', 'where'), str):
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
                'code': self.school,
                'subdivisions': [
                    {
                        'code': self._get('school_subdivision_code'),
                        'name': self._get('school_subdivision_name')
                    }
                ]
            },
            'code': self._get('course_code', 'code', 'course'),
            'name': titlize(self._get('name', 'course_name')),
            'department': self._resolve_department(),
            'credits': safe_cast(self._get('credits', 'num_credits'), float, default=0.),
            'prerequisites': make_list(self._get('prerequisites', 'prereqs')),
            'corequisites': make_list(self._get('corequisites', 'coreqs')),
            'exclusions': make_list(self._get('exclusions')),
            'areas': make_list(self._get('areas')),
            'level': self._get('level'),
            'cores': make_list(self._get('cores')),
            'geneds': make_list(self._get('geneds')),
            'sections': self._get('sections'),
            'homepage': self._get('homepage', 'website'),
            'same_as': make_list(self._get('same_as')),
            'description': self._get('description', 'descr'),
            'pos': make_list(self._get('pos')),
            'writing_intensive': self._get('writing_intensive'),
            'sub_school': self._get('sub_school'),
            # 'description': extract_info_from_text(
            #     self._get('description', 'descr'),
            #     inject=self
            # ),
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
        """
        section = {
            'kind': 'section',
            'course': {
                'code': course.get('code')
            },
            'code': self._get('section_code', 'section',
                              'meeting_section'),
            'name': titlize(self._get('section_name')),
            'term': self._get('term', 'semester'),
            'year': str(self._get('year')),
            'instructors': self._resolve_instructors(),
            'capacity': safe_cast(self._get('capacity', 'size'), int),
            'enrollment': safe_cast(self._get('enrollment', 'enrolment'), int),
            'waitlist': safe_cast(self._get('waitlist'), int),
            'waitlist_size': safe_cast(self._get('waitlist_size'), int),
            'remaining_seats': safe_cast(self._get('remaining_seats'), int),
            'type': self._get('type', 'section_type'),
            'fees': safe_cast(self._get('fees', 'fee', 'cost'), float),
            'final_exam': self._get('final_exam'),
            'textbooks': self._get('textbooks'),
            'meetings': self._get('offerings', 'meetings'),
            'course_section_id': safe_cast(self._get('course_section_id'), int)
        }

        section = clean(section)
        self._validate_and_log(section)
        self.tracker.year = section['year']
        self.tracker.term = section['term']
        return section

    def ingest_meeting(self, section, clean_only=False):
        """Create meeting ingested json map.

        Args:
            section (dict): validated section object

        Returns:
            dict: meeting
        """
        year = str(self._get('year'))
        term = self._get('term', 'semester')
        if section.get('code') is None:
            year = None
            term = None

        meeting = {
            'kind': 'meeting',
            'course': section.get('course'),
            'section': {
                'code': section.get('code'),
                'year': year,
                'term': term,
            },
            'days': make_list(self._get('days', 'day')),
            'dates': self._resolve_date(),
            'time': self._resolve_time(),
            'location': self._resolve_location()
        }

        meeting = clean(meeting)

        if clean_only:
            return meeting

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
            },
            'summary': self._get('summary')
        }

        evaluation = clean(evaluation)
        self._validate_and_log(evaluation)
        self.tracker.year = evaluation['year']
        self.tracker.term = evaluation['term']
        return evaluation

    def end(self):
        """Finish ingesting.

        Close i/o, clear internal state, write meta info
        """
        self.data_list.exit()
        self.json.write('$meta', {
            '$schools': self.hoarder.schools,
            '$timestamp': self.tracker.start_time
        })
        self.json.exit()
        self.clear()

    def _validate_and_log(self, obj):
        if self.validate is False:
            self.data_list.write(obj)
            self.tracker.stats = dict(kind=obj['kind'], status='total')
            return

        is_valid, skip = self._run_validator(obj)
        if skip:
            return
        if is_valid:
            self.data_list.write(obj)
        try:
            for key in self:
                if key in Ingestor.ALL_KEYS:
                    continue
                raise IngestionWarning(
                    self,
                    'ingestor does not support key {}: {}'.format(key,
                                                                  self[key])
                )
        except IngestionWarning as e:
            is_valid = True
            logging.exception('Ingestor warning')
            if self.break_on_warning:
                raise e
        self.tracker.stats = dict(kind=obj['kind'], status='total')

    def _run_validator(self, data):
        is_valid = False
        full_skip = False

        logger = logging.getLogger('parsing.schools.' + self.school)

        try:
            self.validator.validate(data)
            self.tracker.stats = dict(kind=data['kind'], status='valid')
            is_valid = True
        except ValidationError as e:
            if self.break_on_error:
                raise ValidationError(*e.args)
            else:
                logger.warning('Ingestion failed', exc_info=True)
                logger.debug('Ingestor dump', self)
        except ValidationWarning as e:
            if (isinstance(e, MultipleDefinitionsWarning) and
                    self.skip_duplicates):
                full_skip = True
            else:
                is_valid = True
                if self.break_on_warning:
                    raise ValidationWarning(*e.args)
                else:
                    logger.warning('Validation warning', exc_info=True)
                    logger.debug('Ingestor dump', self)

        return is_valid, full_skip
