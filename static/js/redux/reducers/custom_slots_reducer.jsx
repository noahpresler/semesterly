import update from 'react/lib/update';
import * as ActionTypes from '../constants/actionTypes';

// slot fields:
//   time_start: 'HH:MM',
//   time_end: 'HH:MM',
//   day: one of MTWRF
//   name: slot's title
//   id
//   preview: whether the slot is just a preview or has been added

const customSlots = (state = [], action) => {
  switch (action.type) {
    case ActionTypes.ADD_CUSTOM_SLOT:
      return update(state, {
        $push: [action.newCustomSlot],
      });

    case ActionTypes.UPDATE_CUSTOM_SLOT: { // update any of the fields of the slot
      const tSlotIndex = state.findIndex(s => s.id === action.id);
      if (tSlotIndex === -1) {
        return state; // invalid id
      }
      const newSlot = Object.assign({}, state[tSlotIndex], action.newValues);
      return [...state.slice(0,
        tSlotIndex),
        newSlot,
        ...state.slice(tSlotIndex + 1, state.length),
      ];
    }

    case ActionTypes.REMOVE_CUSTOM_SLOT: {
      const dSlotIndex = state.findIndex(s => s.id === action.id);
      if (dSlotIndex === -1) {
        return state;
      }
      return [...state.slice(0, dSlotIndex), ...state.slice(dSlotIndex + 1, state.length)];
    }

    case ActionTypes.CLEAR_CUSTOM_SLOTS:
      return [];

    case ActionTypes.CLEAR_CONFLICTING_EVENTS:
      return state.filter(
        slot => slot.exists_conflict === undefined || slot.exists_conflict === false);

    case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE:
      return action.timetable.events;

    case ActionTypes.RECEIVE_CUSTOM_SLOTS:
      return action.events;

    default:
      return state;
  }
};

export default customSlots;
