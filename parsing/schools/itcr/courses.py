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



import json


from parsing.library.base_parser import BaseParser
from parsing.library.utils import dict_filter_by_dict


import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Parser(BaseParser):
    """TEC course parser.

    Attributes:
        API_URL (str): Description
        DAY_MAP (TYPE): Description
        KEY (str): Description
        last_course (dict): Description
        schools (list): Description
        semester (TYPE): Description
        verbosity (TYPE): Description
    """

    API_URL = 'https://tec-appsext.itcr.ac.cr/guiahorarios/escuela.aspx/'
    DAY_MAP = {
        'LUNES': 'M',
        'MARTES': 'T',
        'MIERCOLES': 'W',
        'JUEVES': 'R',
        'VIERNES': 'F',
        'SABADO': 'S',
        'DOMINGO': 'U'
    }

    def __new__(cls, *args, **kwargs):
        """Set static variables within closure.

        Returns:
            Parser
        """
        new_instance = object.__new__(cls)
        return new_instance

    def __init__(self, **kwargs):
        """Construct hopkins parser object."""
        self.schools = []
        self.last_course = {}
        super(Parser, self).__init__('itcr', **kwargs)

    def _get_schools(self):
        headers = {
            'Content-Type': 'application/json'
        }
        request = self.requester.post(Parser.API_URL + 'cargaEscuelas', data="{}", headers=headers, verify=False)
        self.schools = json.loads(request['d'])

    def _get_courses(self, school):
        headers = {
            'Content-Type': 'application/json'
        }
        payload = json.dumps({'escuela': school['IDE_DEPTO'], 'ano': self.year})
        request = self.requester.post(Parser.API_URL + 'getdatosEscuelaAno', data=payload, headers=headers, verify=False)
        try:
            data = json.loads(request['d'])
            return data
        except:
            return []


    def _parse_schools(self):
        for school in self.schools:
            self._parse_school(school)

    def _parse_school(self, school):
        courses = self._get_courses(school)
        courses = [course for course in courses if (course['IDE_MODALIDAD'] == "S" and course["IDE_PER_MOD"] == int(self.term))]
        sections = self._parse_sections(courses)
        for courseCode in sections:
            course = sections[courseCode]
            self._load_ingestor(course[0], course)

    def _parse_sections(self, courses):
        res = {}
        for course in courses:
            section_code = course['IDE_MATERIA'] + str(course['IDE_GRUPO'])
            if res.get(section_code, None) is None:
                res[section_code] = []
            res[section_code].append(course)

        return res

    def _load_ingestor(self, course, section):
        try:
            num_credits = float(course['CAN_CREDITOS'])
        except:
            num_credits = 0

        # Load core course fields
        #self.ingestor['level'] = course[]
        self.ingestor['name'] = course['DSC_MATERIA']
        self.ingestor['description'] = ''
        self.ingestor['code'] = course['IDE_MATERIA']
        self.ingestor['num_credits'] = num_credits
        self.ingestor['department_name'] = course['DSC_DEPTO']
        self.ingestor['campus'] = course['DSC_SEDE']
        
        created_course = self.ingestor.ingest_course()
            
        if self.last_course \
           and created_course['code'] == course['IDE_MATERIA'] \
           and created_course['name'] != course['DSC_MATERIA']:
            self.ingestor['section_name'] = course['IDE_MATERIA'] # TODO: Averiguar que es esto
        self.last_course = created_course

        for meeting in section:
            # Load core section fields
            self.ingestor['section'] = str(meeting["IDE_GRUPO"])
            self.ingestor['instrs'] = meeting["NOM_PROFESOR"]

            self.ingestor['type'] = meeting["TIPO_CURSO"]

            self.ingestor['size'] = 1
            self.ingestor['enrollment'] = 0
            self.ingestor['waitlist'] = 0

            created_section = self.ingestor.ingest_section(created_course)

            self.ingestor['time_start'] = meeting['HINICIO']
            self.ingestor['time_end'] = meeting['HFIN']
            self.ingestor['days'] = [Parser.DAY_MAP.get(meeting['NOM_DIA'], '')]
            self.ingestor['location'] = {
                        'building': meeting['DSC_SEDE'],
                        'room': ''
                    }
            self.ingestor.ingest_meeting(created_section)

    def start(self,
              verbosity=3,
              textbooks=False,
              departments_filter=None,
              years_and_terms_filter=None):
        """Start parse."""
        self.verbosity = verbosity

        # Default to hardcoded current year.
        years = {'2021', '2020'}
        terms = {'1', '2'}

        years_and_terms = dict_filter_by_dict(
            {year: [term for term in terms] for year in years},
            years_and_terms_filter
        )

        for year, terms in list(years_and_terms.items()):
            self.ingestor['year'] = year
            self.year = year
            for term in terms:
                self.ingestor['term'] = term
                self.term = term
                self._get_schools()
                self._parse_schools()
