from django.core.management.base import BaseCommand, CommandError
import sys, os

class Command(BaseCommand):

    help = "Scaffolds a directory for a new school"

    def add_arguments(self, parser):
        parser.add_argument('--name', type=str, help='the school name', required=True)
        parser.add_argument('--code', type=str, required=True,
            help='the schools shortened name, will be the subdomain (e.g. jhu)')
        parser.add_argument('--regex', type=str, required=True,
            help='regex for detecting course codes')

    def success_print(self, message):
        self.stdout.write(self.style.SUCCESS(message))

    def handle(self, *args, **options):
        name = options['name']
        code = options['code']
        regex = options['regex']

        parser_template_path = os.getcwd() +  '/timetable/management/parser_template.txt'
        config_template_path = os.getcwd() +  '/timetable/management/config_template.txt'
        
        school_dir_path = '{}/scripts/{}'.format(os.getcwd(), code)
        parser_path = '{}/{}_courses.py'.format(school_dir_path, code)
        config_path = '{}/config.json'.format(school_dir_path)
        logs_path = '{}/logs'.format(school_dir_path)
        data_path = '{}/data'.format(school_dir_path)
        init_path = '{}/__init__.py'.format(school_dir_path)
        

        with open(parser_template_path, 'rb') as file:
            parser = file.read().format(code.upper(), code.upper(), code)
        with open(config_template_path, 'rb') as file:
            config = file.read()
            config = config.replace('<CODE>', code)
            config = config.replace('<NAME>', name)
            config = config.replace('<REGEX>', regex)

        if os.path.exists(school_dir_path):
            self.stdout.write(self.style.ERROR("This school already exists."))
            exit()

        os.makedirs(school_dir_path)
        os.makedirs(logs_path)
        os.makedirs(data_path)

        with open(parser_path, "w") as file:
            file.write(parser)
        with open(config_path, "w") as file:
            file.write(config)
        open(init_path, 'a').close()

        self.success_print(
            "Finished! Directory instantiated {}".format(school_dir_path)
        )