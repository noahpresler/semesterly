import { getSchool, getSemester } from './init.jsx';
export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers", "queens"];
export const VALID_SEMESTERS = ["F", "S"];
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";
export const HALF_HOUR_HEIGHT = 25;
export const MAX_TIMETABLE_NAME_LENGTH = 30; // Length of "This is my fucking timetable!!"

/* server endpoints */
export const getCourseInfoEndpoint = (course_id) => {
	return "courses/" + getSchool() + "/" + getSemester() + "/id/" + course_id;
};
export const getCourseSearchEndpoint = (query) => {
	return "search/" + getSchool() + "/" + getSemester() + "/" + query;
};
export const getTimetablesEndpoint = () => {
	return "get_timetables/";
};
export const getUserInfoEndpoint = () => {
	return "user/info";
};
export const getSaveTimetableEndpoint = () => {
	return "user/save_timetable/";
};
export const getSaveSettingsEndpoint = () => {
	return "user/save_settings/"
}
export const getClassmatesEndpoint = () => {
	return "user/get_classmates/"
}

export const getPrimaryDisplay = (school) => {
	switch(school) {
		case "uoft":
			return "code";
		case "jhu":
			return "name";
		case "umd":
			return "name"
		default:
			return "code"
	}
}

export const getSemesterName = (semester) => {
	switch(semester) {
		case "F":
			return "Fall 2016";
		case "S":
			return "Spring 2017"
	}
}
export const COLOUR_DATA = [
    { background: "#FD7473", highlight: "#E26A6A", border: "#963838", font: "#222" },
    { background: "#5AC8FB", highlight: "#28A4EA", border: "#1B6B90", font: "#222" },
    { background: "#4CD4B0", highlight: "#3DBB9A", border: "#1E755E", font: "#222" },
    { background: "#8870FF", highlight: "#7059E6", border: "#382694", font: "#222" },
    { background: "#FFBF8D", highlight: "#F7954A", border: "#AF5E20", font: "#222" },
    { background: "#D4DBC8", highlight: "#B5BFA3", border: "#6C7A89", font: "#222" },
    { background: "#F182B4", highlight: "#DE699D", border: "#6C7A89", font: "#222" },
    { background: "#7499A2", highlight: "#668B94", border: "#6C7A89", font: "#222" },
    { background: "#E7F76D", highlight: "#C4D44D", border: "#6C7A89", font: "#222" },
    { background: "#C8F7C5", highlight: "#C4D44D", border: "#548A50", font: "#222" }
] // consider #CF000F, #e8fac3, #C8F7C5
