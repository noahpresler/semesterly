from timetable.models import *
from itertools import groupby

def get_isbn(textbook):
  return textbook.isbn

def dedupe_naive(textbooks):
  """Naively deletes any duplicates based on isbn."""
  isbns = set()
  num_dupes = 0
  for t in textbooks:
    if t.isbn not in isbns:
      isbns.add(t.isbn)
    else:
      num_dupes += 1
      t.delete()
  print "Deleted {0!s} duplicates.".format(num_dupes)

def dedupe(textbooks):
  """
  Deduplicate list of Textbooks based on ISBN, 
  taking the union of the fields.
  """
  textbooks = sorted(textbooks, key=get_isbn)
  groups = [list(g) for k, g in groupby(textbooks, get_isbn)]
  for g in groups:
    if len(g) > 1:
      combine_rows(g)

def combine_rows(group):
  """
  Take textbooks with same ISBN and union all the information 
  into single entry.
  """
  # accumulate fields from each textbook in group
  detail_url = get_best(map(lambda t: t.detail_url, group))
  image_url = get_best(map(lambda t: t.image_url, group))
  author = get_best(map(lambda t: t.author, group))
  title = get_best(map(lambda t: t.title, group))

  # create new textbook with all the acquired info
  if isinstance(group[0], Textbook):
    combined = Textbook(isbn=group[0].isbn,
                        detail_url=detail_url,
                        image_url=image_url,
                        title=title)
  else:
    combined = HopkinsTextbook(isbn=group[0].isbn,
                              detail_url=detail_url,
                              image_url=image_url,
                              title=title)

  # delete duplicates and save combined object
  for t in group:
    t.delete()
  combined.save()

def get_best(fields):
  """Take a list of fields, and return most informative one."""
  for f in fields:
    if f != 'Cannot Be Found':
      return f
  return 'Cannot Be Found'