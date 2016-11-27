import os, sys, django, pickle, progressbar
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np

from analytics.models import *
from scipy.sparse import lil_matrix
from scipy.spatial.distance import cosine
from student.models import *
from timetable.models import *


#write to file
feat_trix = pickle.load(open("timetable.features", "rb"))

#prep sizes
num_fts = feat_trix.shape[1]
num_tts = feat_trix.shape[0]
print "Training on {0} features, {1} timetables".format(num_fts,num_tts)


#dictionary mapping from course
#to tuple: (related course, similarity)
similarities = {}


# For each Course, C1
#   For each Timetable TT with Course C1
#       For each Course C2 in Timetable TT
#           Record that a Timetable has courses C1 and C2
#   For each Course C2
#       Compute the similarity between C1 and C2
bar = progressbar.ProgressBar()
#TODO filter out all zero courses
for c1 in bar(range(num_fts)):
    similar = set()
    c1_rows = filter(lambda ptt_idx: feat_trix[ptt_idx, c1] ,range(num_tts))
    for tt in c1_rows:
        row = feat_trix[tt].toarray()[0]
        similar = similar.union(set(np.where(row > 0)[0].flatten()))
    for c2 in similar:
        css = 1 - 1 * cosine(feat_trix[:,c1].toarray(), feat_trix[:,c2].toarray())
        if c1 not in similarities:
            similarities[c1] = []
        similarities[c1].append((c2,css))


# print "TOP 3 AS RELATED TO DISCRETE MATH"
# sorted(similarities[5688], key=lambda x: x[1], reverse=True)[:3]
pickle.dump(similarities, open("recommended.model", "wb"))
print "FILE WRITTEN"

bar2 = progressbar.ProgressBar()
for cid in bar2(similarities.keys()):
    related = filter(lambda x: x[0] != cid,sorted(similarities[cid],key=lambda x: x[1], reverse=True)[:5])
    course = Course.objects.get(cid)
    Course.related_courses.through.objects.filter(from_course_id=cid).delete()
    Course.related_courses.through.objects.filter(to_course_id=cid).delete()
    for c in related:
        course.related_courses.add(c)