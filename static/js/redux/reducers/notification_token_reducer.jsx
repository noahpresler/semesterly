export const notificationToken = (state = { hasToken: false }, action) => {
	switch (action.type) {
		case 'TOKEN_REGISTERED':
			return {hasToken: true};
		case 'UNREGISTER_TOKEN':
			return {hasToken: false};
		default:
			return state;
	}
}
