export const textbookModal = (state = { isVisible: false}, action) => {
	switch (action.type) {
		case 'TOGGLE_TEXTBOOK_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_TEXTBOOK_MODAL':
			return {isVisible: true};
		default:
			return state;
	}
}