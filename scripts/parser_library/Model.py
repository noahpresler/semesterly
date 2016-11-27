# @what     Parsing library Course Object
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/22/16

import django, datetime
from timetable.models import *

class Model:

    def __init__(self):
        self.map = {}

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

    def create_course(self):
        course, CourseCreated = Course.objects.update_or_create(
            code = self.course['code'],
            school = self.school,
            defaults={
                'name': self.course.get('name'),
                'description': self.course.get('descr'),
                'department': self.course.get('department'),
                'num_credits': self.course.get('credits'),
                'prerequisites': self.course.get('prereqs'),
                'corequisites': self.course.get('coreqs'),
                'notes': self.course.get('notes'),
                'info' : self.course.get('info'),
                'areas': self.course.get('areas') + self.course.get('geneds'),
                'geneds': self.course.get('geneds')
            }
        )
        return course

    def create_section(self, course_model):
        # TODO - deal with cancelled course?
        section, section_was_created = Section.objects.update_or_create(
            course = course_model,
            semester = self.course['semester'],
            meeting_section = self.course['section'],
            defaults = {
                'instructors': self.course.get('instrs'),
                'size': self.course.get('size'),
                'enrolment': self.course.get('enrolment'),
                'section_type': self.course['section_type']
            }
        )
        return section

    def create_offerings(self, section_model):
        if self.course.get('days'):
            for day in self.course.get('days'):
                offering_model, offering_was_created = Offering.objects.update_or_create(
                    section = section_model,
                    day = day,
                    time_start = self.course.get('time_start'),
                    time_end = self.course.get('time_end'),
                    defaults = {
                        'location': self.course.get('location')
                    }
                )

    def wrap_up(self):
            update_object, created = Updates.objects.update_or_create(
                    school=self.school,
                    update_field="Course",
                    defaults={'last_updated': datetime.datetime.now()}
            )
            update_object.save()

    @staticmethod
    def DEBUG():
        
