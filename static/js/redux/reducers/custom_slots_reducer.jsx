import update from 'react/lib/update';

export const customSlots = (state = [{'time_start': '10:00', 'time_end': '12:00', 'day': 'M'}], action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      return update(state, {
        $push: [action.new_custom_slot]
      });

    default:
      return state;
  }
}