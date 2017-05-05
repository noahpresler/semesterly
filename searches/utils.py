import pickle
import re
import numpy as np
from operator import or_
from scipy.sparse import linalg
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from picklefield.fields import PickledObjectField
from django.db import models
from timetable.models import Semester, Course

def vectorize():
    # get names (titles) and descriptions for creating vocabulary
    names = []
    descp = []
    for course in Course.objects.all():
        names.append(course.name)
        descp.append(course.description)

    # vectorize course objects
    vocabulary = reduce(or_, [vocabularize(names), vocabularize(descp)])
    CV = CountVectorizer(ngram_range=(1,2), vocabulary=vocabulary, stop_words='english')    
    descp_counts = CV.transform(descp) * 3
    names_counts = CV.transform(names) * 10
    course_counts = descp_counts + names_counts
    TFIDF_TF = TfidfTransformer(use_idf=False).fit(descp_counts)
    course_vectors = TFIDF_TF.transform(course_counts)

    # calculate norms (if not using TFIDF)
    #course_vectors_norms = []
    #for i in range(course_vectors.shape[0]):
    #    course_vectors_norms.append(linalg.norm(course_vectors[i,:]))

    i = 0
    for course in Course.objects.all():
        #picklify(course, course_vectors[i])
        i+=1

    return CV

def vocabularize(corpus):
    return set([word for doc in corpus for word in tokenizer(doc)])

def tokenizer(doc):
    # Using default pattern from CountVectorizer
    token_pattern = re.compile('(?u)\\b\\w\\w+\\b')
    return [t for t in token_pattern.findall(doc)]

def wordify(CV, course_vector):
    print(CV.inverse_transform(course_vector))

def picklify(course_object, course_vector):
    course_object.vector = course_vector
    course_object.save()

def vectorize_query(query):
    if not query:
        return None
    CV = vectorize()
    query_vector = CV.transform([query])
    return query_vector

def compute_qry2course_relevancy(query, course):
    if not query:
        return None
    query_vector = vectorize_query(query.lower())
    return compute_cosine_sim(query_vector, course.vect)

def compute_all_qry2course_relevancy(query):
    if not query:
        return None
    query_tokens = query.lower().split(' ')
    query_vector = vectorize_query(query.lower())
    scores = []
    for course in Course.objects.all():
        scores.append((course.name, compute_cosine_sim(query_vector, course.vector) + match_title(query_tokens, course.name)))
    scores.sort(key=lambda tup:-tup[1])
    return scores[:10]

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
