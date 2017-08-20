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

import pickle as pickle
import numpy as np
import operator
from sklearn.feature_extraction.text import TfidfTransformer
from django.db.models import Q
from timetable.models import Course
from nltk.stem.porter import *
import progressbar
from functools import reduce


def baseline_search(school, query, semester):
    """Baseline search returns courses that are contained in the name from a query (legacy code)."""
    if query == "":
        return Course.objects.filter(school=school)
    query_tokens = query.strip().lower().split()
    course_name_contains_query = reduce(operator.and_, list(map(course_name_contains_token, query_tokens)))
    return Course.objects.filter(
        Q(school=school) &
        course_name_contains_query &
        Q(section__semester=semester)
    )


def course_desc_contains_token(token):
    """Returns a query set of courses where tokens are contained in descriptions."""
    return Q(description__icontains=token)


def course_name_contains_token(token):
    """Returns a query set of courses where tokens are contained in code or name."""
    return (Q(code__icontains=token) |
            Q(name__icontains=token.replace("&", "and")) |
            Q(name__icontains=token.replace("and", "&")))


class Vectorizer:
    """ Vectorizer class creates a dictionary over courses and build course vectors using count vectorizer."""
    def __init__(self):
        self.TITLE_WEIGHT = 3
        self.stemmer = PorterStemmer()

    def vectorize(self):
        """Vectorize function transforms and saves entire course objects into course vectors using TF-IDF."""

        raw_word_counts = []
        bar = progressbar.ProgressBar(max_value=Course.objects.count())

        print("Stringifying all courses for vectorization...")
        for current_count, course in enumerate(Course.objects.all().iterator()):
            raw_word_counts.append(self.course_to_str(course.name,
                                                      course.description,
                                                      course.areas,
                                                      self.TITLE_WEIGHT))
            bar.update(current_count)

        print("Transforming all courses into vectors...")
        with open('searches/dictionary.pickle', 'r') as handle:
            count_vectorizer = pickle.load(handle)
        processed_word_counts = count_vectorizer.transform(raw_word_counts)
        tfidf_tf = TfidfTransformer(use_idf=True).fit(processed_word_counts)
        course_vectors = tfidf_tf.transform(processed_word_counts)

        bar.update(0)
        print("Saving all course vectors...")
        # save course vector to model.
        for current_count, course in enumerate(Course.objects.all().iterator()):
            course.vector = course_vectors[current_count]
            course.save()
            bar.update(current_count)


    def course_to_str(self, name, description, area, weight):
        """Returns a string representation of a course using a Porter Stemmer."""
        stemmed_doc = ""
        if name:
            name_doc = name.encode('ascii', 'ignore')
            stemmed_name_doc = self.doc_to_lower_stem_str(name_doc)
            stemmed_doc += (' ' + stemmed_name_doc) * weight + " "
        if description:
            desc_doc = description.encode('ascii', 'ignore')
            stemmed_doc += self.doc_to_lower_stem_str(desc_doc)
        if area:
            area_doc = area.encode('ascii', 'ignore')
            stemmed_doc += self.doc_to_lower_stem_str(area_doc)
        return stemmed_doc

    def doc_to_lower_stem_str(self, doc):
        """Converts words in document(string) to lowercase, stemmed words."""
        return ' '.join([self.stemmer.stem(w.lower()) for w in doc.split(' ')])


class Searcher:
    """ Searcher class implements baseline search and vectorized search based on information retrieval techniques. """
    def __init__(self):
        self.vectorizer = Vectorizer()
        self.count_vectorizer = self.load_count_vectorizer()
        self.MAX_CAPACITY = 300
        self.start_time = 0

    def load_count_vectorizer(self):
        """Loads english dictionary count vectorizer pickle object."""
        with open('searches/dictionary.pickle', 'rb') as handle:
            return pickle.load(handle, encoding='latin1')

    def vectorize_query(self, query):
        """Vectorizes a user's query using count vectorizer."""
        stemmed_qry = self.vectorizer.doc_to_lower_stem_str(query)
        query_vector = self.count_vectorizer.transform([stemmed_qry])
        return query_vector

    def get_acronym(self, name):
        """Returns an acronym of a course name."""
        name = name.replace("and", "").replace("&", "").lower()
        return ''.join([i[0] for i in name.split(' ')])

    def matches_name(self, query, course_name):
        """Returns a score (2, 1, 0) of a query match to course name."""
        query_tokens = query.strip().lower().split(' ')
        course_name = course_name.lower()
        title_contains_query = all([q in course_name for q in query_tokens])
        if title_contains_query and len(query_tokens) is len(course_name.split()):
            return 2
        elif title_contains_query:
            return 1
        else:
            return 0

    def get_cosine_sim(self, sparse_vec1, sparse_vec2):
        """Computes cosine similarity between two sparse vectors."""
        if sparse_vec1 is not None and sparse_vec2 is not None:
            try:
                return np.sum(sparse_vec1.multiply(sparse_vec2))
            except:
                # FIXME -- Python3 Transition (Hugh)
                return 0
        else:
            return 0

    def get_similarity(self, query, course):
        """Vectorizes query and returns a cosine similarity score between query and course vector."""
        query_vector = self.vectorize_query(query.lower())
        return self.get_cosine_sim(query_vector, course.vector)

    def vectorized_search(self, school, query, semester):
        """Returns filtered courses that are most relevant to a given query."""
        if query == "":
            return Course.objects.filter(school=school)
        query_tokens = query.strip().lower().split()
        course_name_contains_query = reduce(operator.and_, list(map(course_name_contains_token, query_tokens)))
        title_matching_courses = Course.objects.filter(
            Q(school=school) &
            course_name_contains_query &
            Q(section__semester=semester)
        )

        base_count = title_matching_courses.count()
        if base_count < self.MAX_CAPACITY:
            descp_contains_query = reduce(operator.or_, list(map(course_desc_contains_token, query.replace("and", "").split())))
            descp_matching_courses = Course.objects.filter(Q(school=school) &
                                                           descp_contains_query &
                                                           Q(section__semester=semester))\
                .exclude(reduce(operator.and_, list(map(course_name_contains_token, query_tokens))))
            courses_objs = list(title_matching_courses.all().distinct('code')[:self.MAX_CAPACITY]) + \
                           list(descp_matching_courses.all().distinct('code')[:self.MAX_CAPACITY - base_count])
        else:
            courses_objs = list(title_matching_courses.all().distinct('code')[:self.MAX_CAPACITY])

        return self.get_most_relevant_filtered_courses(query, courses_objs)

    def get_most_relevant_filtered_courses(self, query, course_filtered):
        """Returns the most relevant filtered courses given a query from filtered course objects."""
        query_vector = self.vectorize_query(query.lower())
        return sorted(course_filtered, key=lambda course: -self.get_score(course, query, query_vector))

    def get_score(self, course, query, query_vector):
        """Computes similarity score based on cosine similarity and match between query and course name."""
        return self.get_cosine_sim(query_vector, course.vector) + self.matches_name(query, course.name)

    def wordify(self, course_vector):
        """Converts a course vector back into string using count vectorizer."""
        print((self.count_vectorizer.inverse_transform(course_vector)))

    def print_similiarity_scores(self, courses, query):
        """Prints all course similarity scores given a query (for debugging)."""
        query_vector = self.vectorize_query(query.lower())
        for course in sorted(courses, key=lambda course: -self.get_score(course, query, query_vector))[:10]:
            print((course.name + ":" + str(self.get_score(course, query, query_vector)) + "\n"))
