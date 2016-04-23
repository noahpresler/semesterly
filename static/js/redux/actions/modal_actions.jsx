import fetch from 'isomorphic-fetch';
import { getCourseInfoEndpoint } from '../constants.jsx';

export function setCourseInfo(json) {
	return {
		type: "COURSE_INFO_RECEIVED",
		data: json,
	};
}

export function requestCourseInfo() {
  return {
    type: "REQUEST_COURSE_INFO",
  }
}

export function setCourseId(id) {
	return {
		type: "SET_COURSE_ID",
		data: id
	}
}

export function fetchCourseInfo(courseId) {
	return (dispatch) => {

		dispatch(requestCourseInfo());

		fetch(getCourseInfoEndpoint(courseId))
		    .then(response => response.json()) // TODO(rohan): error-check the response
		    .then(json => {
		        dispatch(setCourseInfo(json))
		    });
	}
}