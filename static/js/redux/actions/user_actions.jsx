import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint } from '../constants.jsx';

export function getUserInfo(json) {
	return {
		type: "USER_INFO_RECEIVED",
		userImg: json.userImg,
		isLoggedIn: json.isLoggedIn,
		userFirstName: json.userFirstName
	};
}

export function requestUserInfo(id) {
  return {
    type: "REQUEST_USER_INFO",
  }
}

export function fetchUserInfo() {
	return (dispatch) => {

		dispatch(requestUserInfo());

		fetch(getUserInfoEndpoint())
		    .then(response => response.json()) // TODO(rohan): error-check the response
		    .then(json => {
		        dispatch(getUserInfo(json))
		    });
	}
}
