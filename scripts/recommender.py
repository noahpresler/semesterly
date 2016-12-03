import os, sys, django, pickle, progressbar, argparse
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np

from analytics.models import *
from scipy.sparse import lil_matrix
from scipy.spatial.distance import cosine
from student.models import *
from timetable.models import *

class Recommender():

    def __init__(self,school):
        self.school = school

    def featurize(self):
        #get the min,max course id for hopkins
        max_id = Course.objects.filter(school=self.school).last().id
        #for each timetable
        #   create a scipy array of lenghth maxcourseid-mincourseid
        #   set it to one corresponding to each course in timetable
        ptts = PersonalTimetable.objects.filter(school=self.school).all()
        feat_trix = lil_matrix((len(ptts), max_id), dtype=np.int8)
        bar = progressbar.ProgressBar()
        for ptt_idx in bar(range(len(ptts))):
            for ft_idx in ptts[ptt_idx].courses.all().values_list('id', flat=True):
                feat_trix[ptt_idx, ft_idx] = 1
        #write to file
        pickle.dump(feat_trix, open(self.school + ".timetable.features", "wb"))


    def train(self):
        #write to file
        feat_trix = pickle.load(open(self.school + ".timetable.features", "rb"))
        #prep sizes
        num_fts = feat_trix.shape[1]
        num_tts = feat_trix.shape[0]
        print "Training {0} on {1} features, {2} timetables".format(self.school, num_fts, num_tts)
        #dictionary mapping from coursef
        #to tuple: (related course, similarity)
        similarities = {}
        # For each Course, C1
        #   For each Timetable TT with Course C1
        #       For each Course C2 in Timetable TT
        #           Record that a Timetable has courses C1 and C2
        #   For each Course C2
        #       Compute the similarity between C1 and C2
        bar = progressbar.ProgressBar()
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
        pickle.dump(similarities, open(self.school + ".recommended.model", "wb"))


    def predict(self, cid, similarities=None):
        if not similarities:
            similarities = pickle.load(open(self.school + ".recommended.model", "rb"))
        # filter the top 5 courses by similarity score, removing the course itself from the list
        return filter(lambda x: x[0] != cid,sorted(similarities[cid],key=lambda x: x[1], reverse=True)[:5])


    def predict_save_all(self):
        similarities = pickle.load(open(self.school + ".recommended.model", "rb"))
        bar2 = progressbar.ProgressBar()
        for cid in bar2(similarities.keys()):
            related = self.predict(cid, similarities)
            course = Course.objects.get(id=cid)
            #delete old associations via the many-to-many field
            Course.related_courses.through.objects.filter(from_course_id=cid).delete()
            Course.related_courses.through.objects.filter(to_course_id=cid).delete()
            for c in related:
                course.related_courses.add(Course.objects.get(id=c[0]))


    def recommend(self, course_ids):
        similarities = pickle.load(open(self.school + ".recommended.model", "rb"))
        bar = progressbar.ProgressBar()
        recs = {}
        for cid in bar(course_ids): 
            #for each course, get the related courses by top similarity score
            related = filter(lambda x: x[0] != cid,sorted(similarities[cid],key=lambda x: x[1], reverse=True)[:10])
            for r in related: 
                if r[0] not in recs:
                    recs[r[0]] = 0
                recs[r[0]] += r[1]
        # sort recs by similarity score after aggregating/summing across all courses in tt, remove courses in tt
        recs = filter(lambda x: x[0] not in course_ids,sorted(recs.items(),key=lambda x: x[1], reverse=True))
        ret = map(lambda x: x[0], recs[:4])
        print "Recommending:", ret
        return ret


def main():
    parser = argparse.ArgumentParser(description='Recommender system using collaborative filtering')
    parser.add_argument('--action', dest='action', required=True, choices=["train", "featurize", "predict", "save", "recommend"])
    parser.add_argument('--cids', dest='cids', default=None, type=str, help="List of course ids, comma seperated for recommending")
    parser.add_argument('--school', dest='school', required=True, help="School is required")
    
    args = parser.parse_args()
    cids = map(lambda x: int(x), args.cids.split(',')) if args.cids else None
    recommender = Recommender(str(args.school))

    if args.action == "train":
        recommender.train()
    elif args.action == "featurize":
        recommender.featurize()
    elif args.action == "predict":
        if not cids or len(cids) == 0:
            print "MUST PROVIDE COURSE IDS"
            exit()
        recommender.predict(cids[0])
    elif args.action == "save":
        recommender.predict_save_all()
    elif args.action == "recommend":
        if not cids or len(cids) == 0:
            print "MUST PROVIDE COURSE IDS"
            exit()
        recommender.recommend(cids)


if __name__ == "__main__":
    main()

