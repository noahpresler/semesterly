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

from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import DocType, Text, Integer, Object, Binary, \
    MetaField, Index, Keyword, IntegerRange, Nested
from elasticsearch.helpers import bulk
from elasticsearch import Elasticsearch


connections.create_connection()

class GlobSearchDocument(DocType):
    """Elastic search document type for course.

    Attributes:
        code (elasticsearch_dsl.Text): Course code.
        description (elasticsearch_dsl.Text): Course description.
        name (elasticsearch_dsl.Text): Course name.
    """
    id = Integer()  # NOTE: id not a keyword
    code = Text()
    name = Text()
    school = Keyword()
    description = Text(fields={'raw': Keyword()})
    instructors = Text(multi=True)
    department = Text(fields={'raw': Keyword()})
    info = Binary()  # Text(index=False)
    semesters = Nested(properties={
        'id': Integer(),
        'days': Nested(properties={
            'name': Keyword(),
            'times': IntegerRange(multi=True)
        })
    })

    class Meta:
        index = 'search-index'


def init_index(name='search-index'):
    index = Index(name)
    index.settings(
        number_of_shards=1,
        number_of_replicas=2,
    )
    index.doc_type(GlobSearchDocument)
    index.create()


def bulk_indexing():
    init_index()
    from timetable.models import Course
    bulk(client=Elasticsearch(),
         actions=(b.indexing()
                  for b in Course.objects.all().iterator()))
