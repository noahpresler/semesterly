export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers"];
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";
export const SET_SEMESTER = "SET_SEMESTER";
/* server endpoints */
export const getCoursesEndpoint = (school, semester) => {
	return "courses/" + school + "/" + semester
};
/* server endpoints */
export const getTimetablesEndpoint = () => {
	return "/";
};
