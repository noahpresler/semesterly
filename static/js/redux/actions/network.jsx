import fetch from 'isomorphic-fetch';

export function requestTimetables(state) {
  return {
    type: REQUEST_TIMETABLES,
    state
  }
}

export function receiveTimetables(state, json) {
  return {
    type: RECEIVE_TIMETABLES,
    state,
    receivedAt: Date.now()
  }
}
