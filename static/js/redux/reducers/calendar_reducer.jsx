export const calendar = (state = {shareLink: null, isFetchingShareLink: false, shareLinkValid: false}, action) => {
	switch (action.type) {
		case "REQUEST_SHARE_TIMETABLE_LINK":
			return Object.assign({}, state, { isFetchingShareLink: true });
		case "RECEIVE_SHARE_TIMETABLE_LINK":
			return Object.assign({}, state, { shareLink: action.shareLink, isFetchingShareLink: false, shareLinkValid: true });
		case "RECEIVE_TIMETABLES":
		case "CHANGE_ACTIVE_TIMETABLE":
			return Object.assign({}, state, { shareLinkValid: false });

		default:
			return state;
	}
}
