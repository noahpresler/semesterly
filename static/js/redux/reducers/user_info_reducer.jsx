export const userInfo = (state = {data: {isLoggedIn: false}}, action) => {
	switch (action.type) {
		case ("USER_INFO_RECEIVED"):
			return {
				data: action.data
			};
		case ("REQUEST_USER_INFO"):
			Object.assign({}, state, {isFetching: true});
		default:
			return state;
	}
}
