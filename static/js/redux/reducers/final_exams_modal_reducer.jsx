export const finalExamsModal = (state = { isVisible: false, isDownloading: false, isLoading: false, finalExams: null }, action) => {
	switch (action.type) {
		case 'TOGGLE_FINAL_EXAMS_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_FINAL_EXAMS_MODAL':
			return {isVisible: true, isDownloading: false};
		case 'FETCH_FINAL_EXAMS':
			return {isLoading: true}
		case 'RECIEVE_FINAL_EXAMS':
			return {isLoading: false, finalExams: action.json}
		case 'DOWNLOAD_CALENDAR':
			return Object.assign({}, state, {isDownloading: true});
		default:
			return state;
	}
}