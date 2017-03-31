import update from 'react/lib/update';

export const explorationModal = (state = { 
	isVisible: false, 
	advancedSearchResults: [], 
	isFetching: false, 
	active: 0, 
	schoolInfoLoaded: false ,
	page: 1
}, action) => {
	switch (action.type) {
		case 'SHOW_EXPLORATION_MODAL':
			return Object.assign({}, state, { isVisible: true });
		case 'HIDE_EXPLORATION_MODAL':
			return Object.assign({}, state, { isVisible: false });
		case 'REQUEST_ADVANCED_SEARCH_RESULTS':
			return Object.assign({}, state, { isFetching: true });
		case 'RECEIVE_ADVANCED_SEARCH_RESULTS':
			let { advancedSearchResults } = action;
			if (state.page > 1) {
				if(advancedSearchResults) {
					advancedSearchResults = [...state.advancedSearchResults].concat(advancedSearchResults);
					return Object.assign({}, state, { 
						advancedSearchResults,
						isFetching: false
					});
				} else {
					return Object.assign({}, state, {isFetching: false });
				}
			} else {
				return Object.assign({}, state, { advancedSearchResults, isFetching: false,
					active:0 });
			}
		case 'SET_ACTIVE_RESULT':
			return Object.assign({}, state, { active: action.active });
		case 'SET_COURSE_REACTIONS':
			if (state.isVisible) {
				let advancedSearchResults = [...state.advancedSearchResults];
				advancedSearchResults[state.active]['reactions'] = action.reactions;
				return Object.assign({}, state, { advancedSearchResults });
			}
			return state;
		case 'REQUEST_SCHOOL_INFO':
			return Object.assign({}, state, { schoolInfoLoaded: true });
		case 'RECEIVE_SCHOOL_INFO':
			return Object.assign({}, state, { schoolInfoLoaded: false });
		case 'PAGINATE_ADVANCED_SEARCH_RESULTS':
			return Object.assign({}, state, { page: state.page + 1 });
		case 'CLEAR_ADVANCED_SEARCH_PAGINATION':
			return Object.assign({}, state, { page: 1});
		default:
			return state;
	}
}
