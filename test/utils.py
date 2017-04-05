import json


def get_default_tt_request():
    return {
        'courseSections': {},
        'customSlots': [],
        'numOptionCourses': 0,
        'optionCourses': [],
        'preferences': {
            'try_with_conflicts': False,
            'sort_metrics': [
                {'metric': 'days with class', 'selected': False, 'order': 'least'},
                {'metric': 'number of conflicts', 'selected': False, 'order': 'least'},
                {'metric': 'time on campus', 'selected': False, 'order': 'least'},
                {'metric': 'course rating stars', 'selected': False, 'order': 'most'}
            ]
        },
        'try_with_conflicts': False,
        'school': 'uoft',
        'semester': {'name': 'Fall', 'year': '2016'},
        'updated_courses': [],
        'sid': ''
    }