
import os, sys, django, pickle
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np

from scipy.sparse import lil_matrix
from timetable.models import *
from analytics.models import *
from student.models import *

#get the min,max course id for hopkins
max_id = Course.objects.filter(school='jhu').last().id

#for each timetable
#	create a scipy array of lenghth maxcourseid-mincourseid
#	set it to one corresponding to each course in timetable
ptts = PersonalTimetable.objects.filter(school='jhu').all()
feat_trix = lil_matrix((len(ptts), max_id), dtype=np.int8)
for ptt_idx in range(len(ptts)):
	for ft_idx in ptts[ptt_idx].courses.all().values_list('id', flat=True):
		feat_trix[ptt_idx, ft_idx] = 1

print "SUCCESS", feat_trix.shape

#write to file
pickle.dump(feat_trix, open("timetable.features", "wb"))