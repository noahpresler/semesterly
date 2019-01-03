#!/bin/bash

echo starting;
cd /code
/usr/bin/python manage.py ingest jhu;
/usr/bin/python manage.py digest jhu;
echo done;