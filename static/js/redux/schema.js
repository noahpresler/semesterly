import { schema } from 'normalizr';
import v4 from 'uuid/v4';

export const offeringSchema = new schema.Entity('offering_set');

export const sectionSchema = new schema.Entity('sections', { offering_set: [offeringSchema] });

export const courseSchema = new schema.Entity('courses', { sections: [sectionSchema] });

// TODO: no need to make timetable an entity?
export const timetableSchema = new schema.Entity('timetables', {}, { idAttribute: v4() });
