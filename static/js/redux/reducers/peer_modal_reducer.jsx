export const peerModal = (state = { isVisible: false, isLoaded: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_PEER_MODAL':
			return {isVisible: !state.isVisible};
		case 'PEER_MODAL_LOADED':
			return {isLoaded: true};
		default:
			return state;
	}
}
