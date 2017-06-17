import { normalize } from 'normalizr';
import * as schemas from '../schema';

describe('course schema', () => {
  const unnormalized = [{
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
  it('gets normalized correctly', () => {
    const normalized = normalize(unnormalized, [schemas.courseSchema]);
    expect(normalized).toEqual({
      result: ['C1'],
      entities: {
        courses: { C1: { id: 1, code: 'C1', sections: ['C1-S1'] } },
        sections: { 'C1-S1': { meeting_section: 'S1', offering_set: [1] } },
        offerings: { 1: { id: 1, day: 'M' } },
      },
    });
  });
});
