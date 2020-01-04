from django.contrib import admin
from timetable.models import PilotOffering, Course, Semester, Section
from student.models import Student

# Register your models here.

admin.site.register(PilotOffering)
admin.site.register(Course)
admin.site.register(Section)
admin.site.register(Semester)
admin.site.register(Student)
