export const ui = (state = { searchHover : 0 }, action) => {
	switch (action.type) {
		case 'HOVER_SEARCH_RESULT':
			return Object.assign( {}, state, { searchHover : action.position } );
		default:
			return state;
	}
}