export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers"];
export const VALID_SEMESTERS = ["F", "S"];
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";

/* server endpoints */
export const getCoursesEndpoint = (school, semester) => {
	return "courses/" + school + "/" + semester;
};
export const getCourseInfoEndpoint = (school, course_id) => {
	return "courses/"+ school + "/id/" + course_id;
};
export const getTimetablesEndpoint = () => {
	return "/";
};
