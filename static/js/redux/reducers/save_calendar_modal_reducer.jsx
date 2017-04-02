import * as ActionTypes from '../constants/actionTypes.jsx'

export const saveCalendarModal = (state = { isVisible: false, hasDownloaded: false, hasUploaded: true, isDownloading: false, isUploading: true}, action) => {
	switch (action.type) {
		case ActionTypes.TOGGLE_SAVE_CALENDAR_MODAL:
			return {isVisible: !state.isVisible};
		case ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL:
			return {isVisible: true, hasUploaded: false, hasDownloaded: false, isDownloading: false, isUploading: false};
		case ActionTypes.DOWNLOAD_CALENDAR:
			return Object.assign({}, state, {isDownloading: true});
		case ActionTypes.UPLOAD_CALENDAR:
			return Object.assign({}, state, {isUploading: true});
		case ActionTypes.CALENDAR_DOWNLOADED:
			return Object.assign({}, state, {hasDownloaded: true});
		case ActionTypes.CALENDAR_UPLOADED:
			return Object.assign({}, state, {hasUploaded: true});
		default:
			return state;
	}
}
