echo "Creating new Semester table..."
echo
python manage.py migrate timetable 0010_auto_20170224_1553
echo "Populating new Semester table..."
echo
python populate_semester_table.py
echo "Completing migrations..."
echo
python manage.py migrate
echo "Filling in new .semester fields..."
echo
python update_semester_field.py
