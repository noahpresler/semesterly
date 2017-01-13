# @what     Parsing library Ingestor
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     1/13/17

import json

class Ingestor:

    # TODO - abstract dictionary methods into ABC
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
        ''' Create course json from info in model map.

        Returns:
            json object model for a course
        '''
        course = {
            'kind': 'course',
            'school_code': self.school,
            'course_code': self.map['code'],
            'name': self.map['name'],
            'department': self.map['dept'],
            'credits': self.map['credits'],
            'prerequisites': self.map.get('prereqs'),
            'corequisites': self.map.get('coreqs'),
            'exclusions': self.map.get('exclusions'),
            'description': [self.map.get('descr', ''), self.map.get('notes', ''), self.map.get('info', '')],
            'areas': self.map.get('areas'),
            'level': self.map.get('level'),
            'cores': self.map.get('cores'),
            'geneds': self.map.get('geneds'),
            'sections': self.map.get('sections')
        }
        course = Ingestor.cleandict(course)
        print json.dumps(course, sort_keys=True, indent=4, separators=(',', ': '))
        return course

    def create_section(self, course):
        ''' Create section json object from info in model map. 

        Args:
            course: course info mapping

        Returns:
            json object model for a section
        '''
        section = {
            'kind': 'section',
            'course_code': course['course_code'],
            'name': self.map['section'],
            'term': self.map['term'],
            'year': self.map.get('year', ''), # NOTE: should be required
            'instructors': self.map.get('instrs'),
            'capacity': self.map.get('size'),
            'enrollment': self.map.get('enrolment'), #NOTE: change to enrollment
            'waitlist': self.map.get('waitlist', -1),
            'waitlist_size': self.map.get('waitlist_size', -1),
            'remaining_seats': self.map.get('remaining_seats'),
            'type': self.map.get('section_type'),
            'fees': self.map.get('fees'),
            'final_exam': self.map.get('final_exam'),
            'offerings': self.map.get('offerings')
        }

        section = Ingestor.cleandict(section)
        print json.dumps(section, sort_keys=True, indent=4, separators=(',', ': '))
        return section

    def create_offerings(self, section_model):
        ''' Create offering in database from info in model map.

        Args:
            section: section info mapping

        Returns:
            json object model for a section

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
    def cleandict(d):
        if not isinstance(d, dict):
            return d
        return dict((k, Ingestor.cleandict(v)) for k,v in d.iteritems() if v is not None)

    @staticmethod
    def DEBUG():
        # TODO
        pass
