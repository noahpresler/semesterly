import * as selectors from '../reducers/root_reducer';

describe('timetable selectors', () => {
  describe('active TT selector', () => {
    it('gets correct timetable', () => {
      const state = { timetables: { items: [0, 1, 2, 3, 4], active: 2 } };
      expect(selectors.getActiveTT(state)).toEqual(2);
    });
  });
});
