import update from 'react/lib/update';

// slot fields:
//   time_start: 'HH:MM',
//   time_end: 'HH:MM',
//   day: one of MTWRF
//   name: slot's title
//   id
//   preview: whether the slot is just a preview or has been added

export const customSlots = (state = [], action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      action.newCustomSlot['id'] = new Date().getTime()
      return update(state, {
        $push: [action.newCustomSlot]
      });

    case 'TOGGLE_SLOT_PREVIEW':
      let tslotindex = state.findIndex((s) => s.id == action.id);
      if (tslotindex == -1) {
        return state; // invalid id
      }
      let toggledSlot = Object.assign({}, state[slotIndex], { preview: !state[slotIndex].preview })
      return [...state.slice(0, slotIndex), movedSlot, ...state.slice(slotIndex + 1, state.length)]

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
      let movedSlot = Object.assign({}, state[slotIndex], action.newTimes)
      return [...state.slice(0, slotIndex), movedSlot, ...state.slice(slotIndex + 1, state.length)]

    default:
      return state;
  }
}