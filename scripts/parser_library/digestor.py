# @what     Parsing Digestor (db adapter)
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/22/17

from __future__ import print_function, division, absolute_import # NOTE: slowly move toward Python3

import datetime, os, sys, copy, jsondiff, simplejson as json, collections
from abc import ABCMeta, abstractmethod

import django
from django.utils.encoding import smart_str, smart_unicode
from django.utils.functional import cached_property
from django.core import serializers
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

from scripts.parser_library.internal_utils import *
from scripts.parser_library.logger import Logger, JsonListLogger
from scripts.parser_library.internal_exceptions import DigestionError
from scripts.parser_library.Updater import ProgressBar, Counter
from scripts.parser_library.tracker import ProgressBar, NullTracker

# TODO - DigestionError should be removed with failure,
# user should not be able to produce direct DigestionError

class Digestor:
	def __init__(self, school, 
		data=None, 
		output=None,
		diff=True, 
		load=True,
		hide_progress_bar=False,
		tracker=NullTracker()):

		# TODO - extrapolate datafile/dict/string resolution to another manager
		if data:
			if isinstance(data, dict):
				data = data
			else:
				with open(data, 'r') as f:
					data = json.load(f)
		else:
			data = json.load(sys.stdin)

		self.data = [ dotdict(obj) for obj in data ]

		self.cached = dotdict({
			'course': { 'code': '_' },
			'section': { 'code': '_' }
		})

		self.school = school
		self.adapter = DigestionAdapter(school, self.cached)
		self.strategy = self.set_strategy(diff, load, output)
		self.counter = Counter()

		# Setup tracker for digestion and progress bar.
		self.tracker = tracker
		self.tracker.set_mode('digesting')
		if not hide_progress_bar:
			formatter = lambda stats: '{}'.format(stats['total'])
			self.tracker.add_viewer(ProgressBar(school, formatter))


	def set_strategy(self, diff, load, output=None):
		if diff and load:
			return Burp(self.school, output) # diff only
		elif not diff and load:
			return Absorb(self.school) # load db only + clean
		elif diff and not load:
			return Vommit(output) # load db and log diff
		else: # nothing to do...
			raise ValueError('Nothing to run with --no-diff and --no-load.')

	def digest(self):
		'''Digest data.'''

		do_digestion = {
			'course'	: lambda x: self.digest_course(x),
			'section'	: lambda x: self.digest_section(x),
			'meeting'	: lambda x: self.digest_meeting(x),
			'instructor': lambda x: self.digest_instructor(x),
			'final_exam': lambda x: self.digest_final_exam(x),
			'textbook'	: lambda x: self.digest_textbook(x),
			'textbook_link': lambda x: self.digest_textbook_link(x)
		}

		for obj in make_list(self.data):
			do_digestion[obj.kind](obj)

		self.wrap_up()

	def update_progress(self, key, exists):
		if exists:
			self.tracker.track_count(key, 'total')
		# TODO - add more stats including newly created and the like

	def digest_course(self, course):
		''' Create course in database from info in json model.

		Returns:
			django course model object
		'''

		course_model = self.strategy.digest_course(self.adapter.adapt_course(course))

		if course_model:
			self.cached.course = course_model
			for section in course.get('sections', []):
				self.digest_section(section, course_model)

		self.update_progress('course', bool(course_model))

		return course_model

	def digest_section(self, section, course_model=None):
		''' Create section in database from info in model map.

		Args:
			course_model: django course model object

		Keyword args:
			clean (boolean): removes course offerings associated with section if set

		Returns:
			django section model object
		'''

		section_model = self.strategy.digest_section(self.adapter.adapt_section(section))

		if section_model:
			self.cached.course = course_model
			self.cached.section = section_model
			for meeting in section.get('meetings', []):
				self.digest_meeting(meeting, section_model)

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
		for offering in self.adapter.adapt_meeting(meeting, section_model=section_model):
			offering_model = self.strategy.digest_offering(offering)
			offering_models.append(offering_model)
			self.update_progress('offering', bool(offering_model))
		return offering_models

	def digest_textbook(self, textbook):
		textbook_model = self.strategy.digest_textbook(self.adapter.adapt_textbook(textbook))
		self.update_progress('textbook', bool(textbook_model))

	def digest_textbook_link(self, textbook_link, textbook):
		textbook_link_model = self.strategy.digest_textbook_link(self.adapter.adapt_textbook_link(textbook_link, textbook))
		self.update_progress('textbook_link', bool(textbook_link))

	def wrap_up(self):
		self.strategy.wrap_up()

class DigestionAdapter:
	def __init__(self, school, cached):
		self.school = school

		# Cache last created course and section to avoid redundant Django calls
		self.cached = cached

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
			adapted['prerequisites'] = 'Coreq: ' + adapted['corequisites']
		elif 'corequisites' in adapted:
			adapted['prerequisites'] = 'Prereq: ' + adapted['prerequisites'] + ' Co: ' + adapted['corequisites']
	
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
			if self.cached.course and section.course.code == self.cached.course.code:
				course_model = self.cached.course
			else:
				course_model = Course.objects.filter(school=self.school, code=section.course.code).first()
				if course_model is None:
					# TODO - run tests with different database
					print('course %s section not already in database'.format(section.course.code), file=sys.stderr)
					# print self.cached.course
					# raise DigestionError('course does not exist for section', section)

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
			# FIXME -- possible logic conflict with other data
			adapted['remaining_seats'] = section.remaining_seats
		section_type_map = {
			'Lecture': 'L',
			'Laboratory': 'P',
			'Discussion': 'T',
		}
		if 'type' in section:
			adapted['section_type'] = section_type_map.get(section.type, 'L')
		if 'fees' in section:
			pass # TODO - add fees to database
		if 'instructors' in section:
			# FIXME -- might break with instructor as object
			if isinstance(section.instructor, str):
				adapted['instructors'] = ', '.join(section.instructors)
			else:
				adapted['instructors'] = ', '.join(i['name'] for i in section.instructors)
		if 'final_exam' in section:
			pass # TODO - add to database

		# Grab semester.
		semester, _ = Semester.objects.update_or_create(name=section.term, year=section.year)
		if semester is None:
			raise DigestionError('Semester {} {} not in DB'.format(sectin.term, section.year))

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
			if self.cached.code and meeting.course.code == self.cached.course.code:
				course_model = self.cached.course
			else:
				course_model = Course.objects.filter(school=self.school, code=meeting.course.code).first()
				if course_model is None:
					print('no course object for {}'.format(meeting.course.code), file=sys.stderr)
					# raise DigestionError('no course object for meeting')
			if self.cached.course and course_model.code == self.cached.course.code and meeting.section.code == self.cached.section.meeting_section:
					section_model = self.cached.section
			else:
				section_model = Section.objects.filter(course=course_model, meeting_section=meeting.section.code, semester__name=meeting.section.term, semester__year=meeting.section.year).first()
				if section_model is None:
					print('no section {} {} for meeting'.format(meeting.course.code, meeting.section.code), file=sys.stderr)
					# raise DigestionError('no section object for meeting', meeting)
				self.cached_course = course_model
				self.cached_section = section_model

		# NOTE: ignoring dates for now
		for day in meeting.get('days', []):
			offering = {
				'section': section_model,
				'day': day,
				'time_start': meeting.time.start,
				'time_end': meeting.time.end,
				'defaults': {
					'location': meeting.get('location',{}).get('where', '')
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

	def adapt_textbook_link(self, textbook_link, textbook_model):
		if 'required' not in textbook_link:
			textbook_link.required = True
		if 'section' not in textbook_link:
			sections = Section.objects.filter(course=textbook_link.course.code)
			for section in sections:
				yield {
					'section': section,
					'is_required': textbook_link.required,
					'textbook': textbook_model
				}
		else:
			section = Section.objects.filter(
				course=textbook_link.course.code, 
				meeting_section=textbook_link.section.code
			)[0]
			yield {
				'section': section,
				'is_required': textbook_link.required,
				'textbook': textbook_model
			}

class DigestionStrategy:
	__metaclass__ = ABCMeta

	@abstractmethod
	def digest_course(self, model_args):
		''' Digest course.
		Args:
			course: json dictionary

		Returns: (django) formatted course model
		'''

	@abstractmethod
	def digest_section(self, model_args):
		''' Digest course.
		Args:
			section: json dictionary

		Returns: (django) formatted section model
		'''

	@abstractmethod
	def digest_offering(self, model_args):
		''' Digest course.
		Args:
			course: json dictionary

		Returns: (django) formatted meeting model
		'''

	@abstractmethod
	def digest_textbook(self, textbook):
		'''Digest textbook.'''

	@abstractmethod
	def digest_textbook_link(self, textbook_link):
		'''Digest Textbook Link.'''

	def digest_instructor(self, instructor):
		pass # TODO
	def digest_final_exam(self, final_exam):
		pass # TODO

	@abstractmethod
	def wrap_up(self):
		'''Do whatever needs to be done to end digestion session.'''

class Vommit(DigestionStrategy):
	'''Output diff between input and db data.'''

	def __init__(self, output=None):
		self.json_logger = JsonListLogger(output)
		self.json_logger.open()
		self.defaults = Vommit.get_model_defaults()
		super(Vommit, self).__init__()

	@staticmethod
	def exclude(dct):
		return {k: v for k,v in dct.items() if k != 'defaults'}

	def digest_course(self, model_args):
		model = Course.objects.filter(**Vommit.exclude(model_args)).first()
		self.diff('course', model_args, model)
		return model

	def digest_section(self, model_args):
		model = Section.objects.filter(**Vommit.exclude(model_args)).first()
		self.diff('section', model_args, model)
		return model

	def digest_offering(self, model_args):
		model = Offering.objects.filter(**Vommit.exclude(model_args)).first()
		self.diff('offering', model_args, model)
		return model

	def digest_textbook(self, model_args):
		model = Textbook.objects.filter(**Vommit.exclude(model_args)).first()
		self.diff('textbook', model_args, model)
		return model

	def digest_textbook_link(self, model_args):
		model = TextbookLink.objects.filter(**Vommit.exclude(model_args)).first()
		self.diff('textbook_link', model_args, model)
		return model

	def wrap_up(self):
		self.json_logger.close()

	def diff(self, kind, inmodel, dbmodel, hide_defaults=True):
		# Check for empty inputs
		if inmodel is None:
			return None
		if dbmodel is None:
			dbmodel = {}
		else:
			# Transform django object to dictionary
			dbmodel = dbmodel.__dict__

		context = {'section', 'course', 'semester'}

		whats = {}
		for k, v in inmodel.iteritems():
			if k in context:
				try:
					whats[k] = str(v)
				except django.utils.encoding.DjangoUnicodeDecodeError as e:
					whats[k] = '<{}: [Bad Unicode data]'.format(k)

		# Remove db specific content from model
		blacklist = {'_state', 'id', 'section_id', 'course_id', '_course_cache', 'semester_id', '_semester'} | context
		prune = lambda d: {k: v for k, v in d.iteritems() if k not in blacklist}
		dbmodel = prune(dbmodel)
		inmodel = prune(inmodel)

		if 'course' in dbmodel:
			dbmodel['course'] = str(dbmodel['course'])

		# Remove null values from dictionaries
		dbmodel = {k: v for k, v in dbmodel.iteritems() if v is not None}

		# move contents of default dictionary to first-level of dictionary
		if 'defaults' in inmodel:
			defaults = inmodel['defaults']
			del inmodel['defaults']
			inmodel.update(defaults)

		# Diff the in-model and db-model
		diffed = json.loads(jsondiff.diff(dbmodel, inmodel, syntax='symmetric', dump=True))

		# Remove db defaulted values from diff output
		if hide_defaults and '$delete' in diffed:
			self.remove_defaulted_keys(kind, diffed['$delete'])
			if len(diffed['$delete']) == 0:
				del diffed['$delete']

		# Add `what` and `context` tag to diff output
		if len(diffed) > 0:
			if isinstance(diffed, list) and len(diffed[0]) == 0:
				diffed = { '$new': diffed[1] }
			elif isinstance(diffed, dict):
				diffed.update({ '$what': inmodel })
			diffed.update({'$context': whats})
			self.json_logger.log(diffed)

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

	def __init__(self, school):
		self.school = school
		super(Absorb, self).__init__()

	@staticmethod
	def digest_course(model_args):
		model, created = Absorb._update_or_create(Course, model_args)
		return model

	@staticmethod
	def digest_section(model_args, clean=True):
		model, created = Absorb._update_or_create(Section, model_args)
		if model and clean:
			Absorb.remove_offerings(model)
		return model

	@staticmethod
	def digest_offering(model_args):
		model, created = Absorb._update_or_create(Offering, model_args)
		return model

	@staticmethod
	def digest_textbook(model_args):
		model, created = Absorb._update_or_create(Textbook, model_args)
		return model

	@staticmethod
	def digest_textbook_link(model_args):
		model, created = Absorb._update_or_create(TextbookLink, model_args)
		return model

	@staticmethod
	def _update_or_create(model_type, model_args):
		try:
			return model_type.objects.update_or_create(**model_args)
		except django.db.utils.DataError as e:
			raise DigestionError(str(e), json=model_args)

	@staticmethod
	def remove_section(section, course_model):
		''' Remove section specified from django database. '''
		if Section.objects.filter(course=course_model, meeting_section=section).exists():
			s = Section.objects.get(course=course_model, meeting_section=section)
			s.delete()

	@staticmethod
	def remove_offerings(section_model):
		''' Remove all offerings associated with a section. '''
		Offering.objects.filter(section=section_model).delete()

	def wrap_up(self):
		''' Update time updated for school at end of parse. '''
		update_object, created = Updates.objects.update_or_create(
				school=self.school,
				update_field="Course",
				defaults={'last_updated': datetime.datetime.now()}
		)
		update_object.save()

class Burp(DigestionStrategy):
	'''Load valid data into Django db and output diff between input and db data.'''
	def __init__(self, school, output=None):
		self.vommit = Vommit(output)
		self.absorb = Absorb(school)
		super(Burp, self).__init__()

	def digest_course(self, model_args):
		self.vommit.digest_course(model_args)
		return self.absorb.digest_course(model_args)
	def digest_section(self, model_args):
		self.vommit.digest_section(model_args)
		return self.absorb.digest_section(model_args)
	def digest_offering(self, model_args):
		self.vommit.digest_offering(model_args)
		return self.absorb.digest_offering(model_args)
	def digest_textbook(self, model_args):
		self.vommit.digest_textbook(model_args)
		return self.absorb.digest_textbook(model_args)
	def digest_textbook_link(self, model_args):
		self.vommit.digest_textbook_link(model_args)
		return self.absorb.digest_textbook_link(model_args)
	def wrap_up(self):
		self.vommit.wrap_up()
		self.absorb.wrap_up()
