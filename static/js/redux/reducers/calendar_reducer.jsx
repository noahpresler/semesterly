import * as ActionTypes from '../constants/actionTypes.jsx'

export const calendar = (state = {shareLink: null, isFetchingShareLink: false, shareLinkValid: false}, action) => {
	switch (action.type) {
		case ActionTypes.REQUEST_SHARE_TIMETABLE_LINK:
			return Object.assign({}, state, { isFetchingShareLink: true });
		case ActionTypes.RECEIVE_SHARE_TIMETABLE_LINK:
			return Object.assign({}, state, { shareLink: action.shareLink, isFetchingShareLink: false, shareLinkValid: true });
		case ActionTypes.RECEIVE_TIMETABLES:
		case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
			return Object.assign({}, state, { shareLinkValid: false });
		default:
			return state;
	}
}
