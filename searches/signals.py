from timetable.models import Course, Section, Offering
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError
from elasticsearch.exceptions import NotFoundError
from elasticsearch.exceptions import NotFoundError

from searches.elastic import init_index

es = Elasticsearch()


@receiver(pre_delete, sender=Course)
def index_delete(sender, instance, **kwargs):
    print('DELETING')
#     print(instance.school, instance.code)
#     s = Search(index=instance.school + '-glob-search-index').query('match', code=instance.code)

#     try:
#         pass
#         # s.delete()
#     except NotFoundError:
#         pass


@receiver(post_save, sender=Course)
def index_save(sender, instance, **kwargs):
    document = instance.indexing(save=False)
    es.update(index=document['_index'],
              doc_type='glob_search_document',
              id=instance.id,
              body=dict(doc=document['_source'],
                        doc_as_upsert=True))


@receiver(post_save, sender=Section)
def index_save_section(sender, instance, **kwargs):
    index_save(Course, instance.course)


@receiver(post_save, sender=Offering)
def index_save_meeting(sender, instance, **kwargs):
    index_save_section(Section, instance.section)
