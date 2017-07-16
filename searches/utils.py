from __future__ import division
import pickle
import numpy as np
import operator
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from django.db.models import Q
from timetable.models import Course
from nltk.stem.porter import *
import progressbar


def baseline_search(school, query, semester):
    """Baseline search is a legacy search method that does not depend on Searcher object"""
    if query == "":
        return Course.objects.filter(school=school)
    query_tokens = query.strip().lower().split()
    course_name_contains_query = reduce(
        operator.and_, map(course_name_contains_token, query_tokens))
    return Course.objects.filter(
        Q(school=school) &
        course_name_contains_query &
        Q(section__semester=semester)
    )

def course_desc_contains_token(token):
    return Q(description__icontains=token)

def course_name_contains_token(token):
    return (Q(code__icontains=token) |
            Q(name__icontains=token.replace("&", "and")) |
            Q(name__icontains=token.replace("and", "&")))


class Vectorizer():
    """ Vectorizer class creates a dictionary over courses and build course vectorizer pickle object. """
    def __init__(self):
        self.TITLE_WEIGHT = 3
        self.stemmer = PorterStemmer()

    def vectorize(self):
        # get names (titles) and descriptions for creating vocabulary.
        raw_word_counts = []
        bar = progressbar.ProgressBar(max_value=Course.objects.count())
        print("Vectorizing all courses...")
        for current_count, course in enumerate(Course.objects.all().iterator()):
            raw_word_counts.append(self.get_stem_course(course.name,
                                                        course.description,
                                                        course.areas,
                                                        self.TITLE_WEIGHT))
            bar.update(current_count)

        # vectorize course objects.
        count_vectorizer = CountVectorizer(ngram_range=(1, 2), stop_words='english')
        processed_word_counts = count_vectorizer.fit_transform(raw_word_counts)
        tfidf_tf = TfidfTransformer(use_idf=True).fit(processed_word_counts)
        course_vectors = tfidf_tf.transform(processed_word_counts)

        bar.update(0)
        print("Picklifying all courses...")

        # save course vector to model.
        for current_count, course in enumerate(Course.objects.all().iterator()):
            self.picklify(course, course_vectors[current_count])
            bar.update(current_count)

        # export CountVectorizer.pickle.
        with open('count_vectorizer.pickle', 'wb') as handle:
            print("\nSaving count_vectorizer.pickle...")
            pickle.dump(count_vectorizer, handle,
                        protocol=pickle.HIGHEST_PROTOCOL)

    def get_stem_course(self, name, description, area, weight):
        stemmed_doc = ""
        if name:
            name_doc = name.encode('ascii', 'ignore')
            stemmed_name_doc = self.get_stem_doc(name_doc)
            stemmed_doc += (' ' + stemmed_name_doc) * weight + " "
        if description:
            desc_doc = description.encode('ascii', 'ignore')
            stemmed_doc += self.get_stem_doc(desc_doc)
        if area:
            area_doc = area.encode('ascii', 'ignore')
            stemmed_doc += self.get_stem_doc(area_doc)
        return stemmed_doc

    def get_stem_doc(self, doc):
        return ' '.join([self.stemmer.stem(w.lower()) for w in doc.split(' ')])

    def picklify(self, course_object, course_vector):
        course_object.vector = course_vector
        course_object.save()


class Searcher():
    """ Searcher class implements baseline search and vectorized search based on information retrieval techniques. """
    def __init__(self):
        self.vectorizer = Vectorizer()
        self.count_vectorizer = self.load_count_vectorizer()
        self.MAX_CAPACITY = 300
        self.start_time = 0

    def load_count_vectorizer(self):
        if os.path.exists('count_vectorizer.pickle'):
            with open('count_vectorizer.pickle', 'r') as handle:
                return pickle.load(handle)
        else:
            self.vectorizer.vectorize()
            with open('count_vectorizer.pickle', 'r') as handle:
                return pickle.load(handle)

    def vectorize_query(self, query):
        stemmed_qry = self.vectorizer.get_stem_doc(query)
        query_vector = self.count_vectorizer.transform([stemmed_qry])
        return query_vector

    def get_acronym(self, name):
        name = name.replace("and", "").replace("&", "").lower()
        return ''.join([i[0] for i in name.split(' ')])

    def matches_title(self, query, course_name):
        query_tokens = query.strip().lower().split(' ')
        course_name = course_name.lower()
        title_contains_query = all(map(lambda q: q in course_name, query_tokens))
        if title_contains_query and len(query_tokens) is len(course_name.split()):
            return 2
        elif title_contains_query:
            return 1
        else:
            return 0

    def get_course(self, code):
        try:
            return Course.objects.get(code=code)
        except:
            return None

    def get_cosine_sim(self, sparse_vec1, sparse_vec2):
        if sparse_vec1 is not None and sparse_vec2 is not None:
            return np.sum(sparse_vec1.multiply(sparse_vec2))
        else:
            return 0

    def get_similarity(self, query, course):
        query_vector = self.vectorize_query(query.lower())
        return self.get_cosine_sim(query_vector, course.vector)

    def vectorized_search(self, school, query, semester):
        if query == "":
            return Course.objects.filter(school=school)
        query_tokens = query.strip().lower().split()
        course_name_contains_query = reduce(operator.and_, map(course_name_contains_token, query_tokens))
        title_matching_courses = Course.objects.filter(
            Q(school=school) &
            course_name_contains_query &
            Q(section__semester=semester)
        )

        if title_matching_courses.count() < self.MAX_CAPACITY:
            descp_contains_query = reduce(operator.or_, map(course_desc_contains_token, query.replace("and", "").split()))
            descp_matching_courses = Course.objects.filter(Q(school=school) &
                                                           descp_contains_query &
                                                           Q(section__semester=semester))\
                .exclude(reduce(operator.and_, map(course_name_contains_token, query_tokens)))
            courses_objs = list(title_matching_courses.all().distinct('code')[:self.MAX_CAPACITY]) + \
                           list(descp_matching_courses.all().distinct('code')[:self.MAX_CAPACITY - title_matching_courses.count()])
        else:
            courses_objs = list(title_matching_courses.all().distinct('code')[:self.MAX_CAPACITY])

        return self.get_most_relevant_filtered_courses(query, courses_objs)

    def get_most_relevant_filtered_courses(self, query, course_filtered):
        query_vector = self.vectorize_query(query.lower())
        # for course in sorted(course_filtered, key=lambda course: -self.get_score(course, query, query_vector))[:10]:
        #     print(course.name + ":" + str(self.get_score(course, query, query_vector)) + "\n")
        return sorted(course_filtered, key=lambda course: -self.get_score(course, query, query_vector))

    def get_score(self, course, query, query_vector):
        return self.get_cosine_sim(query_vector, course.vector) + self.matches_title(query, course.name)

    def wordify(self, course_vector):
        print(self.count_vectorizer.inverse_transform(course_vector))