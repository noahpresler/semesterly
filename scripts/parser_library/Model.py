# @what     Parsing library Course Object
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/22/16

import django, datetime, os
from django.utils.encoding import smart_str, smart_unicode
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *

class Model:

    def __init__(self, school):
        self.map = {}
        self.school = school

    def __setitem__(self, key, value):
        self.map[key] = value
        return self

    def __getitem__(self, key):
        return self.map[key]

    def __delitem__(self, key):
        del self.map[key]

    def __contains__(self, key):
        return key in self.map

    def __iter__(self):
        for key in self.map:
            yield key

    def __len__(self):
        return len(self.map)

    def __str__(self):
        l = ''
        for label, value in self.map.items():
            l += smart_str(label) + ':' + smart_str(value) + '\n'
        return l

    def update(self, other=None, **kwargs):
        if other is not None:
            for k, v in other.items(): 
                self[k] = v
        for k, v in kwargs.items():
            self[k] = v

    def clear(self):
        self.map.clear()
        self.school = ''

    def create_course(self):
        ''' Create course in database from info in model map.

        Returns:
            django course model object
        '''
        course, CourseCreated = Course.objects.update_or_create(
            code = self.map['code'],
            school = self.school,
            defaults={
                'name': self.map.get('name'),
                'description': self.map.get('descr', ''),
                'department': self.map.get('dept'),
                'num_credits': self.map.get('credits'),
                'prerequisites': self.map.get('prereqs'),
                'corequisites': self.map.get('coreqs'),
                'notes': self.map.get('notes', ''),
                'info' : self.map.get('info', ''),
                'areas': self.map.get('areas', '') + self.map.get('geneds', ''),
                'geneds': self.map.get('geneds', ''),
                'info': self.map.get('info')
            }
        )
        return course

    def create_section(self, course_model, clean=True):
        ''' Create section in database from info in model map. 
        
        Args:
            course_model: django course model object

        Keyword args:
            clean (boolean): removes course offerings associated with section if set

        Returns:
            django section model object
        '''
        # Grab semester.
        semester, _ = Semester.objects.update_or_create(name=self.map['term'], year=self.map['year'])
        if semester is None:
            raise DigestionError('Semester {} {} not in DB'.format(sectin.term, section.year))

        section, section_was_created = Section.objects.update_or_create(
            course = course_model,
            semester = semester,
            meeting_section = self.map['section'],
            defaults = {
                'instructors': self.map.get('instrs'),
                'size': self.map.get('size'),
                'enrolment': self.map.get('enrolment'),
                'waitlist': self.map.get('waitlist', -1),
                'section_type': self.map.get('section_type', 'X')
            }
        )

        if clean:
            Model.remove_offerings(section)
        return section

    def create_offerings(self, section_model):
        ''' Create offering in database from info in model map.

        Args:
            course_model: django course model object
        '''
        if self.map.get('days'):
            for day in self.map.get('days'):
                offering_model, offering_was_created = Offering.objects.update_or_create(
                    section = section_model,
                    day = day,
                    time_start = self.map.get('time_start'),
                    time_end = self.map.get('time_end'),
                    defaults = {
                        'location': self.map.get('location')
                    }
                )

    def remove_section(self, course_model):
        ''' Remove section specified in model map from django database. '''
        if Section.objects.filter(course = course_model, meeting_section = self.map.get('section')).exists():
            s = Section.objects.get(course = course_model, meeting_section = self.map.get('section'))
            s.delete()

    @staticmethod
    def remove_offerings(section_model):
        ''' Remove all offerings associated with a section. '''
        Offering.objects.filter(section = section_model).delete()

    def wrap_up(self):
        ''' Update time updated for school at end of parse. '''
        update_object, created = Updates.objects.update_or_create(
                school=self.school,
                update_field="Course",
                defaults={'last_updated': datetime.datetime.now()}
        )
        update_object.save()

    @staticmethod
    def DEBUG():
        # TODO
        pass
