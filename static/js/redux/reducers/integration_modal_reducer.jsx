export const integrationModal = (state = { isVisible: false, id: null, enabled: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_INTEGRATION_MODAL':
			return Object.assign({}, state, { isVisible: !state.isVisible, id: action.id });
		case 'OPEN_INTEGRATION_MODAL':
			return Object.assign({}, state, { enabled: action.enabled, isVisible: true, id: action.id });
		default:
			return state;
	}
}
