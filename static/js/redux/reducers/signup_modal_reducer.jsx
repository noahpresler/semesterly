export const signupModal = (state = { isVisible: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_SIGNUP_MODAL':
			return {isVisible: !state.isVisible}
		default:
			return state;
	}
}