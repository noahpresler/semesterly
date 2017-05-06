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
from timetable.models import Semester, Course
from nltk.stem.porter import *

TITLE_WEIGHT = 3
stemmer = PorterStemmer()

def vectorize():
    # get names (titles) and descriptions for creating vocabulary
    raw_word_counts = []
    for course in Course.objects.all():
        raw_word_counts.append(stem_course(course.name, course.description, TITLE_WEIGHT))

    # vectorize course objects
    CV = CountVectorizer(ngram_range=(1,2), stop_words='english')
    processed_word_counts = CV.fit_transform(raw_word_counts)
    TFIDF_TF = TfidfTransformer(use_idf=False).fit(processed_word_counts)
    course_vectors = TFIDF_TF.transform(processed_word_counts)

    # save course vector
    i = 0
    for course in Course.objects.all():
        #picklify(course, course_vectors[i])
        i+=1

    # store CountVectorizer in the memory
    return CV

def stem_course(name, description, W):
    stemmed_doc = ""
    if name:
        name_doc = name.encode('ascii', 'ignore')
        stemmed_name_doc = ' '.join([stemmer.stem(w.lower()) for w in name_doc.split(' ')])
        for i in range(W):
            stemmed_doc += " " + stemmed_name_doc
        stemmed_doc += " "
    if description:
        desc_doc = description.encode('ascii', 'ignore')
        stemmed_desc_doc = ' '.join([stemmer.stem(w.lower()) for w in desc_doc.split(' ')])
        stemmed_doc += stemmed_desc_doc
    return stemmed_doc


def wordify(CV, course_vector):
    print(CV.inverse_transform(course_vector))

def picklify(course_object, course_vector):
    course_object.vector = course_vector
    course_object.save()

def vectorize_query(query):
    CV = vectorize()
    query_vector = CV.transform([query])
    return query_vector

def compute_cosine_sim(sparse_vec1, sparse_vec2):
    cross_product = np.sum(sparse_vec1.multiply(sparse_vec2))
    # cross_product = np.sum(sparse_vec1.multiply(sparse_vec2)) / math.sqrt(vec1_norm * vec2_norm)
    return cross_product

def match_title(query_tokens, course_name):
    count = 0
    for q in query_tokens:
        if q in course_name.lower():
            count+=1
    if count == len(query_tokens):
        return 1
    return 0

def compute_qry2course_relevancy(query, course):
    query_vector = vectorize_query(query.lower())
    return compute_cosine_sim(query_vector, course.vect)

def compute_all_qry2course_relevancy(query):
    return get_relevant_courses(query, Course.objects.all())

def get_relevant_courses(query, course_filtered):
    start_time = time.time()

    query_tokens = query.lower().split(' ')
    query_vector = vectorize_query(query.lower())
    scores = []
    for course in course_filtered:
        score = compute_cosine_sim(query_vector, course.vector)# + match_title(query_tokens, course.name)
        if score > 0.10:
            scores.append((course, score))
    scores.sort(key=lambda tup:-tup[1])
    results = []
    for i in range(5):
        try:
            results.append(scores.pop(0)[0])
        except:
            continue
    elapsed_time = time.time() - start_time
    print("serach done in %f (seconds)" %elapsed_time)
    return results
