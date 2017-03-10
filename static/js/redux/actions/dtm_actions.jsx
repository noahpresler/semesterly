import fetch from 'isomorphic-fetch';
import { store } from '../init.jsx';
import { getAvailabilityEndpoint, getMergedAvailabilityEndpoint, getCreateAvailabilityShareEndpoint, getUpdateCalPreferencesEndpoint, getFindMutuallyFreeEndpoint } from '../constants.jsx';

export function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function fetchAvailability(weekOffset) {
	return (dispatch) => {
		let state = store.getState();
		let ids = state.dtmCalendars.calendars.map(c => c.id);
		fetch(getAvailabilityEndpoint(), {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify({
				cal_ids: ids,
				week_offset: (weekOffset) ? weekOffset : 0
			}),
			credentials: 'same-origin',
		})
		.then(response => response.json())
		.then(json => {
			dispatch({
				type: "RECEIVE_AVAILABILITY",
				availability: json
			})
		}).then(() => {
				if (state.dtmCalendars.sharedAvailability) {
					dispatch(fetchMutuallyFree());
				}
			}
		)
	}
}

export function fetchMutuallyFree() {
	return (dispatch) => {
		let state = store.getState();
		let ids = state.dtmCalendars.calendars.filter(c => c.visible).map(c => c.id);
		let myAvailability = JSON.parse(JSON.stringify(state.dtmCalendars.availability))
		for (var key in myAvailability['calendars']) {
		  if (myAvailability['calendars'].hasOwnProperty(key)) {
		  	if (ids.indexOf(key) < 0) {
		  		delete myAvailability['calendars'][key];
		  	}
		  }
		}
		fetch(getFindMutuallyFreeEndpoint(), {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify({
				A: myAvailability,
				B: state.dtmCalendars.sharedAvailability
			}),
			credentials: 'same-origin',
		})
	}
}


function receiveDtmShareLink(dispatch, shareLink) {
	dispatch({
		type: "RECEIVE_SHARE_AVAILABILITY_LINK",
		shareLink,
	});
}

export function fetchShareAvailabilityLink(weekOffset) {
	return (dispatch) => {
		let state = store.getState();
		let ids = state.dtmCalendars.calendars.filter(c => c.visible).map(c => c.id);
		dispatch({
			type: "REQUEST_SHARE_AVAILABILITY_LINK"
		});
		fetch(getCreateAvailabilityShareEndpoint(), {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify({
				cal_ids: ids,
				week_offset: (weekOffset) ? weekOffset : 0
			}),
			credentials: 'same-origin',
		})
		.then(response => response.json())
		.then(ref => {
			receiveDtmShareLink(store.dispatch, window.location.href.split("/")[2] + "/dtm/share/" + ref.link);
			dispatch({
				type: "CLEAN_AVAILABILITY"
			});
			dispatch({
		        type: "RECEIVE_MERGED_AVAILABILITY",
		        mergedAvailability: ref.merged_availability
		    });
		})
	}
}	

export function getCalendarColorFromId(cid) {
	return (dispatch) => {
		let state = store.getState();
		let cal = state.dtmCalendars.calendars.find(c => c.id == cid);
		return cal.color;
	}
}

export function updateCalendarPreferences() {
	return (dispatch) => {
		let state = store.getState().dtmCalendars.calendars;
		let json = state.reduce((json,cal) => {
			json[cal.id] = cal.visible;
			return json;
		}, {})
		fetch(getUpdateCalPreferencesEndpoint(), {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			},
			body: JSON.stringify(json),
			credentials: 'same-origin',
		})
	}
}