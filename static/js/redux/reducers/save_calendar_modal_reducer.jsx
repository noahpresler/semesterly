export const saveCalendarModal = (state = { isVisible: false, hasDownloaded: false, hasUploaded: true, isDownloading: false, isUploading: true}, action) => {
	switch (action.type) {
		case 'TOGGLE_SAVE_CALENDAR_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_SAVE_CALENDAR_MODAL':
			return {isVisible: true, hasUploaded: false, hasDownloaded: false, isDownloading: false, isUploading: false};
		case 'DOWNLOAD_CALENDAR':
			return Object.assign({}, state, {isDownloading: true});
		case 'UPLOAD_CALENDAR':
			return Object.assign({}, state, {isUploading: true});
		case 'CALENDAR_DOWNLOADED':
			return Object.assign({}, state, {hasDownloaded: true});
		case 'CALENDAR_UPLOADED':
			return Object.assign({}, state, {hasUploaded: true});
		default:
			return state;
	}
}
