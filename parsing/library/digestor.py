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

from __future__ import absolute_import, division, print_function

import sys
import django
import jsondiff
import simplejson as json

from abc import ABCMeta, abstractmethod

from timetable.models import Course, Section, Offering, Textbook, \
    TextbookLink, Evaluation, Semester
from parsing.models import DataUpdate
from parsing.library.utils import DotDict, make_list
from parsing.library.logger import JSONStreamWriter
from parsing.library.internal_exceptions import DigestionError
from parsing.library.tracker import NullTracker
from parsing.library.exceptions import PipelineError


class DigestorError(PipelineError):
    """Digestor error class."""


class Digestor(object):
    """Digestor in data pipeline.

    Attributes:
        adapter (DigestionAdapter): Adapts
        cache (dict): Caches recently used Django objects to be used as
            foriegn keys.
        data (TYPE): The data to be digested.
        meta (dict): meta data associated with input data.
        MODELS (dict): mapping from object type to Django model class.
        school (str): School to digest.
        strategy (DigestionStrategy): Load and/or diff db depending on strategy
        tracker (parsing.library.tracker.Tracker): Description
    """

    MODELS = {
        'course': Course,
        'section': Section,
        'offering': Offering,
        'textbook': Textbook,
        'textbook_link': TextbookLink,
        'evaluation': Evaluation,
        'semester': Semester
    }

    def __init__(self, school,
                 data=None,
                 output=None,
                 diff=True,
                 load=True,
                 display_progress_bar=True,
                 tracker=NullTracker()):
        with open(data, 'r') as f:
            data = json.load(f)

        self.meta = data.pop('$meta')
        self.data = [DotDict(obj) for obj in data.pop('$data')]

        self.cache = DotDict(dict(
            course={'code': '_'},
            section={'code': '_'}
        ))

        self.school = school
        self.adapter = DigestionAdapter(school, self.cache)
        self.strategy = self._resolve_strategy(diff, load, output)

        # Setup tracker for digestion and progress bar.
        self.tracker = tracker
        self.tracker.mode = 'digesting'

    def _resolve_strategy(self, diff, load, output=None):
        if diff and load:  # Diff only
            return Burp(self.school, self.meta, output)
        elif not diff and load:  # Load db only
            return Absorb(self.school, self.meta)
        elif diff and not load:  # Load db and log diff
            return Vommit(output)
        else:  # Nothing to do...
            raise ValueError('Nothing to run with --no-diff and --no-load.')

    def digest(self):
        '''Digest data.'''

        do_digestion = {
            'course': lambda x: self.digest_course(x),
            'section': lambda x: self.digest_section(x),
            'meeting': lambda x: self.digest_meeting(x),
            'textbook': lambda x: self.digest_textbook(x),
            'textbook_link': lambda x: self.digest_textbook_link(x),
        }

        if self.tracker.has_viewer('progressbar'):
            bar = self.tracker.get_viewer('progressbar').bar
            for obj in bar(make_list(self.data)):
                do_digestion[obj.kind](obj)
        else:
            for obj in make_list(self.data):
                do_digestion[obj.kind](obj)

        self.wrap_up()

    def update_progress(self, key, exists):
        if exists:
            self.tracker.stats = dict(kind=key, status='total')
        # TODO - add more stats including newly created and the like

    def digest_course(self, course):
        ''' Create course in database from info in json model.

        Returns:
            django course model object
        '''
        course_model = self.strategy.digest_course(self.adapter.adapt_course(course))

        if course_model:
            self.cache.course = course_model
            for section in course.get('sections', []):
                self.digest_section(section, course_model)

        self.update_progress('course', bool(course_model))

        return course_model

    def digest_section(self, section, course_model=None):
        ''' Create section in database from info in model map.

        Args:
            course_model: django course model object

        Keyword args:
            clean (boolean): removes course offerings associated with section
                             if set

        Returns:
            django section model object
        '''

        section_model = self.strategy.digest_section(self.adapter.adapt_section(section))

        if section_model:
            self.cache.course = course_model
            self.cache.section = section_model
            for meeting in section.get('meetings', []):
                self.digest_meeting(meeting, section_model)
            for textbook_link in section.get('textbooks', []):
                self.digest_textbook_link(DotDict(textbook_link),
                                          section_model=section_model)
        self.update_progress('section', bool(section_model))

        return section_model

    def digest_meeting(self, meeting, section_model=None):
        ''' Create offering in database from info in model map.

        Args:
            section_model: JSON course model object

        Return: Offerings as generator
        '''

        # NOTE: ignoring dates for now
        offering_models = []
        for offering in self.adapter.adapt_meeting(meeting,
                                                   section_model=section_model):
            offering_model = self.strategy.digest_offering(offering)
            offering_models.append(offering_model)
            self.update_progress('offering', bool(offering_model))
        return offering_models

    def digest_textbook(self, textbook):
        textbook_model = self.strategy.digest_textbook(self.adapter.adapt_textbook(textbook))
        self.update_progress('textbook', bool(textbook_model))

    def digest_textbook_link(self, textbook_link,
                             textbook_model=None,
                             section_model=None):
        # NOTE: currently only support per section digestion.
        textbook_link_model = self.strategy.digest_textbook_link(list(self.adapter.adapt_textbook_link(textbook_link, textbook_model=textbook_model, section_model=section_model))[0])
        self.update_progress('textbook_link', bool(textbook_link_model))

    def wrap_up(self):
        self.strategy.wrap_up()


class DigestionAdapter(object):
    def __init__(self, school, cached):
        self.school = school

        # Cache last created course and section to avoid redundant Django calls
        self.cache = cached

    def adapt_course(self, course):
        ''' Digest course.
        Args:
            course: json object

        Returns: (django) formatted course dictionary
        '''

        if course is None:
            raise DigestionError('none course')

        adapted = {}
        adapted['name'] = course.get('name', '')
        if 'credits' in course:
            adapted['num_credits'] = course.credits
        if 'description' in course:
            adapted['description'] = '\n'.join(course.description)
        if 'department' in course:
            if 'code' in course.department:
                adapted['department'] = course.department.code
            if 'name' in course.department:
                adapted['department'] = course.department.name
        if 'prerequisites' in course:
            adapted['prerequisites'] = ', '.join(course.prerequisites)
        if 'corequisites' in course:
            adapted['corequisites'] = ', '.join(course.corequisites)
        if 'exclusions' in course:
            adapted['exclusions'] = ', '.join(course.exclusions)
        if 'areas' in course:
            adapted['areas'] = ', '.join(course.areas)
        if 'cores' in course:
            adapted['cores'] = ', '.join(course.cores)
        if 'geneds' in course:
            adapted['geneds'] = ', '.join(course.geneds)
        if 'level' in course:
            adapted['level'] = course.level

        # Combine pre and co requisites into one field
        if 'corequisites' in adapted and 'prerequisites' not in adapted:
            adapted['prerequisites'] = 'Co: {}'.format(adapted['corequisites'])
        elif 'corequisites' in adapted:
            adapted['prerequisites'] = 'Pre: {} Co: {}'.format(
                adapted['prerequisites'], adapted['corequisites']
            )

        return {
            'code': course.code,
            'school': self.school,
            'defaults': adapted
        }

    def adapt_section(self, section, course_model=None):
        ''' Digest course.
        Args:
            section: json object

        Returns: (django) formatted section dictionary
        '''

        if section is None:
            raise DigestionError('none section')

        if course_model is None:
            if (self.cache.course and
                    section.course.code == self.cache.course.code):
                course_model = self.cache.course
            else:
                course_model = Course.objects.filter(
                    school=self.school,
                    code=section.course.code
                ).first()
                if course_model is None:
                    # TODO - run tests with different database
                    print('course %s section not already in database'.format(
                        section.course.code
                    ), file=sys.stderr)

        adapted = {}
        if 'capacity' in section:
            adapted['size'] = section.capacity
        if 'enrollment' in section:
            # TODO - change 'enrolment' to 'enrollment' in django model
            adapted['enrolment'] = section.enrollment
        if 'waitlist' in section:
            adapted['waitlist'] = section.waitlist
        if 'waitlist_size' in section:
            adapted['waitlist_size'] = section.waitlist_size
        if 'remaining_seats' in section:
            pass
            # FIXME -- possible logic conflict with other data
            # adapted['remaining_seats'] = section.remaining_seats
        section_type_map = {
            'Lecture': 'L',
            'Laboratory': 'P',
            'Discussion': 'T',
        }
        if 'type' in section:
            adapted['section_type'] = section_type_map.get(section.type, 'L')
        if 'fees' in section:
            pass  # TODO - add fees to database
        if 'instructors' in section:
            # FIXME -- might break with instructor as object
            if isinstance(section.instructors, basestring):
                adapted['instructors'] = section.instructors
            else:
                adapted['instructors'] = ', '.join(i['name'] for i in section.instructors)
        if 'final_exam' in section:
            pass  # TODO - add to database

        # Grab semester.
        semester, _ = Semester.objects.update_or_create(name=section.term,
                                                        year=section.year)
        if semester is None:
            raise DigestionError(
                'Semester {} {} not in DB'.format(section.term,
                                                  section.year)
            )

        return {
            'course': course_model,
            'semester': semester,
            'meeting_section': section.code,
            'defaults': adapted
        }

    def adapt_meeting(self, meeting, section_model=None):
        ''' Digest course.
        Args:
            section: json object

        Returns: (django) formatted offering dictionaries (generator).
        '''

        if meeting is None:
            raise DigestionError('none meeting in adapt_meeting')

        if section_model is None:
            course_model = None
            if (self.cache.code and
                    meeting.course.code == self.cache.course.code):
                course_model = self.cache.course
            else:
                course_model = Course.objects.filter(
                    school=self.school,
                    code=meeting.course.code
                ).first()
                if course_model is None:
                    print('no course object for {}'.format(meeting.course.code), file=sys.stderr)
                    # raise DigestionError('no course object for meeting')
            if self.cache.course and course_model.code == self.cache.course.code and meeting.section.code == self.cache.section.meeting_section:
                    section_model = self.cache.section
            else:
                section_model = Section.objects.filter(
                    course=course_model,
                    meeting_section=meeting.section.code,
                    semester__name=meeting.section.term,
                    semester__year=meeting.section.year
                ).first()
                if section_model is None:
                    print('no section {} {} for meeting'.format(
                        meeting.course.code,
                        meeting.section.code
                    ), file=sys.stderr)
                    # raise DigestionError('no section object for meeting', meeting)
                self.cache_course = course_model
                self.cache_section = section_model

        # NOTE: ignoring dates for now
        for day in meeting.get('days', []):
            offering = {
                'section': section_model,
                'day': day,
                'time_start': meeting.time.start,
                'time_end': meeting.time.end,
                'defaults': {
                    'location': meeting.get('location', {}).get('where', '')
                }
            }
            yield offering

    def adapt_textbook(self, textbook):
        textbook = {
            'isbn': textbook.isbn,
            'defaults': {
                'detail_url': textbook.detail_url,
                'image_url': textbook.image_url,
                'author': textbook.author,
                'title': textbook.title
            }
        }
        for key in textbook['defaults']:
            if textbook['defaults'][key] is None:
                textbook['defaults'][key] = 'Cannot be found'
        return textbook

    def adapt_textbook_link(self, textbook_link,
                            textbook_model=None,
                            section_model=None):
        sections = [section_model]
        if section_model is None:
            if 'section' not in textbook_link:
                sections = Section.objects.filter(
                    course=textbook_link.course.code,
                )
            else:
                sections = Section.objects.filter(
                    course=textbook_link.course.code,
                    meeting_section=textbook_link.section.code
                )
            sections = Section.objects.filter(course=textbook_link.course.code)
        if textbook_model is None:
            textbook_model = Textbook.objects.filter(isbn=textbook_link.isbn).first()
        if 'required' not in textbook_link:
            textbook_link.required = True  # TODO - optional required field in db and frontend
        for section in sections:
            yield {
                'section': section,
                'is_required': textbook_link.required,
                'textbook': textbook_model
            }
        # NOTE: no current usage of course linked textbooks (listified yield will always be length 1)


class DigestionStrategy(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def wrap_up(self):
        '''Do whatever needs to be done to wrap_up digestion session.'''


class Vommit(DigestionStrategy):
    '''Output diff between input and db data.'''

    def __init__(self, output):
        self.defaults = Vommit.get_model_defaults()
        self.output = output
        super(Vommit, self).__init__()

        def exclude(dct):
                return {k: v for k, v in dct.items() if k != 'defaults'}

        for name, model in Digestor.MODELS.items():
            # if hasattr(self, 'digest_' + name):
            #     continue
            def closure(name, model):
                def digest(self, model_params):
                    obj = model.objects.filter(
                        **exclude(model_params)
                    ).first()
                    self.diff(name, model_params, obj)
                    return obj
                return digest
            setattr(self.__class__, 'digest_' + name, closure(name, model))

    def wrap_up(self):
        self.json_logger.exit()

    def diff(self, kind, inmodel, dbmodel, hide_defaults=True):
        with JSONStreamWriter(self.output) as streamer:
            # Check for empty inputs
            if inmodel is None:
                return None
            if dbmodel is None:
                dbmodel = {}
            else:
                # Transform django object to dictionary.
                dbmodel = dbmodel.__dict__

            context = {'section', 'course', 'semester', 'textbook'}

            whats = {}
            for k, v in inmodel.iteritems():
                if k not in context:
                    continue
                try:
                    whats[k] = unicode(v)
                except django.utils.encoding.DjangoUnicodeDecodeError:
                    whats[k] = '<{}: [Bad Unicode data]'.format(k)

            # Remove db specific content from model.
            blacklist = context | {
                '_state',
                'id',
                'section_id',
                'course_id',
                '_course_cache',
                'semester_id',
                '_semester',
                'vector',
            }

            def prune(d):
                return {k: v for k, v in d.iteritems() if k not in blacklist}
            dbmodel = prune(dbmodel)
            inmodel = prune(inmodel)

            if 'course' in dbmodel:
                dbmodel['course'] = str(dbmodel['course'])

            # Remove null values from dictionaries.
            dbmodel = {k: v for k, v in dbmodel.iteritems() if v is not None}

            # Move contents of default dictionary to first-level of dictionary.
            if 'defaults' in inmodel:
                defaults = inmodel['defaults']
                del inmodel['defaults']
                inmodel.update(defaults)

            # Diff the in-model and db-model
            diffed = json.loads(jsondiff.diff(dbmodel, inmodel,
                                              syntax='symmetric',
                                              dump=True))

            # Remove db defaulted values from diff output.
            if hide_defaults and '$delete' in diffed:
                self.remove_defaulted_keys(kind, diffed['$delete'])
                if len(diffed['$delete']) == 0:
                    del diffed['$delete']

            # Add `what` and `context` tag to diff output.
            if len(diffed) > 0:
                if isinstance(diffed, list) and len(diffed[0]) == 0:
                    diffed = {'$new': diffed[1]}
                elif isinstance(diffed, dict):
                    diffed.update({'$what': inmodel})
                diffed.update({'$context': whats})
                self.json_logger.write(diffed)

    def remove_defaulted_keys(self, kind, dct):
        for default in self.defaults[kind]:
            if default in dct:
                del dct[default]
        return dct

    @staticmethod
    def get_model_defaults():
        models = {
            'course': Course,
            'section': Section,
            'offering': Offering,
            'textbook': Textbook,
            'textbook_link': TextbookLink,
            'evaluation': Evaluation
        }

        defaults = {}
        for model_name, model in models.items():
            defaults[model_name] = {}
            for field in model._meta.get_all_field_names():
                try:
                    default = model._meta.get_field_by_name(field)[0].default
                except AttributeError:
                    continue
                if default is django.db.models.fields.NOT_PROVIDED:
                    continue
                defaults[model_name][field] = default
        return defaults


class Absorb(DigestionStrategy):
    '''Load valid data into Django db.'''

    def __init__(self, school, meta):
        self.school = school
        self.meta = meta
        Absorb._create_digest_methods()
        super(Absorb, self).__init__()

    @classmethod
    def _create_digest_methods(cls):
        for name, model in Digestor.MODELS.items():
            if hasattr(cls, 'digest_' + name):
                continue

            def closure(name, model):
                def digest(cls, params):
                    obj, created = cls._update_or_create(model, params)
                    return obj
                return classmethod(digest)
            setattr(cls, 'digest_' + name, closure(name, model))

    @classmethod
    def digest_section(cls, parmams, clean=True):
        model, created = cls._update_or_create(Section, parmams)
        if model and clean:
            cls.remove_offerings(model)
        return model

    @staticmethod
    def _update_or_create(model_type, model_args):
        try:
            return model_type.objects.update_or_create(**model_args)
        except django.db.utils.DataError as e:
            json_model_args = {k: str(v) for k, v in model_args.items()}
            raise DigestionError(str(e), json=json_model_args)

    @staticmethod
    def remove_section(section, course_model):
        ''' Remove section specified from django database. '''
        if Section.objects.filter(course=course_model, meeting_section=section).exists():
            s = Section.objects.get(course=course_model,
                                    meeting_section=section)
            s.delete()

    @staticmethod
    def remove_offerings(section_obj):
        ''' Remove all offerings associated with a section. '''
        Offering.objects.filter(section=section_obj).delete()

    def wrap_up(self):
        """Update time updated for school at wrap_up of parse."""
        for school, years in self.meta['$schools'].items():
            for year, terms in years.items():
                for term in terms:
                    semester, created = Semester.objects.update_or_create(
                        year=year,
                        name=term
                    )
                    if created:
                        pass  # TODO - add logging to show that semester dne
                    update, _ = DataUpdate.objects.update_or_create(
                        school=self.school,
                        semester=semester,
                        update_type=DataUpdate.COURSES
                    )
                    update.save()


class Burp(DigestionStrategy):
    '''Load valid data into Django db and output diff between input
        and db data.
    '''

    def __init__(self, school, meta, output=None):
        self.vommit = Vommit(output)
        self.absorb = Absorb(school, meta)
        Burp.create_digest_methods()
        super(Burp, self).__init__()

    @classmethod
    def create_digest_methods(cls):
        for name in Digestor.MODELS:
            if hasattr(cls, 'digest_' + name):
                continue

            def closure(name):
                def digest(self, params):
                    getattr(self.vommit, 'digest_' + name)(params)
                    return getattr(self.absorb, 'digest_' + name)(params)
                return digest
            setattr(cls, 'digest_' + name, closure(name))

    def wrap_up(self):
        self.vommit.wrap_up()
        self.absorb.wrap_up()
