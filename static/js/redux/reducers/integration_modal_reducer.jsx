export const integrationModal = (state = { isVisible: false, id: null }, action) => {
	switch (action.type) {
		case 'TOGGLE_INTEGRATION_MODAL':
			console.log("id:" + action.id);
			return {
				isVisible: !state.isVisible,
				id: action.id
			};
		default:
			return state;
	}
}
