from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import DocType, Text, String, Integer, Object, MetaField, Index, Keyword
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
    code = Text()
    name = Text()
    semesters = Integer(multi=True)
    school = Keyword()
    description = Text()
    instructors = Text(multi=True)
    department = Text()
    info = String(index='not_analyzed')

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


