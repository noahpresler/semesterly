from __future__ import division
import pickle
import re
import numpy as np
import time
import math
from operator import or_
from scipy.sparse import linalg
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from picklefield.fields import PickledObjectField
from django.db import models
from django.db.models import Q
from timetable.models import Semester, Course
from nltk.stem.porter import *
from collections import defaultdict

TITLE_WEIGHT = 3
stemmer = PorterStemmer()

def vectorize():
    # get names (titles) and descriptions for creating vocabulary
    raw_word_counts = []
    for course in Course.objects.all():
        raw_word_counts.append(get_stem_course(course.name, course.description, TITLE_WEIGHT))

    # vectorize course objects
    count_vectorizer = CountVectorizer(ngram_range=(1,2), stop_words='english')
    processed_word_counts = count_vectorizer.fit_transform(raw_word_counts)
    TFIDF_TF = TfidfTransformer(use_idf=False).fit(processed_word_counts)
    course_vectors = TFIDF_TF.transform(processed_word_counts)

    # save course vector
    i = 0
    for course in Course.objects.all():
        picklify(course, course_vectors[i])
        i+=1

    # store CountVectorizer in the memory
    with open('count_vectorizer.pickle', 'wb') as handle:
        pickle.dump(count_vectorizer, handle, protocol=pickle.HIGHEST_PROTOCOL)

def load_count_vectorizer():
    with open('count_vectorizer.pickle', 'r') as handle:
        return pickle.load(handle)

def get_stem_course(name, description, W):
    stemmed_doc = ""
    if name:
        name_doc = name.encode('ascii', 'ignore')
        stemmed_name_doc = get_stem_doc(name_doc)
        for i in range(W):
            stemmed_doc += " " + stemmed_name_doc
        stemmed_doc += " "
    if description:
        desc_doc = description.encode('ascii', 'ignore')
        stemmed_desc_doc = get_stem_doc(desc_doc)
        stemmed_doc += stemmed_desc_doc
    return stemmed_doc

def get_acronym(name):
    name = name.replace("and", "").replace("&", "").lower()
    return ''.join([i[:1] for i in name.split(' ')])

def get_stem_doc(doc):
    return ' '.join([stemmer.stem(w.lower()) for w in doc.split(' ')])

def wordify(course_vector):
    count_vectorizer = load_count_vectorizer()
    print(count_vectorizer.inverse_transform(course_vector))

def picklify(course_object, course_vector):
    course_object.vector = course_vector
    course_object.save()
    print(course_object.vector)

# def course_name_contains_token(token):
#     return (Q(code__icontains=token) |
#             Q(name__icontains=token.replace("&", "and")) |
#             Q(name__icontains=token.replace("and", "&")))
#
#
# def get_course_matches(school, query, semester):
#     if query == "":
#         return Course.objects.filter(school=school)
#
#     query_tokens = query.split()
#     course_name_contains_query = reduce(
#         operator.and_, map(course_name_contains_token, query_tokens))
#     return Course.objects.filter(
#         Q(school=school) &
#         course_name_contains_query &
#         Q(section__semester=semester)
#     ).distinct()


def vectorize_query(query):
    start_time = time.time()
    count_vectorizer = load_count_vectorizer()
    elapsed_time = time.time() - start_time
    print("Time to take CourseVectorizer object: %f (seconds)\n" %elapsed_time)
    stemmed_qry = get_stem_doc(query)
    query_vector = count_vectorizer.transform([stemmed_qry])
    return query_vector

def get_cosine_sim(sparse_vec1, sparse_vec2):
    cross_product = np.sum(sparse_vec1.multiply(sparse_vec2))
    return cross_product

def match_title(query, course_name):
    query_tokens = query.lower().split(' ')
    # matching acronym
    if len(query_tokens) is 1 and get_acronym(course_name) == query:
        return 1
    # matching title
    count = 0
    for q in query_tokens:
        if q in course_name.lower():
            count+=1
    if count == len(query_tokens):
        return 1
    return 0

def get_course(code):
    for course in Course.objects.all():
        if course.code == code:
            return course
    return None

def get_similarity(query, course):
    query_vector = vectorize_query(query.lower())
    return get_cosine_sim(query_vector, course.vector)

def get_all_relevant_courses(query):
    return get_relevant_courses(query, Course.objects.all())

def get_relevant_courses(query, course_filtered):
    start_time = time.time()
    query_vector = vectorize_query(query.lower())
    #course_score = defaultdict(int)
    #retrieved_courses = {}
    scores = []
    for course in course_filtered:
        score = get_cosine_sim(query_vector, course.vector) + match_title(query, course.name)
        scores.append((course, score))
        # handling duplicates
        #if score >= course_score[course.name]:
            #course_score[course.name] = score
            #retrieved_courses[course.name] = course
    #scores = [(k, v) for k,v in course_score.items()]
    scores.sort(key=lambda tup:-tup[1])
    elapsed_time = time.time() - start_time
    if len(scores) < 10:
        for i in range(len(scores)):
            print(str(scores[i][0]) + ": " + str(scores[i][1]))
    else:
        for i in range(10):
            print(str(scores[i][0]) + ": " + str(scores[i][1]))    
    print("\nSearched in %f (seconds)" %elapsed_time)
    return [course[0] for course in scores]
    #return [retrieved_courses[name] for (name, val) in scores]

def evaluate(query, relevant_courses):
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


def evaluate_full():
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

