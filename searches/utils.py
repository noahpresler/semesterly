import pickle
import re
import numpy as np
import time
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
        raw_word_counts.append(stem_course(course.name, course.description, TITLE_WEIGHT))

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

def stem_course(name, description, W):
    stemmed_doc = ""
    if name:
        name_doc = name.encode('ascii', 'ignore')
        stemmed_name_doc = stem_doc(name_doc)
        for i in range(W):
            stemmed_doc += " " + stemmed_name_doc
        stemmed_doc += " "
    if description:
        desc_doc = description.encode('ascii', 'ignore')
        stemmed_desc_doc = stem_doc(desc_doc)
        stemmed_doc += stemmed_desc_doc
    return stemmed_doc

def get_acronym(name):
    name = name.replace("and", "").replace("&", "").lower()
    return ''.join([i[:1] for i in name.split(' ')])

def stem_doc(doc):
    return ' '.join([stemmer.stem(w.lower()) for w in doc.split(' ')])

def wordify(course_vector):
    count_vectorizer = load_count_vectorizer()
    print(count_vectorizer.inverse_transform(course_vector))

def picklify(course_object, course_vector):
    course_object.vector = course_vector
    course_object.save()

def vectorize_query(query):
    start_time = time.time()
    count_vectorizer = load_count_vectorizer()
    elapsed_time = time.time() - start_time
    print("Time to take CourseVectorizer object: %f (seconds)\n" %elapsed_time)
    stemmed_qry = stem_doc(query)
    query_vector = count_vectorizer.transform([stemmed_qry])
    return query_vector

def compute_cosine_sim(sparse_vec1, sparse_vec2):
    cross_product = np.sum(sparse_vec1.multiply(sparse_vec2))
    return cross_product

def match_title(query, course_name):
    query_tokens = query.lower().split(' ')
    # acronym
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

def compute_qry2course_relevancy(query, course):
    query_vector = vectorize_query(query.lower())
    return compute_cosine_sim(query_vector, course.vector)

def compute_all_qry2course_relevancy(query):
    return get_relevant_courses(query, Course.objects.all())

def get_relevant_courses(query, course_filtered):
    start_time = time.time()
    query_vector = vectorize_query(query.lower())
    course_score = defaultdict(int)
    for course in course_filtered:
        score = compute_cosine_sim(query_vector, course.vector) + match_title(query, course.name)
        if score > 0.0 and score > course_score[course.name]:
            course_score[course.name] = score
    #print([(k, v) for k,v in course_score.items()])
    scores = [(k, v) for k,v in course_score.items()]
    scores.sort(key=lambda tup:-tup[1])
    elapsed_time = time.time() - start_time
    if len(scores) < 10:
        for i in range(len(scores)):
            print(str(scores[i][0]) + ": " + str(scores[i][1]))
    else:
        for i in range(10):
            print(str(scores[i][0]) + ": " + str(scores[i][1]))
    
    print("\nSearched in %f (seconds)" %elapsed_time)
