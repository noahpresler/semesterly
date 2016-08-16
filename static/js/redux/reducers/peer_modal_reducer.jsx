export const peerModal = (state = { isVisible: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_PEER_MODAL':
			return {isVisible: !state.isVisible}
		default:
			return state;
	}
}
