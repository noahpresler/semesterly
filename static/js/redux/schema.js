import { schema } from 'normalizr';

const OfferingSchema = new schema.Entity('offerings');

const SectionSchema = new schema.Entity('sections', {
  offerings: [ OfferingSchema ]
});

const CourseSchema = new schema.Entity('courses', {
  sections: [ SectionSchema ]
});

const TimetableSchema = new schema.Entity('timetables', {
  courses: [ CourseSchema ]
});