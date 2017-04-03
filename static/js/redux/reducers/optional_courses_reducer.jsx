import update from 'react/lib/update';
import * as ActionTypes from '../constants/actionTypes.jsx'

export const optionalCourses = (state = { courses: [], numRequired: 0}, action) => {
	switch(action.type) {
		case ActionTypes.ADD_REMOVE_OPTIONAL_COURSE:
			let idx = state.courses.findIndex(c => c.id === action.newCourse.id)
			if ( idx != -1) { // removing
				let newCourses = [
					...state.courses.slice(0,idx),
					...state.courses.slice(idx + 1)
				]
				return Object.assign({}, state, {courses: newCourses, numRequired: newCourses.length});
			} else { // adding
				let newState = update(state, {
					courses: {
						$push: [action.newCourse]
					}
				});
				return Object.assign({}, newState, { numRequired: newState.courses.length });
			}
		case ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID:
			let index = state.courses.findIndex(c => c.id === action.courseId)
			if ( index != -1) {
				let newCourses = [
					...state.courses.slice(0,index),
					...state.courses.slice(index + 1)
				]
				return Object.assign({}, state, {courses: newCourses, numRequired: newCourses.length});
			}
			return state;
		case ActionTypes.CLEAR_OPTIONAL_COURSES:
			return { courses: [], numRequired: 0 }
		default:
			return state;
	}
}
