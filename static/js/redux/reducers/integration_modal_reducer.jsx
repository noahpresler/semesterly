export const integrationModal = (state = { isVisible: false, id: null, enabled: false, integration_id: null }, action) => {
	switch (action.type) {
		case 'TOGGLE_INTEGRATION_MODAL':
			return Object.assign({}, state, { isVisible: !state.isVisible, id: action.id });
		case 'OPEN_INTEGRATION_MODAL':
			return Object.assign({}, state, { enabled: action.enabled, isVisible: true, id: action.id, integration_id: action.integration_id });
		default:
			return state;
	}
}
