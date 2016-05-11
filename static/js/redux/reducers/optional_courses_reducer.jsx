import update from 'react/lib/update';

export const optionalCourses = (state = { ids: [], numRequired: 0}, action) => {
	switch(action.type) {

		case 'ADD_REMOVE_OPTIONAL_COURSE':
			let idx = state.ids.indexOf(action.newCourseId)
			if ( idx != -1) {
				let newIds = [
					...state.ids.slice(0,idx),
					...state.ids.slice(idx + 1)
				]
				return Object.assign({}, state, {ids: newIds, numRequired: newIds.length});
			} else {
				let newState = update(state, {
					ids: {
						$push: [action.newCourseId]
					}
				});
				return Object.assign({}, newState, { numRequired: newState.ids.length });
			}
		default:
			return state;
	}
}
