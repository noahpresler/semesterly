# @what     Parsing library Digestor Adapter
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/22/17

import django, datetime, os, sys, copy, jsondiff, simplejson as json, collections
from pygments import highlight, lexers, formatters, filters
from abc import ABCMeta, abstractmethod

from django.utils.encoding import smart_str, smart_unicode
from django.utils.functional import cached_property
from django.core import serializers
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

from scripts.parser_library.internal_utils import *
from scripts.parser_library.Logger import Logger, JsonListLogger
from scripts.parser_library.internal_exceptions import DigestionError

# TODO - DigestionError should be removed with failure, user should not be able to produce direct DigestionError

class Digestor:
	def __init__(self, school, 
		data=None, 
		output=None,
		diff=True, 
		load=True):

		self.school = school

		# TODO - extrapolate datafile/dict/string resolution to decorator
		if data:
			if isinstance(data, dict):
				self.data = data
			else:
				with open(data, 'r') as f:
					self.data = json.load(f)
		else:
			self.data = json.load(sys.stdin)

		self.data = [ dotdict(obj) for obj in self.data ]

		self.cached = dotdict({
			'course': { 'code': '_' },
			'section': { 'code': '_' }
		})

		self.adapter = DigestionAdapter(school, self.cached)
		self.strategy = self.set_strategy(diff, load, output)

	def update_progressbar(self, labels_and_counters, format):
		'''Update progress bar.
		Args:
			labels_and_counters:
				{ label: {
					total: #,
					valid: #
					}
				}
		'''
		self.progressbar.update('')
		# TODO

	def set_strategy(self, diff, load, output=None):
		if diff and load:
			raise NotImplementedError('Burp not implemented yet.')
			return Burp(output) # diff only
		elif not diff and load:
			return Absorb(self.school) # load db only + clean
		elif diff and not load:
			return Vommit(output) # load db and log diff
		else: # nothing to do...
			raise ValueError('Nothing to run with --no-diff and --no-load.')

	def digest(self):
		'''Digest data.'''

		data = self.data

		# convert data to iterable
		if not isinstance(data, collections.Iterable) or isinstance(data, basestring):
			data = (self.data,)

		for obj in data:
			res = {
				'course'	: lambda x: self.digest_course(x),
				'section'	: lambda x: self.digest_section(x),
				'meeting'	: lambda x: self.digest_meeting(x),
				'instructor': lambda x: self.digest_instructor(x),
				'final_exam': lambda x: self.digest_final_exam(x),
				'textbook'	: lambda x: self.digest_textbook(x),
				'textbook_link': lambda x: self.digest_textbook_link(x)
			}[obj.kind](obj)

		self.wrap_up()

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

		return section_model

	def digest_meeting(self, meeting, section_model=None):
		''' Create offering in database from info in model map.

		Args:
			section_model: JSON course model object
		'''

		# NOTE: ignoring dates for now
		offering_models = []
		for offering in self.adapter.adapt_meeting(meeting):
			offering_model = self.strategy.digest_offering(offering)
			offering_models.append(offering_model)
			# TODO - could yield here
		return offering_models

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
				adapted['department'] = course.department.name # TODO - add field for code+name in django
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
					print 'course %s section not already in database' % (section.course.code)
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
		if 'type' in section:
			adapted['section_type'] = section.type[0]
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

		return {
			'course': course_model,
			'semester': 'S', #section.term[0], # TODO - add full term to django model
			'meeting_section': section.code,
			'defaults': adapted
		}

	def adapt_meeting(self, meeting, section_model=None):
		''' Digest course.
		Args:
			section: json object

		Returns: (django) formatted offering dictionaries (IMPORTANT: return generator of offerings)
		'''

		if meeting is None:
			raise DigestionError('none meeting')

		if section_model is None:
			course_model = None
			if self.cached.code and meeting.course.code == self.cached.course.code:
				course_model = self.cached.course
			else:
				course_model = Course.objects.filter(school=self.school, code=meeting.course.code).first()
				if course_model is None:
					print 'no course object for ' + meeting.course.code
					# raise DigestionError('no course object for meeting')
			if self.cached.course and course_model.code == self.cached.course.code and meeting.section.code == self.cached.section.meeting_section:
					section_model = self.cached.section
			else:
				section_model = Section.objects.filter(course=course_model, meeting_section=meeting.section.code).first()
				if section_model is None:
					print 'no section %s %s for meeting' % (meeting.course.code, meeting.section.code)
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

class DigestionStrategy:
	__metaclass__ = ABCMeta

	def __init__(self):

		# TODO - Log digestor messages to stdout and/or file

		count = {
			'created': 0,
			'total': 0
		}
		self.count = {
			'courses': count,
			'sections': count,
			'offerings': count
		}

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

	def digest_instructor(self, instructor):
		pass # TODO
	def digest_final_exam(self, final_exam):
		pass # TODO
	def digest_textbook(self, textbook):
		pass # TODO
	def digest_textbook_link(self, textbook_link):
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

		# Remove db specific content from model
		blacklist = {'_state', 'id', 'section_id', 'course_id', 'course', 'section', '_course_cache'}
		# FIXME -- `course` and `section` keys WILL cause issues when db is modified for new defs
		remove_blacklist = lambda d: {k: v for k, v in d.iteritems() if k not in blacklist}
		dbmodel = remove_blacklist(dbmodel)
		inmodel = remove_blacklist(inmodel)

		# Remove null values from dictionaries
		dbmodel = {k: v for k, v in dbmodel.iteritems() if v is not None}

		# move contents of default dictionary to first-level of dictionary
		if 'defaults' in inmodel:
			defaults = inmodel['defaults']
			del inmodel['defaults']
			inmodel.update(defaults)

		# Diff the in-model and db-model
		diffed = json.loads(jsondiff.diff(dbmodel, inmodel, syntax='symmetric', dump=True))

		# Remove defaulted values from diff output
		if hide_defaults and '$delete' in diffed:
			self.remove_defaulted_keys(kind, diffed['$delete'])
			if len(diffed['$delete']) == 0:
				del diffed['$delete']

		# Add `what` tag to diff output
		if len(diffed) > 0:
			diffed.update({ '$what': inmodel })
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

	def __init__(self, school, clean=True):
		self.school = school
		self.clean = clean
		super(Absorb, self).__init__()

	def digest_course(self, model_args):
		model, created = Course.objects.update_or_create(**model_args)
		self.update_progress('courses', bool(model), bool(created))
		return model

	def digest_section(self, model_args):
		model, created = Section.objects.update_or_create(**model_args)
		if model and self.clean:
				Absorb.remove_offerings(model)
		self.update_progress('sections', bool(model), bool(created))
		return model

	def digest_offering(self, model_args):
		model, created = Offering.objects.update_or_create(**model_args)
		self.update_progress('offerings', bool(model), bool(created))

	def remove_section(self, course_model):
		''' Remove section specified in model map from django database. '''
		if Section.objects.filter(course = course_model, meeting_section = self.map.get('section')).exists():
			s = Section.objects.get(course = course_model, meeting_section = self.map.get('section'))
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

	def update_progress(self, key, exists, new):
		if exists:
			self.counter[key]['total'] += 1
		if new:
			self.counter[key]['created'] += 1

class Burp(DigestionStrategy):
	'''Load valid data into Django db and output diff between input and db data.'''
	def __init__(self, output):
		raise NotImplementedError('Burp not implemented yet!')
		super(Burp, self).__init__()
	# TODO