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

from timetable.models import Course, Section, Offering
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError
from elasticsearch.exceptions import NotFoundError
from elasticsearch.exceptions import NotFoundError

from searches.elastic import GlobSearchDocument


@receiver(pre_delete, sender=Course)
def index_delete(sender, instance, **kwargs):
    Elasticsearch().delete(index=GlobSearchDocument._doc_type.index,
                           doc_type='glob_search_document',
                           id=instance.id)


@receiver(post_save, sender=Course)
def index_update_or_create(sender, instance, **kwargs):
    document = instance.indexing(save=False)
    Elasticsearch().update(index=document['_index'],
                           doc_type='glob_search_document',
                           id=instance.id,
                           body=dict(doc=document['_source'],
                                     doc_as_upsert=True))


@receiver(post_save, sender=Section)
@receiver(pre_delete, sender=Section)
def index_update_or_create_section(sender, instance, **kwargs):
    index_update_or_create(Course, instance.course)


@receiver(post_save, sender=Offering)
@receiver(pre_delete, sender=Offering)
def index_update_or_create_offering(sender, instance, **kwargs):
    index_update_or_create_section(Section, instance.section)
