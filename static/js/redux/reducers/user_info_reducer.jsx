export const userInfo = (state = {data: {isLoggedIn: false}, saving: false, isFetching: false}, action) => {
	switch (action.type) {
		case 'REQUEST_SAVE_USER_INFO':
			return Object.assign( {}, state, { saving: true });
		case 'CHANGE_USER_INFO':
			let changeData = action.data;
			changeData.social_courses = changeData.social_offerings ? true : changeData.social_courses;
			return Object.assign( {}, state, { data: changeData });
		case 'RECEIVE_USER_INFO_SAVED':
			return Object.assign( {}, state, { saving: false });
		case "USER_INFO_RECEIVED":
			return Object.assign({}, state, { data: action.data, isFetching: false });
		case "REQUEST_USER_INFO":
			return Object.assign({}, state, { isFetching: true });
		case "RECEIVE_SAVED_TIMETABLES":
			let newData = Object.assign({}, state.data, { timetables: action.timetables });
			return Object.assign({}, state, { data: newData });
		default:
			return state;
	}
}
