import update from 'react/lib/update';

export const customSlots = (state = { custom_slots: [] }, action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      return update(state, {
        custom_slots: {
          $push: [action.new_custom_slot]
        }
      });

    default:
      return state;
  }
}