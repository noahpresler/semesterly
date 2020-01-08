from django.contrib import admin
from timetable.models import Course, Semester, Section, CourseIntegration
from student.models import PilotOffering, Student

# Register your models here.
admin.site.register(CourseIntegration)
admin.site.register(Course)
admin.site.register(Student)
admin.site.register(Section)
admin.site.register(Semester)
admin.site.register(PilotOffering)
