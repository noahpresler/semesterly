export const userInfo = (state = {isLoggedIn: false, userImg: null, userFirstName: null, isFetching: false}, action) => {
	switch (action.type) {
		case ("USER_INFO_RECEIVED"):
			return {
				isFetching: false,
				userImg: action.userImg,
				isLoggedIn: action.isLoggedIn,
				userFirstName: action.userFirstName,
			};
		case ("REQUEST_USER_INFO"):
			Object.assign({}, state, {isFetching: true});
		default:
			return state;
	}
}
