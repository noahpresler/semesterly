import semester from '../state/semester_reducer';
import * as ActionTypes from '../constants/actionTypes';

describe('Semester reducer', () => {
  it('updates semester correctly', () => {
    const before = { current: 0, all: [] };
    const after = { current: 1, all: [] };
    const action = { type: ActionTypes.SET_SEMESTER, semester: 1 };
    expect(semester(before, action)).toEqual(after);
  });
});
