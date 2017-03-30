export const courseInfo = (state = {isFetching: true, isFetchingClassmates: true, data: {}, id: null, classmates: {}}, action) => {
	switch (action.type) {
		case "COURSE_INFO_RECEIVED":
			return Object.assign({}, state, {
				isFetching: false,
				data: action.data,
				id: action.data.id
			});
		case "COURSE_CLASSMATES_RECEIVED":
			return Object.assign({}, state, {
				isFetchingClassmates: false,
				classmates: action.data
			})
		case "REQUEST_COURSE_INFO":
			return {
				isFetching: true,
				isFetchingClassmates: true,
				data: {},
				classmates: {},
				id: action.id
			};
		case "SET_COURSE_REACTIONS":
			if (state.id === null) {
				return state;
			}
			return Object.assign({}, state,
			{
				data: Object.assign({}, state.data, {
					reactions: action.reactions
				})
			});
		case "SET_COURSE_ID":
			return Object.assign({}, state, {id: action.id})
		default: 
			return state;
	}
}