export const preferences = (state = {
    'no_classes_before': false,
    'no_classes_after': false,
    'long_weekend': false,
    'grouped': false,
    'do_ranking': false,
    'try_with_conflicts': false
  }, action) => {
	switch (action.type) {
		default:
			return state;
	}
}
