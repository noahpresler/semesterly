# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

import os, sys, django, pickle, progressbar, argparse
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np
import time

from analytics.models import *
from scipy.sparse import lil_matrix
from scipy.spatial.distance import cosine, correlation, hamming, jaccard
from student.models import *
from timetable.models import *
from recommender import Recommender
import random
from operator import itemgetter

def score(recommender, course_ids, similarities, num_remove):
    removed = list(np.random.choice(course_ids, num_remove, replace=False))
    print("removed: ", removed)
    for r in removed:
        course_ids.remove(r)
    scores = np.zeros(num_remove)
    for i in range(num_remove):
        recs = recommender.recommend(course_ids, similarities)
        if set(removed).intersection(set(recs)):
            c = set(removed).intersection(set(recs)).pop()
            course_ids.append(c)
            removed.remove(c)
            scores[i] = 1
        elif recs[0] in similarities:
            keys = [x[0] for x in (similarities[recs[0]])]
            if set(removed).intersection(set(keys)):
                c = set(removed).intersection(set(keys)).pop()
                course_ids.append(c)
                removed.remove(c)
                scores[i] = similarities[recs[0]][keys.index(c)][1]
    return scores

def main(args):
    start_time = time.time()
    simfcn = 'cosine'
    similarities = pickle.load(open("jhu.recommended.model", "rb"))
    recommender = Recommender(args.school, simfcn)

    ptts = []
    if args.action == "all":
        ptts = PersonalTimetable.objects.filter(school=args.school, semester=Semester.objects.filter(name=args.semester, year=args.year))
    else:
        print((args.action))
        major_students = Student.objects.filter(major=args.action)
        ptts = PersonalTimetable.objects.filter(school=args.school, semester=Semester.objects.filter(name=args.semester, year=args.year), student__in=major_students)
    scores = {}
    num_timetables = {}
    for ptt in ptts:
        course_ids = [c.id for c in list(ptt.courses.all())]
        length = len(course_ids)
        if length < args.num_remove + 1:
            continue
        s = score(recommender, course_ids, similarities, args.num_remove)
        if length not in scores:
            scores[length] = np.zeros(args.num_remove)
            num_timetables[length] = 0
        scores[length] += s
        num_timetables[length] += 1
    print(num_timetables)
    
    for length in scores:
        scores[length] /= float(num_timetables[length])
    print(scores)
    pickle.dump(scores, open('recommender.' + args.school + '.scores', "wb"))

def get_args():
    parser = argparse.ArgumentParser(description='Recommender evaluation system')
    parser.add_argument('--action', dest='action', required=True, type=str)
    parser.add_argument('--school', dest='school', required=True, help="School is required", type=str)
    parser.add_argument('--semester', dest='semester', required=True, help="", type=str)
    parser.add_argument('--year', dest='year', required=True, help="", type=str)
    parser.add_argument('--num_remove', dest='num_remove', required=True, help="", type=int)
    return parser.parse_args()

if __name__ == "__main__":
    args = get_args()
    main(args)