import django, os, sys, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from django.forms.models import model_to_dict
from django.db.models import Q

from timetable.school_mappers import school_to_models

def write_courses_to_json(school, sem): 
    module_dir = os.path.dirname(__file__)  # get current directory
    file_path = os.path.join(module_dir, "timetable/courses_json/" + school + "-" + sem + ".json")
    C, Co = school_to_models[school]
    course_objs = C.objects.all()
    json_data = convert_courses_to_json(course_objs, sem, school, 50000)
    with open(file_path, 'w') as outfile:
        json.dump(json_data, outfile)

def convert_courses_to_json(courses, sem, school, limit=50):
    cs = []
    result_count = 0    # limiting the number of results one search query can provide to 50
    for course in courses:
        if result_count == limit: break
        if has_offering(course, sem, school):
            cs.append(course)
            result_count += 1
    return [get_course_serializable(course, sem, school) for course in cs]

def has_offering(course, sem, school):
    SchoolCourse, SchoolCourseOffering = school_to_models[school]   

    try:
        res = SchoolCourseOffering.objects.filter(~Q(time_start__iexact='TBA'), 
                                            (Q(semester=sem) | Q(semester='Y')),
                                            course_id=course.id)
        for offering in res:
            day = offering.day
            if day == 'S' or day == 'U':
                return False
        return True if len(res) > 0 else False
    except:
        return False

def get_course_serializable(course, sem, school):
    d = model_to_dict(course)
    d['sections'] = get_meeting_sections(course, sem, school)
    return d

def get_meeting_sections(course, semester, school):
    SchoolCourse, SchoolCourseOffering = school_to_models[school]   
    offering_objs = SchoolCourseOffering.objects.filter((Q(semester=semester) | Q(semester='Y')), 
                                                    course=course)          
    sections = []
    for o in offering_objs:
        if o.meeting_section not in sections:
            sections.append(o.meeting_section)
    sections.sort()
    return sections

if __name__  == "__main__":
    if len(sys.argv) != 3:
        print "Must specify school semester. e.g: python " + sys.argv[0] + " jhu F/f/S/s"
        exit(1)
    school = sys.argv[1].lower()
    sem = sys.argv[2].upper()
    if (school not in school_to_models) or (sem not in ["F", "S"]):
        print "Invalid school or semester provided"
        exit(1)
    print "Starting populator for " + school + " " + sem
    write_courses_to_json(school, sem)
    print "Done!"



