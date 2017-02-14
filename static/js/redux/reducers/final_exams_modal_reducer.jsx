export const finalExamsModal = (state = { isVisible: false, isDownloading: false}, action) => {
	switch (action.type) {
		case 'TOGGLE_FINAL_EXAMS_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_FINAL_EXAMS_MODAL':
			return {isVisible: true, isDownloading: false};
		case 'DOWNLOAD_CALENDAR':
			return Object.assign({}, state, {isDownloading: true});
		default:
			return state;
	}
}

