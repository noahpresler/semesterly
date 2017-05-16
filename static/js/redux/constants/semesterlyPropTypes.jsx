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

export const customSlot = React.PropTypes.shape({
  custom: React.PropTypes.bool.isRequired,
  day: React.PropTypes.string.isRequired,
  key: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  num_conflicts: React.PropTypes.number.isRequired,
  preview: React.PropTypes.bool.isRequired,
  shift_index: React.PropTypes.number.isRequired,
  time_end: React.PropTypes.string.isRequired,
  time_start: React.PropTypes.string.isRequired,
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
  avg_rating: React.PropTypes.number,
  has_conflict: React.PropTypes.bool.isRequired,
  courses: React.PropTypes.arrayOf(course).isRequired,
  sections: React.PropTypes.arrayOf(React.PropTypes.number),
  semester: React.PropTypes.number,
});

export const evaluation = React.PropTypes.shape({
  course: React.PropTypes.number.isRequired,
  course_code: React.PropTypes.string.isRequired,
  id: React.PropTypes.number.isRequired,
  profesor: React.PropTypes.string,
  summary: React.PropTypes.string.isRequired,
  score: React.PropTypes.number.isRequired,
  year: React.PropTypes.string.isRequired,
});

export const integration = React.PropTypes.string.isRequired;

export const searchResult = React.PropTypes.shape({
  areas: React.PropTypes.string.isRequired,
  campus: React.PropTypes.string.isRequired,
  code: React.PropTypes.string.isRequired,
  department: React.PropTypes.string.isRequired,
  description: React.PropTypes.string.isRequired,
  evals: React.PropTypes.arrayOf(evaluation).isRequired,
  id: React.PropTypes.number.isRequired,
  integrations: React.PropTypes.arrayOf(integration),
  name: React.PropTypes.string.isRequired,
  num_credits: React.PropTypes.number.isRequired,
  sections: React.PropTypes.shape({
    '*': React.PropTypes.shape({
      '*': React.PropTypes.arrayOf(section),
    }),
  }),
});

export const userInfo = React.PropTypes.shape({
  FacebookSignedUp: React.PropTypes.bool,
  GoogleLoggedIn: React.PropTypes.bool,
  LoginHash: React.PropTypes.string,
  LoginToken: React.PropTypes.string,
  class_year: React.PropTypes.number,
  emails_enabled: React.PropTypes.bool,
  gender: React.PropTypes.string,
  integrations: React.PropTypes.arrayOf(React.PropTypes.shape({})),
  isLoggedIn: React.PropTypes.bool.isRequired,
  major: React.PropTypes.string,
  social_all: React.PropTypes.bool,
  social_courses: React.PropTypes.bool,
  social_offerings: React.PropTypes.bool,
  userFirstName: React.PropTypes.string,
  userLastName: React.PropTypes.string,
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

export const semester = React.PropTypes.shape({
  name: React.PropTypes.string.isRequired,
  year: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
});

export const foreignUser = React.PropTypes.shape({
  major: React.PropTypes.string,
  social_all: React.PropTypes.bool,
  social_courses: React.PropTypes.bool,
  social_offerings: React.PropTypes.bool,
  userFirstName: React.PropTypes.string,
  userLastName: React.PropTypes.string,
  img_url: React.PropTypes.string.isRequired,
  gender: React.PropTypes.string,
  class_year: React.PropTypes.number,
});

export const peer = React.PropTypes.shape({
  is_friend: React.PropTypes.bool.isRequired,
  large_img: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  peer: foreignUser.isRequired,
  profile_url: React.PropTypes.string.isRequired,
  shared_courses: React.PropTypes.arrayOf(course).isRequired,
});
