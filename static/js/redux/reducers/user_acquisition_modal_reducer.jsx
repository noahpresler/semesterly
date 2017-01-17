export const userAcquisitionModal = (state = { isVisible: false}, action) => {
	switch (action.type) {
		case 'TOGGLE_ACQUISITION_MODAL':
			return {isVisible: !state.isVisible};
		case 'TRIGGER_ACQUISITION_MODAL':
			return {isVisible: true};
		default:
			return state;
	}
}