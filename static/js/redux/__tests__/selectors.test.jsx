import * as selectors from '../reducers/root_reducer';
import { getSectionTypeToSections } from '../reducers/entities_reducer';

describe('timetable selectors', () => {
  describe('active TT selector', () => {
    it('gets correct timetable', () => {
      const state = { timetables: { items: [0, 1, 2, 3, 4], active: 2 } };
      expect(selectors.getActiveTT(state)).toEqual(2);
    });
  });
});

describe('course selectors', () => {
  describe('section type to sections selector', () => {
    it('returns correct mapping', () => {
      const xOne = { section_type: 'x', meeting_section: 'A' };
      const xTwo = { section_type: 'x', meeting_section: 'B' };
      const yOne = { section_type: 'y', meeting_section: 'C' };

      const state = [xOne, xTwo, yOne];
      expect(getSectionTypeToSections(state)).toEqual({
        x: [xOne, xTwo],
        y: [yOne],
      });
    });
  });
});
