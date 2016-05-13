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

    case 'UPDATE_CUSTOM_SLOT': // update any of the fields of the slot
      let tslotindex = state.findIndex((s) => s.id == action.id);
      if (tslotindex == -1) {
        return state; // invalid id
      }
      let toggledSlot = Object.assign({}, state[tslotindex], action.newValues)
      return [...state.slice(0, tslotindex), toggledSlot, ...state.slice(tslotindex + 1, state.length)]

    case 'REMOVE_CUSTOM_SLOT':
      let dslotIndex = state.findIndex((s) => s.id == action.id);
      if (dslotIndex == -1) {
        return state;
      }
      return [...state.slice(0, dslotIndex), ...state.slice(dslotIndex + 1, state.length)]

    default:
      console.log("Received unknown type ", action.type)
      return state;
  }
}