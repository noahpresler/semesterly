#!/bin/bash
echo "Dumping data into json."
python manage.py dumpdata -e contenttypes --natural-foreign > semesterly_backup/backup.json
cd semesterly_backup
echo "Compressing to tar.gz."
tar -czvf backup.tar.gz backup.json
echo "Sending backup to staging."
scp backup.tar.gz staging@semesterly.info:/home/staging/prod_backup
