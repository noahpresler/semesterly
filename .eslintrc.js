module.exports = {
	"env": {
		"browser": true,
		"node": true,
		"jasmine": true
	},
	"globals": {
	  "$": true,
		"_": true,
	  "allSemesters": true,
	  "sharedTimetable": true,
	  "sharedCourse": true,
	  "finalExamsSupportedSemesters": true,
	  "findFriends": true,
	  "enableNotifs": true,
	  "uses12HrTime": true,
	  "studentIntegrations": true,
	  "signup": true,
	  "userAcq": true,
	  "gcalCallback": true,
	  "exportCalendar": true,
	  "viewTextbooks": true,
	  "finalExams": true,
	  "school": true,
	  "currentSemester": true,
	  "currentUser": true,
		"reactAlertEvents": true,
		"jQuery": true,
	},
	rules: {
		"no-plusplus": 0,
    "jsx-a11y/no-static-element-interactions": 0
	},
	extends: "airbnb",
};