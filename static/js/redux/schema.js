import { schema } from 'normalizr';

export const offeringSchema = new schema.Entity('offering_set');

export const sectionSchema = new schema.Entity('sections', { offering_set: [offeringSchema] }, {
  idAttribute: (value, parent) => `${parent.code}-${value.meeting_section}`,
});

export const courseSchema = new schema.Entity('courses', { sections: [sectionSchema] }, {
  idAttribute: value => value.code,
});
