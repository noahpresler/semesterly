from timetable.models import Course, Section
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from elasticsearch_dsl import Search
from elasticsearch.exceptions import NotFoundError


@receiver(pre_delete, sender=Course)
def index_delete(sender, instance, **kwargs):
    print(instance.school, instance.code)
    s = Search(index=instance.school + '-glob-search-index').query('match', code=instance.code)

    try:
        s.delete()
    except NotFoundError:
        pass


@receiver(post_save, sender=Course)
def index_save(sender, instance, **kwargs):
    # Delete old documents from index.
    index_delete(sender, instance)

    # Index updated/new document.
    instance.indexing()


@receiver(post_save, sender=Section)
def index_save_2(sender, instance, **kwargs):
    index_save(Course, instance.course)
