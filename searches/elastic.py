from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import DocType, Text, String, Integer, Object, MetaField
from elasticsearch.helpers import bulk
from elasticsearch import Elasticsearch


connections.create_connection()


class GlobSearchIndex(DocType):
    """Elastic search document type for course.

    Attributes:
        code (elasticsearch_dsl.Text): Course code.
        description (elasticsearch_dsl.Text): Course description.
        name (elasticsearch_dsl.Text): Course name.
    """
    code = Text()
    name = Text()
    semesters = Integer(multi=True)
    description = Text()
    instructors = Text(multi=True)
    department = Text()
    info = String(index='not_analyzed')

    # class Meta:
    #     dynamic_templates = MetaField([
    #         {
    #             "info": {
    #                 "path_match": "info.*",
    #                 "match_mapping_type": "*",
    #                 "mapping": String(index='not_analyzed')
    #             },
    #         }
    #     ])


def bulk_indexing():
    from timetable.models import Course
    # GlobSearchIndex.init()
    bulk(client=Elasticsearch(),
         actions=(b.indexing()
                  for b in Course.objects.all().iterator()))

    # index = Index(school + '-glob-search-index')
    # index.settings(
    #     number_of_shards=1,
    #     number_of_replicas=2,
    # )
    # index.doc_type(GlobSearchIndex)
    # index.create()
