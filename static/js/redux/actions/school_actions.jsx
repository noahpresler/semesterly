import { getSchoolInfoEndpoint } from '../constants.jsx';

export function fetchSchoolInfo() {
	return (dispatch) => {
		dispatch({ type: "REQUEST_SCHOOL_INFO" });
		fetch(getSchoolInfoEndpoint())
	    .then(response => response.json())
	    .then(json => {
	    	dispatch({
	    		type: "RECEIVE_SCHOOL_INFO", 
	    		schoolInfo: json
	    	});
	    });
	}
}
