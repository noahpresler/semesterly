import update from 'react/lib/update';
import * as ActionTypes from '../constants/actionTypes.jsx'

// slot fields:
//   time_start: 'HH:MM',
//   time_end: 'HH:MM',
//   day: one of MTWRF
//   name: slot's title
//   id
//   preview: whether the slot is just a preview or has been added

export const customSlots = (state = [], action) => {
  switch(action.type) {
    case ActionTypes.ADD_CUSTOM_SLOT:
      return update(state, {
        $push: [action.newCustomSlot]
      });

    case ActionTypes.UPDATE_CUSTOM_SLOT: // update any of the fields of the slot
      let tslotindex = state.findIndex((s) => s.id == action.id);
      if (tslotindex == -1) {
        return state; // invalid id
      }
      let newSlot = Object.assign({}, state[tslotindex], action.newValues)
      let temp = [...state.slice(0, tslotindex), newSlot, ...state.slice(tslotindex + 1, state.length)]
      return temp

    case ActionTypes.REMOVE_CUSTOM_SLOT:
      let dslotIndex = state.findIndex((s) => s.id == action.id);
      if (dslotIndex == -1) {
        return state;
      }
      return [...state.slice(0, dslotIndex), ...state.slice(dslotIndex + 1, state.length)]

    default:
      return state;
  }
}