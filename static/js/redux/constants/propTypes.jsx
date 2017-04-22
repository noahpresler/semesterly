import React from 'react';

export const fullCourseDetails = React.PropTypes.shape({
  code: React.PropTypes.string,
  department: React.PropTypes.string,
  description: React.PropTypes.string,
  prerequisites: React.PropTypes.string,
  areas: React.PropTypes.string,
});

export const classmates = React.PropTypes.oneOfType([
  React.PropTypes.arrayOf(
    React.PropTypes.shape({
      img_url: React.PropTypes.string,
      first_name: React.PropTypes.string,
      last_name: React.PropTypes.string,
    }),
  ),
  React.PropTypes.shape({}),
]);

export const textbook = React.PropTypes.shape({
  author: React.PropTypes.string.isRequired,
  image_url: React.PropTypes.string.isRequired,
  isbn: React.PropTypes.number.isRequired,
  title: React.PropTypes.string.isRequired,
});

export const sectionToTextbookMap = (props, propName, componentName) => {
  const textbooks = props[propName];
  if (!Object.keys(textbooks).every(k => typeof k === 'string')) {
    return new Error(`Keys must be section identifiers e.g. '(03)' in ${componentName}`);
  }
  return true;
};

export const section = React.PropTypes.shape({
  course: React.PropTypes.number.isRequired,
  day: React.PropTypes.string.isRequired,
  enrolment: React.PropTypes.number.isRequired,
  instructors: React.PropTypes.string.isRequired,
  location: React.PropTypes.string.isRequired,
  meeting_section: React.PropTypes.string.isRequired,
  section: React.PropTypes.number.isRequired,
  section_type: React.PropTypes.string.isRequired,
  semester: React.PropTypes.number.isRequired,
  size: React.PropTypes.number.isRequired,
  textbooks: React.PropTypes.arrayOf(textbook).isRequired,
  time_end: React.PropTypes.string.isRequired,
  time_start: React.PropTypes.string.isRequired,
  waitlist: React.PropTypes.number.isRequired,
  waitlist_size: React.PropTypes.number.isRequired,
  was_full: React.PropTypes.bool.isRequired,
});

export const slot = React.PropTypes.shape({
  code: React.PropTypes.string.isRequired,
  colourId: React.PropTypes.number.isRequired,
  course: React.PropTypes.number.isRequired,
  day: React.PropTypes.string.isRequired,
  depth_level: React.PropTypes.number.isRequired,
  enrolment: React.PropTypes.number.isRequired,
  id: React.PropTypes.number.isRequired,
  instructors: React.PropTypes.string.isRequired,
  is_section_filled: React.PropTypes.bool.isRequired,
  location: React.PropTypes.string.isRequired,
  meeting_section: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  num_conflicts: React.PropTypes.number.isRequired,
  section: React.PropTypes.number.isRequired,
  section_type: React.PropTypes.string.isRequired,
  semester: React.PropTypes.number.isRequired,
  shift_index: React.PropTypes.number.isRequired,
  size: React.PropTypes.number.isRequired,
  textbooks: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
  time_end: React.PropTypes.string.isRequired,
  time_start: React.PropTypes.string.isRequired,
  waitlist: React.PropTypes.number.isRequired,
  waitlist_size: React.PropTypes.number.isRequired,
  was_full: React.PropTypes.bool.isRequired,
});

export const course = React.PropTypes.oneOfType([
  React.PropTypes.shape({
    areas: React.PropTypes.string.isRequired,
    campus: React.PropTypes.string.isRequired,
    code: React.PropTypes.string.isRequired,
    corequisites: React.PropTypes.string.isRequired,
    department: React.PropTypes.string.isRequired,
    description: React.PropTypes.string.isRequired,
    enrolled_sections: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    exclusions: React.PropTypes.string.isRequired,
    id: React.PropTypes.number.isRequired,
    info: React.PropTypes.string.isRequired,
    is_waitlist_only: React.PropTypes.bool.isRequired,
    level: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    notes: React.PropTypes.string.isRequired,
    num_credits: React.PropTypes.number.isRequired,
    prerequisites: React.PropTypes.string.isRequired,
    school: React.PropTypes.string.isRequired,
    slots: React.PropTypes.arrayOf(slot),
    textbooks: sectionToTextbookMap,
  }),
  React.PropTypes.shape({}),
]);
course.related_courses = React.PropTypes.arrayOf(course);

export const timetable = React.PropTypes.shape({
  avg_rating: React.PropTypes.number.isRequired,
  has_conflict: React.PropTypes.bool.isRequired,
  id: React.PropTypes.number.isRequired,
  courses: React.PropTypes.arrayOf(course).isRequired,
  sections: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
  semester: React.PropTypes.number.isRequired,
});

export const userInfo = React.PropTypes.shape({
  FacebookSignedUp: React.PropTypes.bool.isRequired,
  GoogleLoggedIn: React.PropTypes.bool.isRequired,
  LoginHash: React.PropTypes.string.isRequired,
  LoginToken: React.PropTypes.string.isRequired,
  class_year: React.PropTypes.number.isRequired,
  emails_enabled: React.PropTypes.bool.isRequired,
  gender: React.PropTypes.string.isRequired,
  integrations: React.PropTypes.arrayOf(React.PropTypes.shape({})),
  isLoggedIn: React.PropTypes.bool.isRequired,
  major: React.PropTypes.string.isRequired,
  social_all: React.PropTypes.bool.isRequired,
  social_courses: React.PropTypes.bool.isRequired,
  social_offerings: React.PropTypes.bool.isRequired,
  userFirstName: React.PropTypes.string.isRequired,
  userLastName: React.PropTypes.string.isRequired,
});

export const schoolSpecificInfo = React.PropTypes.shape({
  areasName: React.PropTypes.string.isRequired,
  campuses: React.PropTypes.shape({}),
  courseRegex: React.PropTypes.string.isRequired,
  departmentsName: React.PropTypes.string.isRequired,
  levelsName: React.PropTypes.string.isRequired,
  primaryDisplay: React.PropTypes.string.isRequired,
  timesName: React.PropTypes.string.isRequired,
});
