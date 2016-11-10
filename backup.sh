#!/bin/bash
echo "Dumping data into json."
python manage.py dumpdata > semesterly_backup/backup.json
echo "Pushing data onto git."
cd semesterly_backup
ssh -T git@github.com
git add .
git commit -m "$dt"
git push