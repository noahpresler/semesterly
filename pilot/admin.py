from django.contrib import admin
from timetable.models import Course, Semester, Section, CourseIntegration
from student.models import PilotOffering, Student

# Register your models here.
admin.site.register(CourseIntegration)
admin.site.register(Course)
admin.site.register(Student)
admin.site.register(Section)
admin.site.register(Semester)

class SectionsInline(admin.StackedInline):
	model = PilotOffering.sections.through
	readonly_fields = ('section', )
	verbose_name = "Included Section"
	verbose_name_plural = "Included Sections"
	extra = 0

class StudentsInline(admin.StackedInline):
	model = PilotOffering.students.through
	verbose_name = "Enrolled Student"
	verbose_name_plural = "Enrolled Students"
	inline_actions = ['delete_selected']
	extra = 0

class WaitlistStudentsInline(admin.StackedInline):
	model = PilotOffering.wait_students.through
	verbose_name = "Waitlisted Student"
	verbose_name_plural = "Waitlisted Students"
	inline_actions = ['delete_selected']
	extra = 1

class PilotOfferingAdmin(admin.ModelAdmin):
	inlines = [
		SectionsInline,
		StudentsInline,
		WaitlistStudentsInline,
	]
	# TODO: Define search_fields for SectionAdmin, StudentAdmin if necessary
    # See https://docs.djangoproject.com/en/2.0/ref/contrib/admin/#django.contrib.admin.ModelAdmin.autocomplete_fields
	# autocomplete_fields = ('sections', 'students', 'wait_students')
	exclude = ('sections', 'students', 'wait_students')
	list_display = ('id', 'course_name', 'day', 'time_start', 'time_end')

admin.site.register(PilotOffering, PilotOfferingAdmin)