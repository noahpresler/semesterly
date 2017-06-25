import { schema } from 'normalizr';
import { strPropertyCmp } from './util';

export const getSectionId = (section, course) => `${course.code}-${section.meeting_section}`;

export const offeringSchema = new schema.Entity('offering_set');

export const sectionSchema = new schema.Entity('sections', { offering_set: [offeringSchema] }, {
  idAttribute: getSectionId,
});

export const courseSchema = new schema.Entity('courses', { sections: [sectionSchema] }, {
  idAttribute: value => value.code,
});

export const serializeTimetable = timetable =>
  timetable.courses.sort(strPropertyCmp('id')).map(course =>
    `${course.id}:${course.sections.map(section => section.id).join(',')}`,
  ).join(';');

export const timetableSchema = new schema.Entity('timetables', { courses: [courseSchema] }, {
  idAttribute: value => serializeTimetable(value),
});
