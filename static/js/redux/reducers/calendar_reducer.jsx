export const calendar = (state = {shareLink: null, isFetchingShareLink: false}, action) => {
	switch (action.type) {
		case ("REQUEST_SHARE_TIMETABLE_LINK"):
			return Object.assign({}, state, { isFetchingShareLink: true });
		case ("RECEIVE_SHARE_TIMETABLE_LINK"):
			return Object.assign({}, state, { shareLink: action.shareLink, isFetchingShareLink: false });
		default:
			return state;
	}
}
