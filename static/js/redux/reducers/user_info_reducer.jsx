export const userInfo = (state = {data: {isLoggedIn: false}, saving: false, isFetching: false}, action) => {
	switch (action.type) {
		case 'REQUEST_SAVE_USER_INFO':
			return Object.assign( {}, state, { saving: true });
		case 'CHANGE_USER_INFO':
			return Object.assign( {}, state, { data: action.data });
		case 'RECEIVE_USER_INFO_SAVED':
			return Object.assign( {}, state, { saving: false });
		case ("USER_INFO_RECEIVED"):
			return Object.assign({}, state, { data: action.data, isFetching: false });
		case ("REQUEST_USER_INFO"):
			return Object.assign({}, state, {isFetching: true});
		default:
			return state;
	}
}
