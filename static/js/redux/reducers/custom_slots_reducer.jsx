import update from 'react/lib/update';

export const customSlots = (state = [], action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      action.newCustomSlot['id'] = new Date().getTime()
      return update(state, {
        $push: [action.newCustomSlot]
      });

    case 'REMOVE_CUSTOM_SLOT':
      let dslotIndex = state.findIndex((s) => s.id == action.id);
      if (dslotIndex == -1) {
        return state;
      }
      return [...state.slice(0, dslotIndex), ...state.slice(dslotIndex + 1, state.length)]

    case 'MOVE_CUSTOM_SLOT':
      let slotIndex = state.findIndex((s) => s.id == action.id);
      if (slotIndex == -1) {
        return state; // invalid id
      }
      let newSlot = Object.assign({}, state[slotIndex], action.newTimes)
      return [...state.slice(0, slotIndex), newSlot, ...state.slice(slotIndex + 1, state.length)]

    default:
      return state;
  }
}