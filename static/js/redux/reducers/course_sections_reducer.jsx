import { saveLocalCourseSections, saveLocalActiveIndex } from '../util.jsx';
// we need "active" (the active timetable's index) to properly save timetables.
// so, the courseSections variable we care about is instead found in
// state.objects
export const courseSections = (state = { objects: {}}, action) => {
	switch(action.type) {
		case 'RECEIVE_COURSE_SECTIONS':
			saveLocalCourseSections(action.courseSections);
			saveLocalActiveIndex(0);
			return Object.assign({}, state, { objects: action.courseSections });
		default:
			return state;
	}
}
