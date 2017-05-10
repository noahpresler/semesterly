from __future__ import division
import pickle
import re
import numpy as np
import time
import math
import operator
import pdb
from operator import or_
from scipy.sparse import linalg
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.decomposition import LatentDirichletAllocation
from picklefield.fields import PickledObjectField
from django.db import models
from django.db.models import Q
from timetable.models import Semester, Course
from nltk.stem.porter import *
from collections import defaultdict

# Vectorizer (file writer)
class Vectorizer():
    def __init__(self):
        self.TITLE_WEIGHT = 3
        self.stemmer = PorterStemmer()

    def vectorize(self):
        # get names (titles) and descriptions for creating vocabulary
        raw_word_counts = []
        for course in Course.objects.all():
            raw_word_counts.append(self.get_stem_course(course.name, course.description, self.TITLE_WEIGHT))
        # vectorize course objects
        count_vectorizer = CountVectorizer(ngram_range=(1,2), stop_words='english')
        processed_word_counts = count_vectorizer.fit_transform(raw_word_counts)
        TFIDF_TF = TfidfTransformer(use_idf=False).fit(processed_word_counts)
        course_vectors = TFIDF_TF.transform(processed_word_counts)
        # save course vector
        i = 0
        for course in Course.objects.all():
            self.picklify(course, course_vectors[i])
            i+=1
        # store CountVectorizer in the memory
        with open('count_vectorizer.pickle', 'wb') as handle:
            pickle.dump(count_vectorizer, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def get_stem_course(self, name, description, W):
        stemmed_doc = ""
        if name:
            name_doc = name.encode('ascii', 'ignore')
            stemmed_name_doc = self.get_stem_doc(name_doc)
            for i in range(W):
                stemmed_doc += " " + stemmed_name_doc
            stemmed_doc += " "
        if description:
            desc_doc = description.encode('ascii', 'ignore')
            stemmed_desc_doc = self.get_stem_doc(desc_doc)
            stemmed_doc += stemmed_desc_doc
        return stemmed_doc

    def get_stem_doc(self, doc):
        return ' '.join([self.stemmer.stem(w.lower()) for w in doc.split(' ')])

    def picklify(self, course_object, course_vector):
        course_object.vector = course_vector
        course_object.save()

# Searcher (file reader / query performance)
class Searcher():    
    def __init__(self):
        self.count_vectorizer = self.load_count_vectorizer()
        self.vectorizer = Vectorizer()
        self.MAX_CAPACITY = 200
        #self.queries = []

    def load_count_vectorizer(self):
        with open('count_vectorizer.pickle', 'r') as handle:
            return pickle.load(handle)

    def vectorize_query(self, query):
        stemmed_qry = self.vectorizer.get_stem_doc(query)
        query_vector = self.count_vectorizer.transform([stemmed_qry])
        return query_vector

        #build user-relevant query
        '''
        self.queries.insert(0, query_vector)
        relevant_query = query_vector
        for i in range(1, len(self.queries)):
            relevant_query += (self.queries[i] / (i+1))
        return relevant_query
        '''

    def get_acronym(self, name):
        name = name.replace("and", "").replace("&", "").lower()
        return ''.join([i[:1] for i in name.split(' ')])

    def match_title(self, query, course_name):
        query_tokens = query.lower().split(' ')
        course_name = course_name.lower()
        if len(query_tokens) is 1 and self.get_acronym(course_name) == query:
            return 1
        return 1 if all(map(lambda q: q in course_name, query_tokens)) else 0

    def get_course(self, code):
        for course in Course.objects.all():
            if course.code == code:
                return course
        return None

    def get_cosine_sim(self, sparse_vec1, sparse_vec2):
        cross_product = np.sum(sparse_vec1.multiply(sparse_vec2))
        return cross_product

    def get_similarity(self, query, course):
        query_vector = self.vectorize_query(query.lower())
        return self.get_cosine_sim(query_vector, course.vector)

    def baseline_search(self, query):
        start_time = time.time()
        query_tokens = query.split()
        course_name_contains_query = reduce(operator.and_, map(self.course_name_contains_token, query_tokens))
        courses_objs = Course.objects.filter(course_name_contains_query).all()[:self.MAX_CAPACITY]
        elapsed_time = time.time() - start_time
        for course in courses_objs[:10]:
            print(course.name)
        print("\nBaseline Model Completed Searches in %f (seconds)" %elapsed_time)

    def advanced_search(self, query):
        start_time = time.time()
        query_tokens = query.split()
        course_contains_query = reduce(operator.and_, map(self.course_name_contains_token, query_tokens))
        title_matching_courses = Course.objects.filter(course_contains_query)
        descp_contains_query = []
        if title_matching_courses.count() < self.MAX_CAPACITY:
            descp_contains_query = reduce(operator.or_, map(self.course_desc_contains_token, query.replace("and", "").split()))
            descp_matching_courses = Course.objects.filter(descp_contains_query)
        courses_objs = list(title_matching_courses.all()[:self.MAX_CAPACITY]) + \
                       list(descp_matching_courses.all()[:self.MAX_CAPACITY - title_matching_courses.count()])

        self.get_relevant_courses(query, courses_objs)
        elapsed_time = time.time() - start_time
        print("\nAdvanced Model Completed Searches in %f (seconds)" %elapsed_time)

    def course_desc_contains_token(self, token):
        return Q(description__icontains=token)#.replace("and", "")))

    def course_name_contains_token(self, token):
        return (Q(code__icontains=token) |
                Q(name__icontains=token.replace("&", "and")) |
                Q(name__icontains=token.replace("and", "&")))

    def get_relevant_courses(self, query, course_filtered):
        query_vector = self.vectorize_query(query.lower())
        scores = []
        for course in course_filtered:
            scores.append((course, self.get_cosine_sim(query_vector, course.vector) + \
                                   self.match_title(query, course.name)))
        scores.sort(key=lambda tup:-tup[1])
        for (course, score) in scores[:10]:
            print("%s : %f" %(course.name, score))

    def wordify(self, course_vector):
        print(self.count_vectorizer.inverse_transform(course_vector))


# Model performance evaluator
class Evaluator():    
    def __init__(self):
        self._ = None

    def evaluate(self, query, relevant_courses):
        retrieved_courses = [i.code for i in get_all_relevant_courses(query)]
        num_relevant_courses = len(relevant_courses)
        num_retrieve_courses = len(retrieved_courses)
        prec_25, prec_50, prec_75 = 0.0, 0.0, 0.0
        prec_25_idx = int(num_relevant_courses*(1.0/4))
        prec_50_idx = int(num_relevant_courses*(2.0/4))
        prec_75_idx = int(num_relevant_courses*(3.0/4))
        precision_array = []

        num_retrieved = 0
        i = 1
        while num_retrieved < num_relevant_courses:
            course_code = retrieved_courses[i-1]
            #print(course_code)
            if course_code in relevant_courses:
                num_retrieved+=1.0
            precision_array.append(float(num_retrieved / i))
            i+=1
        prec_25 = precision_array[prec_25_idx]
        prec_50 = precision_array[prec_50_idx]
        prec_75 = precision_array[prec_75_idx]
        prec_100 = precision_array[-1]

        prec_mean_1 = (prec_25 + prec_50 + prec_75) / 3.0

        by_10 = np.arange(0.0, num_relevant_courses, (num_relevant_courses+0.0)/10.0)
        by_10 = [int(idx) for idx in by_10]
        prec_mean_2 = 0.0
        for i in by_10:
            prec_mean_2 += precision_array[i]
        prec_mean_2 = prec_mean_2/10

        rank_sum = 0.0
        rank_log_sum = 0.0

        k_i = 1
        for i in range(len(retrieved_courses)):
            if retrieved_courses[i] in relevant_courses:
                rank_sum += (i+1) - (k_i)
                rank_log_sum += math.log(i+1) - math.log(k_i)
                k_i+=1

        recall_norm = 1.0 - ( rank_sum / (num_relevant_courses * (num_retrieve_courses - num_relevant_courses)) )

        prec_norm = 1.0 - (rank_log_sum / 
            ( num_retrieve_courses * math.log(num_retrieve_courses) - (num_retrieve_courses - num_relevant_courses) * math.log(num_retrieve_courses - num_relevant_courses) - (num_relevant_courses) * math.log(num_relevant_courses) ))

        return (prec_25, prec_50, prec_75, prec_100, prec_mean_1, prec_mean_2, prec_norm, recall_norm)


    def evaluate_full(self):
        total_scores = [0.0] * 8
        queries = []
        relevant_courses = []
        with open("searches/query_test.txt") as f:
            for line in f.read().split('\n'):
                query, codes = line.split('->')
                queries.append(query)
                relevant_courses.append(codes.split(', '))

        for i in range(len(queries)):
            result = evaluate(queries[i], relevant_courses[i])
            show = "   %2d  %.2f   %.2f   %.2f   %.2f    %.4f    %.4f    %.3f   %.3f   \n"\
                   %(i, result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7])
            #print(show)
            for i in range(8):
                total_scores[i] += result[i]

        for i in range(8):
            total_scores[i] /= len(queries)

        averaged_results = \
               "   ----------------------------------------------------------------\n"\
               "                          Averaged Results                         \n"\
               "   ----------------------------------------------------------------\n"\
               "   **  P.25   P.50   P.75   P1.00   P_mean1   P_mean2.  P_norm  R_norm\n"\
               "   ==  ====   ====   ====   =====   =======   ========  ======  ======\n"\
               "   %2d  %.2f   %.2f   %.2f   %.2f    %.4f    %.4f    %.3f   %.3f   \n"\
                   %(len(queries), total_scores[0], total_scores[1], total_scores[2], total_scores[3], total_scores[4], total_scores[5], total_scores[6], total_scores[7])
        print(averaged_results)


# Experiment
class Experiment():
    def __init__(self):
        self._ = None

    def run_LDA(self):
        X = []
        for course in Course.objects.all():
            X.append(course.name + " " + course.description)
        n_features = 1000
        n_topics = 50
        n_top_words = 10
        n_samples = len(X)
        X_trans, topics, topic_components= self.fit_lda(X, n_features, n_topics, n_top_words, n_samples)

    def fit_lda(self, X, n_features, n_topics, n_top_words, n_samples):
        print("Fitting LDA models with tf features, n_samples=%d and n_features=%d..." % (n_samples, n_features))
        tf_vectorizer = CountVectorizer(max_df=0.95, min_df=2,
                                    max_features=n_features,
                                    ngram_range=(1,1),
                                    stop_words='english')
        tf = tf_vectorizer.fit_transform(X)
        lda = LatentDirichletAllocation(n_topics=n_topics, max_iter=5,
                                    learning_method='online',
                                    learning_offset=50.,
                                    random_state=0)
        X = lda.fit_transform(tf)
        print("\nTopics in LDA model:")
        tf_feature_names = tf_vectorizer.get_feature_names()
        topics = self.print_top_words(lda, tf_feature_names, n_top_words)
        return X, topics, lda.components_

    def print_top_words(self, model, feature_names, n_top_words):
        topics = []
        for topic_idx, topic in enumerate(model.components_):
            print("Course Topic #%d:" % topic_idx)
            new_topic = " ".join([feature_names[i]
                            for i in topic.argsort()[:-n_top_words - 1:-1]])
            print(new_topic)
            topics.append(new_topic)
        print()
        return(topics)
