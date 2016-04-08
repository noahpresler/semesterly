import { getSchool, getSemester } from './init.jsx';
export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers"];
export const VALID_SEMESTERS = ["F", "S"];
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";


/* server endpoints */
export const getCoursesEndpoint = () => {
	return "courses/" + getSchool() + "/" + getSemester();
};
export const getCourseInfoEndpoint = (course_id) => {
	return "courses/"+ getSchool() + "/id/" + course_id;
};
export const getCourseSearchEndpoint = (query) => {
	return "search/" + getSchool() + "/" + getSemester() + "/" + query;
};
export const getTimetablesEndpoint = () => {
	return "get_timetables/";
};
