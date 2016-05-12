import update from 'react/lib/update';

export const customSlots = (state = [{'time_start': '10:00', 'time_end': '12:00', 'day': 'M'}], action) => {
  switch(action.type) {
    case 'ADD_CUSTOM_SLOT':
      // get smallest available id
      let ids = state.map(s => s.id).sort((a, b) => a - b)
      let first_missing = ids.findIndex((id, index) => id != index)
      let next_id = first_missing == -1 ? ids.length : first_missing;

      action.new_custom_slot['id'] = next_id
      return update(state, {
        $push: [action.new_custom_slot]
      });

    case 'MOVE_CUSTOM_SLOT':
      let slotIndex = state.findIndex((s) => s.id == action.id);
      if (slotIndex == -1) {
        return state; // invalid id
      }
      let new_slot = {
        'time_start': action.newTimeStart,
        'time_end': action.newTimeEnd,
        'id': action.id
      }
      return [...state.slice(0, slotIndex), new_slot, ...state.slice(slotIndex, state.length)]

    default:
      return state;
  }
}