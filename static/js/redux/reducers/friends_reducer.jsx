export const friends = (state = {peers: [], isFetching: false}, action) => {
	switch (action.type) {
		case ("FRIENDS_RECEIVED"):
			return Object.assign({}, state, { peers: action.peers, isFetching: false });
		case ("REQUEST_FRIENDS"):
			return Object.assign({}, state, { isFetching: true });
		default:
			return state;
	}
}
