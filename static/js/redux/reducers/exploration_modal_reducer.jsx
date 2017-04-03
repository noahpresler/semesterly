import update from 'react/lib/update';
import * as ActionTypes from '../constants/actionTypes.jsx'


export const explorationModal = (state = { 
	isVisible: false, 
	advancedSearchResults: [], 
	isFetching: false, 
	active: 0, 
	schoolInfoLoaded: false ,
	page: 1
}, action) => {
	switch (action.type) {
		case ActionTypes.SHOW_EXPLORATION_MODAL:
			return Object.assign({}, state, { isVisible: true });
		case ActionTypes.HIDE_EXPLORATION_MODAL:
			return Object.assign({}, state, { isVisible: false });
		case ActionTypes.REQUEST_ADVANCED_SEARCH_RESULTS:
			return Object.assign({}, state, { isFetching: true });
		case ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS:
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
		case ActionTypes.SET_ACTIVE_RESULT:
			return Object.assign({}, state, { active: action.active });
		case ActionTypes.SET_COURSE_REACTIONS:
			if (state.isVisible) {
				let advancedSearchResults = [...state.advancedSearchResults];
				advancedSearchResults[state.active]['reactions'] = action.reactions;
				return Object.assign({}, state, { advancedSearchResults });
			}
			return state;
		case ActionTypes.REQUEST_SCHOOL_INFO:
			return Object.assign({}, state, { schoolInfoLoaded: true });
		case ActionTypes.RECEIVE_SCHOOL_INFO:
			return Object.assign({}, state, { schoolInfoLoaded: false });
		case ActionTypes.PAGINATE_ADVANCED_SEARCH_RESULTS:
			return Object.assign({}, state, { page: state.page + 1 });
		case ActionTypes.CLEAR_ADVANCED_SEARCH_PAGINATION:
			return Object.assign({}, state, { page: 1});
		default:
			return state;
	}
}
