export const dtmShare = (state = {shareLink: null, isFetchingShareLink: false, shareLinkValid: false}, action) => {
	switch (action.type) {
		case "REQUEST_SHARE_AVAILABILITY_LINK":
			return Object.assign({}, state, { isFetchingShareLink: true });
		case "RECEIVE_SHARE_AVAILABILITY_LINK":
			return Object.assign({}, state, { shareLink: action.shareLink, isFetchingShareLink: false, shareLinkValid: true });
		default:
			return state;
	}
}
