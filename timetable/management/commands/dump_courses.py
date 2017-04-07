"""Define command to selectively dump objects from a table

This module filters an input table and serializes the specified number of objects from the table, along with any 
objects that have a Foreign Key into that table (found recursively), and any objects pointed to by a Foreign Key from 
that table.

An example usage is to dump a small number of Courses into a fixture for testing timetable generation. In this case
we not only want Section (which has a Foreign Key into Course), and Offering (which has a Foreign Key into Section)
data, but also Semester (which Section has a Foreign Key into) data corresponding to the selected Course objects. For
example, the following command creates a fixture with 10 fall 2016 uoft courses and all of its related data:
    python manage.py dump_courses --query '{"section__semester__name": "Fall", "section__semester__year": "2016", \
    "school": "uoft"}' timetable.course 10 >! timetable/fixtures/uoft_fall_sample.json
        
This module is adapted from the django-fixture-magic module to support Django 1.9 and recursive "kitchensink" behaviour
"""


from __future__ import print_function

import json

from django.core.exceptions import FieldError, ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError
from django.core.serializers import serialize
from django.db import models

try:
    from django.db.models import loading
except ImportError:
    from django.apps import apps as loading


serialize_me = []
seen = {}


def add_to_serialize_list(objs):
    for obj in objs:
        if obj is None:
            continue
        if not hasattr(obj, '_meta'):
            add_to_serialize_list(obj)
            continue

        # Proxy models don't serialize well in Django.
        if obj._meta.proxy:
            obj = obj._meta.proxy_for_model.objects.get(pk=obj.pk)
        model_name = get_model_name(obj)
        key = "%s:%s:%s" % (obj._meta.app_label, model_name, obj.pk)

        if key not in seen:
            serialize_me.append(obj)
            seen[key] = 1


def get_model_name(obj):
    return getattr(obj._meta, 'model_name',
                   getattr(obj._meta, 'module_name', None))


def get_all_related_objects(model):
    try:
        return model._meta.get_all_related_objects()
    except AttributeError:
        return [
            f for f in model._meta.get_fields() if
            (f.one_to_many or f.one_to_one) and
            f.auto_created and not f.concrete
        ]


def serialize_fully():
    index = 0

    while index < len(serialize_me):
        for field in get_fields(serialize_me[index]):
            if isinstance(field, models.ForeignKey):
                add_to_serialize_list(
                    [serialize_me[index].__getattribute__(field.name)])

        index += 1

    serialize_me.reverse()


def get_fields(obj):
    try:
        return obj._meta.fields
    except AttributeError:
        return []


class Command(BaseCommand):
    help = ('Dump specific objects from the database into JSON that you can '
            'use in a fixture.')

    def add_arguments(self, parser):
        """Add command line arguments to parser"""

        # Required args
        parser.add_argument(dest='model',
                            help='Name of the model, with app name first. Eg "app_name.model_name"')
        parser.add_argument(dest='count', default=20,
                            help='Number of objects to dump from the model')

        # Optional args
        parser.add_argument('--no-follow',
                            action='store_false', dest='follow_fk',
                            default=True,
                            help='does not serialize Foreign Keys of the object')
        parser.add_argument('--no-follow-reverse',
                            action='store_false', dest='reverse_follow_fk',
                            default=True,
                            help='does not serialize other objects with Foreign Keys pointing to object')
        parser.add_argument('--query',
                            dest='query', default='{}',
                            help='Use a json query to filter objects first')

    def handle(self, *args, **options):
        error_text = ('%s\nTry calling dump_object with --help argument or ' +
                      'use the following arguments:\n %s' % self.args)
        try:
            # verify input is valid
            try:
                (app_label, model_name) = options['model'].split('.')
            except AttributeError:
                raise CommandError("Specify model as `appname.modelname")
            count = int(options['count'])
        except ValueError:
            raise CommandError(
                error_text %
                "object_class must be provided in the following format: app_name.model_name"
            )

        query = options['query']
        dump_me = loading.get_model(app_label, model_name)

        if options.get('reverse_follow_fk', True):
            # get first [count] objects
            current_level = dump_me.objects.filter(**json.loads(query))[:count]
            # keep adding objects while there are still related objects to be added
            while current_level:
                add_to_serialize_list(current_level)

                next_level = []
                for obj in current_level:
                    fields = get_all_related_objects(type(obj))
                    related_fields = [rel.get_accessor_name() for rel in fields]
                    for rel in related_fields:
                        try:
                            if hasattr(getattr(obj, rel), 'all'):
                                next_level += getattr(obj, rel).all()
                            else:
                                next_level += [getattr(obj, rel)]
                        except FieldError:
                            pass
                        except ObjectDoesNotExist:
                            pass

                current_level = next_level

            if options.get('follow_fk', True):
                serialize_fully()
            else:
                # reverse list to match output of serializez_fully
                serialize_me.reverse()

        self.stdout.write(serialize(options.get('format', 'json'), [o for o in serialize_me if o is not None],
                                    indent=4,
                                    use_natural_foreign_keys=options.get('natural', False),
                                    use_natural_primary_keys=options.get('natural', False)))

        # Clear the list. Useful for when calling multiple dump_object commands with a single execution of django
        del serialize_me[:]
        seen.clear()
