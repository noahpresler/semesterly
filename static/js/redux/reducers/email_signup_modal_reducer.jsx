export const emailSignupModal = (state = { isVisible: false}, action) => {
	switch (action.type) {
		case 'TOGGLE_EMAIL_SIGNUP_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_EMAIL_SIGNUP_MODAL':
			return {isVisible: true};
		default:
			return state;
	}
}