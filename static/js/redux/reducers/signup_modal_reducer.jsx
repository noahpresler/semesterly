import * as ActionTypes from '../constants/actionTypes.jsx'

export const signupModal = (state = { isVisible: false }, action) => {
	switch (action.type) {
		case ActionTypes.TOGGLE_SIGNUP_MODAL:
			return {isVisible: !state.isVisible};
		case ActionTypes.TRIGGER_SIGNUP_MODAL:
			return {isVisible: true};
		default:
			return state;
	}
}
