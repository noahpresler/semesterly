import fetch from 'isomorphic-fetch';
import { getCourseInfoEndpoint, getReactToCourseEndpoint, getClassmatesInCourseEndpoint } from '../constants/constants.jsx';
import { store } from '../init.jsx';
export function setCourseInfo(json) {
    return {
        type: "COURSE_INFO_RECEIVED",
        data: json,
    };
}

export function setCourseClassmates(json) {
    return {
        type: "COURSE_CLASSMATES_RECEIVED",
        data: json,
    };
}

export function requestCourseInfo(id) {
  return {
    type: "REQUEST_COURSE_INFO",
    id: id,
  }
}

export function setCourseId(id) {
    return {
        type: "SET_COURSE_ID",
        id: id
    }
}

export function fetchCourseInfo(courseId) {
    return (dispatch) => {
        dispatch(requestCourseInfo(courseId));
        fetch(getCourseInfoEndpoint(courseId), {
            'credentials': 'include'
        })
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then(json => {
            dispatch(setCourseInfo(json))
        });
        dispatch(fetchCourseClassmates(courseId));
    }
}

export function fetchCourseClassmates(courseId) {
    return (dispatch) => {
        fetch(getClassmatesInCourseEndpoint(courseId), {
            'credentials': 'include'
        })
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then(json => {
            dispatch(setCourseClassmates(json))
        });
    }
}

export function react(cid, title) {
    fetch(getReactToCourseEndpoint(), {
            method: 'POST',
            body: JSON.stringify({
                cid,
                title
            }),
            credentials: 'include',
        })
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then(json => {
            if (!json.error) {
                store.dispatch({
                    type: "SET_COURSE_REACTIONS",
                    reactions: json.reactions
                });
            }
    });
}
