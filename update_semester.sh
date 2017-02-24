mkdir temp_migrations
mv ./analytics/migrations/0012_auto_20170224_1510.py ./temp_migrations
mv ./student/migrations/0017_auto_20170224_1510.py ./temp_migrations

python manage.py migrate timetable 0010_auto_20170224_1553
python populate_semester_table.py

mv ./temp_migrations/0012_auto_20170224_1510.py ./analytics/migrations
mv ./temp_migrations/0017_auto_20170224_1510.py ./student/migrations

python manage.py migrate
python update_semester_field.py
