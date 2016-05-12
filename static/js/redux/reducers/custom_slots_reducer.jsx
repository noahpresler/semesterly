import update from 'react/lib/update';

export const customSlots = (state = [], action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      return update(state, {
        $push: [action.new_custom_slot]
      });

    default:
      return state;
  }
}