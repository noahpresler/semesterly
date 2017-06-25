import * as selectors from '../reducers/root_reducer';
import {
  getSectionTypeToSections,
  getFromTimetable,
} from '../reducers/entities_reducer';

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
    sections: [{
      id: 'S1',
      name: 'section',
      offering_set: [{
        id: 'O1',
        thing: 'thing',
      }],
    }],
  };
  describe('getfromTimetable', () => {
    it('returns correct shape', () => {
      const fields = {
        timetables: ['name'],
        courses: ['id'],
        sections: ['id'],
        offerings: [],
      };

      const result = getFromTimetable(timetable, fields);
      expect('courses' in result).toBeTruthy();
      expect('sections' in result).toBeTruthy();
      expect('offerings' in result.sections[0]).toBeTruthy();
    });
    it('only returns specified fields', () => {
      const fields = { timetables: ['name'], sections: [], offerings: [] };
      const result = getFromTimetable(timetable, fields);
      expect('name' in result).toBeTruthy();
      expect('has_conflict' in result).toBeFalsy();
    });
  });
  describe('getMaxEndHour', () => {
    it('returns 17 for empty timetable', () => {
      expect(selectors.getMaxTTEndHour({
        timetables: {
          items: [{ courses: [], sections: [] }],
          active: 0,
        },
      })).toEqual(17);
    });

    it('returns correct end hour', () => {
      expect(selectors.getMaxTTEndHour({
        timetables: {
          items: [{ courses: [{ id: 1 }],
            sections: [{ offering_set: [
            { time_end: '18:00' },
            { time_end: '20:30' },
            ] }] }],
          active: 0,
        },
      })).toEqual(20);
    });
  });
});