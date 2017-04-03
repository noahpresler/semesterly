import { getSchoolInfoEndpoint } from '../constants/constants.jsx';
import * as ActionTypes from '../constants/actionTypes.jsx'

export function fetchSchoolInfo() {
	return (dispatch) => {
		dispatch({ type: ActionTypes.REQUEST_SCHOOL_INFO });
		fetch(getSchoolInfoEndpoint())
	    .then(response => response.json())
	    .then(json => {
	    	dispatch({
	    		type: ActionTypes.RECEIVE_SCHOOL_INFO, 
	    		schoolInfo: json
	    	});
	    });
	}
}
