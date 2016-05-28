import { getRequestShareTimetableLinkEndpoint } from '../constants.jsx';
import { getActiveTimetable } from './user_actions.jsx';
import { store } from '../init.jsx';

function receiveShareLink(dispatch, shareLink) {
	dispatch({
		type: "RECEIVE_SHARE_TIMETABLE_LINK",
		shareLink,
	});
}

export function fetchShareTimetableLink() {
	return (dispatch) => {
		let state = store.getState();
		let semester = state.semester;
		let timetableState = state.timetables;
		let { shareLink, shareLinkValid } = state.calendar;
		dispatch({
			type: "REQUEST_SHARE_TIMETABLE_LINK"
		});
		if (shareLinkValid) { 
			receiveShareLink(store.dispatch, shareLink); 
			return;
		}
		fetch(getRequestShareTimetableLinkEndpoint(), {
			method: 'POST',
			body: JSON.stringify({
				timetable: getActiveTimetable(timetableState),
				semester,
			}),
			credentials: 'include',
		})
		.then(response => response.json())
		.then(ref => {
			receiveShareLink(store.dispatch, 
				window.location.hostname + "/share/" + ref.link);
		})

	}
}
