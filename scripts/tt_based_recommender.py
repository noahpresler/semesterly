import os, sys, django, pickle, progressbar
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np

from analytics.models import *
from scipy.sparse import lil_matrix
from scipy.spatial.distance import cosine
from student.models import *
from timetable.models import *

#dictionary mapping from course
#to tuple: (related course, similarity)
similarities = pickle.load(open("recommended.model", "rb"))

def recommend(course_ids):
	bar = progressbar.ProgressBar()
	recs = {}
	for cid in bar(course_ids): 
		related = filter(lambda x: x[0] != cid,sorted(similarities[cid],key=lambda x: x[1], reverse=True)[:10])
		for r in related: 
			if r[0] not in recs:
				recs[r[0]] = 0
			recs[r[0]] += r[1]
	recs = filter(lambda x: x[0] not in course_ids,sorted(recs.items(),key=lambda x: x[1], reverse=True))
	return map(lambda x: x[0], recs[:4])