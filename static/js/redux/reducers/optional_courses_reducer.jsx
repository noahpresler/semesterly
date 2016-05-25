import update from 'react/lib/update';

export const optionalCourses = (state = { courses: [], numRequired: 0}, action) => {
	switch(action.type) {
		case 'ADD_REMOVE_OPTIONAL_COURSE':
			let idx = state.courses.findIndex(c => c.id === action.newCourse.id)
			if ( idx != -1) {
				let newCourses = [
					...state.courses.slice(0,idx),
					...state.courses.slice(idx + 1)
				]
				return Object.assign({}, state, {courses: newCourses, numRequired: newCourses.length});
			} else {
				let newState = update(state, {
					courses: {
						$push: [action.newCourse]
					}
				});
				return Object.assign({}, newState, { numRequired: newState.courses.length });
			}
		case 'REMOVE_OPTIONAL_COURSE_BY_ID':
			let index = state.courses.findIndex(c => c.id === action.courseId)
			if ( index != -1) {
				let newCourses = [
					...state.courses.slice(0,index),
					...state.courses.slice(index + 1)
				]
				return Object.assign({}, state, {courses: newCourses, numRequired: newCourses.length});
			}
			return state;
		default:
			return state;
	}
}
