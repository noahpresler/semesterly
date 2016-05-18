export const preferences = (state = {
    'no_classes_before': false,
    'no_classes_after': false,
    'long_weekend': false,
    'grouped': false,
    'do_ranking': false,
    'try_with_conflicts': false
  }, action) => {
	switch (action.type) {
        case 'SET_ALL_PREFERENCES':
            return action.preferences;
        case 'SET_PREFERENCE':
            let newPreferences = Object.assign({}, state, {[action.key]: action.value});
            return newPreferences;
		default:
			return state;
	}
}
