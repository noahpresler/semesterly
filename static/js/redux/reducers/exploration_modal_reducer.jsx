export const explorationModal = (state = { isVisible: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_EXPLORATION_MODAL':
			return {isVisible: !state.isVisible}
		default:
			return state;
	}
}