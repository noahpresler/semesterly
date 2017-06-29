import { schema } from 'normalizr';

export const offeringSchema = new schema.Entity('offering_set');

export const sectionSchema = new schema.Entity('sections', { offering_set: [offeringSchema] });

export const courseSchema = new schema.Entity('courses', { sections: [sectionSchema] });
