import * as ActionTypes from '../constants/actionTypes.jsx'

export const peerModal = (state = { isVisible: false, isLoading: false }, action) => {
	switch (action.type) {
		case ActionTypes.TOGGLE_PEER_MODAL:
			return {isVisible: !state.isVisible};
		case ActionTypes.PEER_MODAL_LOADING:
			return {isLoading: true};
		case ActionTypes.PEER_MODAL_LOADED:
			return {isLoading: false};
		default:
			return state;
	}
}