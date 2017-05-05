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

    # calculate norms
    course_vectors_norms = []
    for i in range(course_vectors.shape[0]):
        course_vectors_norms.append(linalg.norm(course_vectors[i,:]))
    
    return CV, course_vectors, course_vectors_norms

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
