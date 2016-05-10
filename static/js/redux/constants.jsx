import { getSchool, getSemester } from './init.jsx';
export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers"];
export const VALID_SEMESTERS = ["F", "S"];
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";
export const HALF_HOUR_HEIGHT = 25;

/* server endpoints */
export const getCourseInfoEndpoint = (course_id) => {
	return "courses/"+ getSchool() + "/id/" + course_id;
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
			return "Spring 2016"
	}
}
