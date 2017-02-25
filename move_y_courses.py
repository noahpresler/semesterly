from collections import Counter
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

from timetable.models import Section, Semester


def move_y_courses():
  """ Add values to table.sem_name and table.year based on table.semester """
  fall_sem = Semester.objects.get(name='Fall', year='2016')
  winter_sem = Semester.objects.get(name='Winter', year='2017')
  num_y_courses = Section.objects.filter(_semester='Y').count()
  for section in Section.objects.filter(_semester='Y'):
    # change the Y section into F
    section.semester = fall_sem
    section.save()

    # create new S section by copying section and its offerings
    offerings = section.offering_set.all()
    section.semester = winter_sem
    section.pk = None
    section.save()
    for offering in offerings:
      offering.section = section
      offering.pk = None
      offering.save()

  print "Updated {0} Y courses".format(num_y_courses)

    
if __name__ == '__main__':
  move_y_courses()