import {
  getSectionTypeToSections,
  getMaxEndHour,
} from '../reducers/entities_reducer';

describe('course selectors', () => {
  describe('section type to sections selector', () => {
    it('returns correct mapping', () => {
      const xOne = { section_type: 'x', meeting_section: 'A' };
      const xTwo = { section_type: 'x', meeting_section: 'B' };
      const yOne = { section_type: 'y', meeting_section: 'C' };

      const state = { sections: [xOne, xTwo, yOne] };
      expect(getSectionTypeToSections(state)).toEqual({
        x: [xOne, xTwo],
        y: [yOne],
      });
    });
  });
});

describe('timetable selectors', () => {
  const timetable = {
    name: 'tt_name',
    has_conflict: false,
    courses: [{
      id: 'C1',
      name: 'course',
    }],
    slots: [{
      section: {
        id: 'S1',
        name: 'section',
      },
      offerings: [{
        id: 'O1',
        thing: 'thing',
        time_end: '18:30',
      }],
    }],
  };
  describe('getMaxEndHour', () => {
    it('returns 17 for empty timetable', () => {
      expect(getMaxEndHour({ courses: [], slots: [] })).toEqual(17);
    });
    it('returns correct end hour', () => {
      expect(getMaxEndHour(timetable)).toEqual(19);
    });
  });
});
