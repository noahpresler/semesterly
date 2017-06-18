import { normalize } from 'normalizr';
import { getDenormCourseById } from '../reducers/entities_reducer';
import * as schemas from '../schema';

describe('course schema', () => {
  const normalized = {
      result: ['C1'],
      entities: {
        courses: { C1: { id: 1, code: 'C1', sections: ['C1-S1'] } },
        sections: { 'C1-S1': { meeting_section: 'S1', offering_set: [1] } },
        offering_set: { 1: { id: 1, day: 'M' } },
      },
    };
  const denormalized = [{
    id: 1, // course
    code: 'C1',
    sections: [{ // sections
      meeting_section: 'S1',
      offering_set: [{ // offerings
        id: 1,
        day: 'M',
      }],
    }],
  }];
  it('normalizes course array (e.g. search results) correctly', () => {
    const result = normalize(denormalized, [schemas.courseSchema]);
    expect(result).toEqual(normalized);
  });
  it('normalizes single course correctly', () => {
    const result = normalize(denormalized[0], schemas.courseSchema);
    expect(result).toEqual({ ...normalized, result: 'C1' });
  });
  it('denormalizes single course correctly', () => {
    expect(getDenormCourseById(normalized.entities, 'C1')).toEqual(denormalized[0]);
  })
});
