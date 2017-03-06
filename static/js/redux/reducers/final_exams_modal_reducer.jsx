export const finalExamsModal = (state = { isVisible: false, isLoading: true, finalExams: null }, action) => {
	switch (action.type) {
		case 'HIDE_FINAL_EXAMS_MODAL':
			return Object.assign({}, state, {isVisible: false});
		case 'SHOW_FINAL_EXAMS_MODAL':
			return Object.assign({}, state, {isVisible: true});
		case 'FETCH_FINAL_EXAMS':
			return Object.assign({}, state, {isLoading: true, finalExams: null});
		case 'RECIEVE_FINAL_EXAMS':
			return Object.assign({}, state, {isLoading: false, finalExams: action.json});
		case 'CHANGE_ACTIVE_SAVED_TIMETABLE':
			return Object.assign({}, state, {finalExams: null});
		default:
			return state;
	}
}