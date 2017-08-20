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

import os
import simplejson as json

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    """Make a school within the Semesterly system.

    Scaffolds a directory for a new school, adds to active schools

    Attributes:
        template (str): Formatted filename of templates.
        help (str): Command help message.
    """

    help = "Scaffolds a directory for a new school, adds to active schools"

    template = '{}/{}/management/{{}}_template.txt'.format(
        os.getcwd(),
        settings.PARSING_MODULE
    )

    def add_arguments(self, parser):
        """Add arguments to command."""
        parser.add_argument(
            '--name',
            type=str,
            help='the school name',
            required=True
        )
        parser.add_argument(
            '--code',
            type=str,
            required=True,
            help='the schools shortened name, will be the subdomain (e.g. jhu)'
        )
        parser.add_argument(
            '--regex',
            type=str,
            default=r'(.)*',
            help='for detecting/validating course code; default: %(default)s'
        )
        parser.add_argument(
            '--ampm',
            type=bool,
            default=True,
            help='school use 12 instead of 24hr time; default: %(default)s'
        )
        parser.add_argument(
            '--full-academic-year-registration',
            type=bool,
            default=False,
            help='registration time period; default: %(default)s'
        )
        parser.add_argument(
            '--single-access',
            type=bool,
            default=False,
            help='access cannot be parallelized; default: %(default)s'
        )
        parser.add_argument(
            '--granularity',
            type=int,
            default=5,
            help='minimum time between section offerings; default: %(default)s'
        )

    def handle(self, *args, **options):
        """Handle the command."""
        name = options['name']
        code = options['code'].lower()
        replacements = (
            ('CODE', code),
            ('NAME', name),
            ('REGEX', options['regex']),
            ('AMPM', options['ampm']),
            ('GRANULARITY', options['granularity']),
            ('SINGLE_ACCESS', options['single_access']),
            ('FULL_ACADEMIC_YEAR_REGISTRATION',
                options['full_academic_year_registration']),
        )

        school_dir_path = '{}/{}/schools/{}'.format(os.getcwd(),
                                                    settings.PARSING_MODULE,
                                                    code)

        if os.path.exists(school_dir_path):
            raise CommandError("This school already exists.")

        parser_path = '{}/courses.py'.format(school_dir_path, code)
        config_path = '{}/config.json'.format(school_dir_path)
        logs_path = '{}/logs'.format(school_dir_path)
        data_path = '{}/data'.format(school_dir_path)
        init_path = '{}/__init__.py'.format(school_dir_path)
        active_schools_path = '{}/active'.format(school_dir_path)

        with open(active_schools_path, 'r') as file:
            active_schools = set(file.read().splitlines())
        active_schools.add(code)

        with open('LICENSE_HEADER', 'r') as file:
            license = file.read()

        with open(Command.template.format('parser'), 'rb') as file:
            parser = file.read().format(name=name,
                                        code=code,
                                        parser_type='course'.title())

        with open(Command.template.format('config'), 'rb') as file:
            config = file.read()
            for tag, replacement in replacements:
                config = config.replace('<{}>'.format(tag),
                                        json.dumps(replacement))

        with open(Command.template.format('init'), 'r') as file:
            init = file.read()

        os.makedirs(school_dir_path)
        os.makedirs(logs_path)
        os.makedirs(data_path)
        open(logs_path + '/.gitkeep', 'a').close()
        open(data_path + '/.gitkeep', 'a').close()

        with open(parser_path, "w") as file:
            file.write('# '.join(license.splitlines()))
            file.write('\n')
            file.write(parser)
        with open(config_path, "w") as file:
            file.write(config)
        with open(active_schools_path, 'w') as file:
            file.write('\n'.join(sorted(active_schools)))
        with open(init_path, 'w') as file:
            file.write('# '.join(license.splitlines()))
            file.write('\n')
            file.write(init)

        self.stdout.write(self.style.SUCCESS(
            "Finished! Directory instantiated {}".format(school_dir_path)
        ))
