#!/bin/bash
echo "Dumping data into json."
python manage.py dumpdata --natural-foreign --exclude auth.permission --exclude contenttypes --indent 2 > semesterly_backup/backup.json
cd semesterly_backup
echo "Compressing to tar.gz."
rm backup.tar.gz
tar -czvf backup.tar.gz backup.json
echo "Sending backup to staging."
scp backup.tar.gz staging@semesterly.info:/home/staging/prod_backup
