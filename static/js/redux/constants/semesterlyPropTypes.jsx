/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from 'prop-types';

export const semester = PropTypes.shape({
  name: PropTypes.string.isRequired,
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

export const classmatesArray = PropTypes.arrayOf(PropTypes.shape({
  first_name: PropTypes.string,
  last_name: PropTypes.string,
  img_url: PropTypes.string,
  sections: PropTypes.arrayOf(PropTypes.string), // section codes
}));

export const classmates = PropTypes.shape({
  current: classmatesArray,
  past: classmatesArray,
});

export const textbook = PropTypes.shape({
  author: PropTypes.string.isRequired,
  image_url: PropTypes.string.isRequired,
  isbn: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
});

export const sectionToTextbookMap = (props, propName, componentName) => {
  const textbooks = props[propName];
  if (!Object.keys(textbooks).every(k => typeof k === 'string')) {
    return new Error(`Keys must be section identifiers e.g. '(03)' in ${componentName}`);
  }
  return null;
};

export const evaluation = PropTypes.shape({
  course: PropTypes.number.isRequired,
  course_code: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  profesor: PropTypes.string,
  summary: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  year: PropTypes.string.isRequired,
});

export const integration = PropTypes.string.isRequired;

// should match timetable.models.Offering fields
const offering = PropTypes.shape({
  id: PropTypes.number.isRequired,
  section: PropTypes.number.isRequired,
  day: PropTypes.string.isRequired,
  date_start: PropTypes.string.isRequired,
  date_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  is_short_course: PropTypes.bool.isRequired,
});

// should match SectionSerializer
const sectionFields = {
  id: PropTypes.number.isRequired,
  meeting_section: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  enrolment: PropTypes.number.isRequired,
  waitlist: PropTypes.number.isRequired,
  waitlist_size: PropTypes.number.isRequired,
  section_type: PropTypes.string.isRequired,
  instructors: PropTypes.string.isRequired,
  semester: semester.isRequired,
};

export const normalizedSection = PropTypes.shape(sectionFields);

export const denormalizedSection = PropTypes.shape({
  ...sectionFields,
  offering_set: PropTypes.arrayOf(offering).isRequired,
});

// should match CourseSerializer fields
const relatedCourseFields = {
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  num_credits: PropTypes.number.isRequired,
  areas: PropTypes.array.isRequired,
  campus: PropTypes.string.isRequired,
  evals: PropTypes.arrayOf(evaluation).isRequired,
  integrations: PropTypes.arrayOf(integration),
  // reactions?
  textbooks: sectionToTextbookMap,
  // regexed courses?
  // popularity percent?
  prerequisites: PropTypes.string.isRequired,
  corequisites: PropTypes.string.isRequired,
  exclusions: PropTypes.string.isRequired,
};

const relatedCourse = PropTypes.shape(relatedCourseFields);

const courseFields = {
  ...relatedCourseFields,
  // TODO: update after using CourseSerializer
  related_courses: PropTypes.arrayOf(relatedCourse),
};

export const normalizedCourse = PropTypes.shape(courseFields);

export const denormalizedCourse = PropTypes.shape({
  ...courseFields,
  sections: PropTypes.arrayOf(denormalizedSection).isRequired,
});

// should match EventSerializer
export const customEvent = PropTypes.shape({
  name: PropTypes.string.isRequired,
  day: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
});

// should match SlotSerializer
export const normalizedSlot = PropTypes.shape({
  course: PropTypes.number.isRequired,
  section: PropTypes.number.isRequired,
  offerings: PropTypes.arrayOf(PropTypes.number).isRequired,
  is_optional: PropTypes.bool.isRequired,
  is_locked: PropTypes.bool.isRequired,
});

export const denormalizedSlot = PropTypes.shape({
  course: normalizedCourse.isRequired,
  section: normalizedSection.isRequired,
  offerings: PropTypes.arrayOf(offering).isRequired,
  is_optional: PropTypes.bool.isRequired,
  is_locked: PropTypes.bool.isRequired,
});

// should match StudentSerializer + isLoggedIn
export const userInfo = PropTypes.shape({
  isLoggedIn: PropTypes.bool.isRequired,
  class_year: PropTypes.number,
  img_url: PropTypes.string,
  fbook_uid: PropTypes.string,
  major: PropTypes.string,
  primary_major: PropTypes.string,
  other_majors: PropTypes.arrayOf(PropTypes.string),
  minors: PropTypes.arrayOf(PropTypes.string),
  social_courses: PropTypes.bool,
  social_offerings: PropTypes.bool,
  social_all: PropTypes.bool,
  emails_enabled: PropTypes.bool,
  school: PropTypes.string,
  integrations: PropTypes.arrayOf(PropTypes.shape({})),
  userFirstName: PropTypes.string,
  userLastName: PropTypes.string,
  userFullName: PropTypes.string,
  isAdvisor: PropTypes.bool,
  advisors: PropTypes.arrayOf(PropTypes.shape({})),
  FacebookSignedUp: PropTypes.bool,
  GoogleSignedUp: PropTypes.bool,
  GoogleLoggedIn: PropTypes.bool,
  jhuSignedUp: PropTypes.bool,
  LoginToken: PropTypes.string,
  LoginHash: PropTypes.string,
  timeAcceptedTos: PropTypes.string,
});

export const transcript = PropTypes.shape({
  semester_name: PropTypes.string,
  semester_year: PropTypes.string,
  owner: PropTypes.string,
  advisors: PropTypes.arrayOf(PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    full_name: PropTypes.string,
    jhed: PropTypes.string,
    email_address: PropTypes.string,
    is_pending: PropTypes.bool,
  })),
  comments: PropTypes.arrayOf(PropTypes.shape({
    author_name: PropTypes.string,
    content: PropTypes.string,
    timestamp: PropTypes.date,
  })),
});

export const schoolSpecificInfo = PropTypes.shape({
  areasName: PropTypes.string.isRequired,
  campuses: PropTypes.shape({}),
  courseRegex: PropTypes.string.isRequired,
  departmentsName: PropTypes.string.isRequired,
  levelsName: PropTypes.string.isRequired,
  primaryDisplay: PropTypes.string.isRequired,
  timesName: PropTypes.string.isRequired,
});

export const foreignUser = PropTypes.shape({
  major: PropTypes.string,
  social_all: PropTypes.bool,
  social_courses: PropTypes.bool,
  social_offerings: PropTypes.bool,
  userFirstName: PropTypes.string,
  userLastName: PropTypes.string,
  img_url: PropTypes.string.isRequired,
  class_year: PropTypes.number,
});

export const peer = PropTypes.shape({
  is_friend: PropTypes.bool.isRequired,
  large_img: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  peer: foreignUser.isRequired,
  profile_url: PropTypes.string.isRequired,
  shared_courses: PropTypes.arrayOf(relatedCourse).isRequired,
});
