export const peerModal = (state = { isVisible: false, isLoading: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_PEER_MODAL':
			return {isVisible: !state.isVisible};
		case 'PEER_MODAL_LOADING':
			return {isLoading: true};
		case 'PEER_MODAL_LOADED':
			return {isLoading: false};
		default:
			return state;
	}
}
