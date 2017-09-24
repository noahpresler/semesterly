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

from __future__ import absolute_import, division, print_function
import progressbar
import cPickle as pickle

from parsing.library.exceptions import PipelineError
from parsing.library.tracker import NullTracker
from sklearn.feature_extraction.text import TfidfTransformer
from timetable.models import Course
from nltk.stem.porter import *


class VectorizationError(PipelineError):
    """Vectorizer error class."""


class Vectorizer(object):
    """Vectorizer class creates a dictionary over courses and build course vectors using count vectorizer

        Attributes:
            school (str): School to digest.
        """

    def __init__(self, school):
        """Construct Digestor instance.

        Args:
            school (str): Description
        """

        # Setup configurations
        self.school = school
        self.TITLE_WEIGHT = 3
        self.stemmer = PorterStemmer()

    def vectorize(self):
        """Vectorize function transforms and saves entire course objects into course vectors using TF-IDF."""

        raw_word_counts = []
        bar = progressbar.ProgressBar(max_value=Course.objects.count())
        courses = Course.objects.filter(school=self.school) if self.school is not None else Course.objects.all()

        print("Stringifying all courses for vectorization...")
        for current_count, course in enumerate(courses.iterator()):
            raw_word_counts.append(self.course_to_str(course.name,
                                                      course.description,
                                                      course.areas,
                                                      self.TITLE_WEIGHT))
            bar.update(current_count)

        # convert course objects to count vectorizers.
        print("Transforming all courses into vectors...")
        with open('searches/dictionary.pickle', 'r') as handle:
            count_vectorizer = pickle.load(handle)
        processed_word_counts = count_vectorizer.transform(raw_word_counts)

        # normalize count vectorizer objects with TF_IDF.
        try:
            tfidf_tf = TfidfTransformer(use_idf=True).fit(processed_word_counts)
            course_vectors = tfidf_tf.transform(processed_word_counts)
        except ValueError as ve:
            print("Could not normalize courses for [%s] to TF_IDF: %s" %(self.school, ve))
            course_vectors = processed_word_counts

        # save course vectors to model.
        print("Saving all course vectors...")
        bar = progressbar.ProgressBar(max_value=Course.objects.count())
        for current_count, course in enumerate(courses.iterator()):
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


    def _update_progress(self, key, exists):
        if exists:
            self.tracker.stats = dict(kind=key, status='total')