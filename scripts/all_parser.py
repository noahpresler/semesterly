from uoft_parser import UofTParser
from hopkins_parser import HopkinsParser
from umd_parser import UMDParser
from timetable.models import Updates
from populator import *
import datetime, logging

logging.basicConfig(level=logging.ERROR, filename='parsing_errors.log')

for parser_class in [UMDParser, HopkinsParser, UofTParser]:
	parser = parser_class()
	school = parser.get_school_name()
	try:
		message = "Starting parser for %s.\n" % (school)
		print message
		logging.exception(message)
		parser.start()
		# populate the JSON files in timetables/courses_json
		start_JSON_populator(school, "F")
		start_JSON_populator(school, "S")

		# set the last_updated information for the school's courses
		update_object, created = Updates.objects.update_or_create(
			school=school,
			update_field="Course",
			defaults={'last_updated': datetime.datetime.now()}
		)

	except Exception as e:
		logging.exception("Error while parsing %s:\n\n%s\n" % (school, str(e)))

print "Finished!"
