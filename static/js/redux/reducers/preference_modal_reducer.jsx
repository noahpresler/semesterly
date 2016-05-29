export const preferenceModal = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case 'TOGGLE_PREFERENCE_MODAL':
      return {isVisible: !state.isVisible}
    default:
      return state;
  }
}