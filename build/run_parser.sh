#!/bin/bash

echo starting;
cd /code
# TODO: No params does not honor active-only semesters, this is hardcoded for now
python3 manage.py ingest jhu --term Spring --years 2022;
python3 manage.py digest jhu;

#/usr/bin/python manage.py ingest jhu --term Spring --years 2020;
#/usr/bin/python manage.py digest jhu;

#/usr/bin/python manage.py ingest jhu --term Fall --years 2019;
#/usr/bin/python manage.py digest jhu;
#
#/usr/bin/python manage.py ingest jhu --term Spring --years 2019;
#/usr/bin/python manage.py digest jhu;


# Run all
#/usr/bin/python manage.py ingest jhu
#/usr/bin/python manage.py digest jhu

echo done;
