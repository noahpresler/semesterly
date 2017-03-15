from collections import Counter
from pprint import pprint
import progressbar


# schools whose second semester is called the winter semester (instead of spring)
winter_schools = {'uoft', 'queens', 'umich', 'umich2'}

def get_update_operation(app_name, table_names, get_school):
  """
  Take an app name and a list of table names and return a function that can
  be passed in to migrations.RunPython and that updates the semester field of each
  row of each table based on the old _semester field.
  """
  def update_operation(apps, schema_editor):
    for table_name in table_names:
      update_sem_fields(apps.get_model(app_name, table_name), 
                        get_school, 
                        apps.get_model('timetable', 'Semester'))
  return update_operation

def update_sem_fields(table, get_school, sem_table):
  """ 
  Take a Django table object, a function which takes an instance of that object
  and returns the associated school, and the corresponding Semester object and
  update the semester field of each row of the input table.
  """
  num_updated = 0
  name_year_to_semester = {}
  bad_inputs = Counter()
  bar = progressbar.ProgressBar(max_value=table.objects.count())
  for i, row in enumerate(table.objects.all().iterator()):
    semester_code = row._semester
    name = code_to_name(semester_code, get_school(row))
    year = '2017' if semester_code == 'S' else '2016'

    # avoid .get or .setdefault because of eager evaluation of DB access
    if (name, year) not in name_year_to_semester:
      try:
        name_year_to_semester[(name, year)] = sem_table.objects.get(name=name, year=year)
      except:
        bad_inputs[semester_code] += 1
        continue
    semester = name_year_to_semester[(name, year)]

    row.semester = semester
    row.save()
    bar.update(i)
    num_updated += 1

  print "Updated {0}/{1} rows from table {2}".format(num_updated, len(table.objects.all()), str(table))
  print "Ignored the following unknown semester codes:"
  pprint(bad_inputs)
  print

def code_to_name(semester_code, school):
  """ Take a valid semester code for a school and return its full name """
  if semester_code == 'F':
    return 'Fall'
  elif semester_code == 'Y':
    return 'Full Year'
  else:
    return 'Winter' if school in winter_schools else 'Spring'
