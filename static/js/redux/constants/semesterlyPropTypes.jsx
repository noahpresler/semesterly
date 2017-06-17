import PropTypes from 'prop-types';

export const fullCourseDetails = PropTypes.shape({
  code: PropTypes.string,
  department: PropTypes.string,
  description: PropTypes.string,
  prerequisites: PropTypes.string,
  areas: PropTypes.string,
});

export const classmates = PropTypes.oneOfType([
  PropTypes.arrayOf(
    PropTypes.shape({
      img_url: PropTypes.string,
      first_name: PropTypes.string,
      last_name: PropTypes.string,
    }),
  ),
  PropTypes.shape({}),
]);

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
  return true;
};

export const section = PropTypes.shape({
  day: PropTypes.string.isRequired,
  enrolment: PropTypes.number.isRequired,
  instructors: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  meeting_section: PropTypes.string.isRequired,
  section: PropTypes.number.isRequired,
  section_type: PropTypes.string.isRequired,
  semester: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  textbooks: PropTypes.arrayOf(textbook).isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
  waitlist: PropTypes.number.isRequired,
  waitlist_size: PropTypes.number.isRequired,
  was_full: PropTypes.bool.isRequired,
});

export const customSlot = PropTypes.shape({
  custom: PropTypes.bool.isRequired,
  day: PropTypes.string.isRequired,
  key: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  num_conflicts: PropTypes.number.isRequired,
  preview: PropTypes.bool.isRequired,
  shift_index: PropTypes.number.isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
});

export const slot = PropTypes.shape({
  code: PropTypes.string.isRequired,
  colourId: PropTypes.number.isRequired,
  course: PropTypes.number.isRequired,
  day: PropTypes.string.isRequired,
  depth_level: PropTypes.number.isRequired,
  enrolment: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
  instructors: PropTypes.string.isRequired,
  is_section_filled: PropTypes.bool.isRequired,
  location: PropTypes.string.isRequired,
  meeting_section: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  num_conflicts: PropTypes.number.isRequired,
  section: PropTypes.number.isRequired,
  section_type: PropTypes.string.isRequired,
  semester: PropTypes.number.isRequired,
  shift_index: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  textbooks: PropTypes.arrayOf(PropTypes.number).isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
  waitlist: PropTypes.number.isRequired,
  waitlist_size: PropTypes.number.isRequired,
  was_full: PropTypes.bool.isRequired,
});

export const course = PropTypes.oneOfType([
  PropTypes.shape({
    areas: PropTypes.string.isRequired,
    campus: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    corequisites: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    enrolled_sections: PropTypes.arrayOf(PropTypes.string).isRequired,
    exclusions: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    info: PropTypes.string.isRequired,
    is_waitlist_only: PropTypes.bool.isRequired,
    level: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    num_credits: PropTypes.number.isRequired,
    prerequisites: PropTypes.string.isRequired,
    school: PropTypes.string.isRequired,
    slots: PropTypes.arrayOf(slot),
    textbooks: sectionToTextbookMap,
  }),
  PropTypes.shape({}),
]);
course.related_courses = PropTypes.arrayOf(course);

export const timetable = PropTypes.shape({
  avg_rating: PropTypes.number,
  has_conflict: PropTypes.bool.isRequired,
  courses: PropTypes.arrayOf(course).isRequired,
  sections: PropTypes.arrayOf(PropTypes.number),
  semester: PropTypes.number,
});

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

export const searchResult = PropTypes.shape({
  areas: PropTypes.string.isRequired,
  campus: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  evals: PropTypes.arrayOf(evaluation).isRequired,
  id: PropTypes.number.isRequired,
  integrations: PropTypes.arrayOf(integration),
  name: PropTypes.string.isRequired,
  num_credits: PropTypes.number.isRequired,
  sections: PropTypes.arrayOf(section),
});

export const userInfo = PropTypes.shape({
  FacebookSignedUp: PropTypes.bool,
  GoogleLoggedIn: PropTypes.bool,
  LoginHash: PropTypes.string,
  LoginToken: PropTypes.string,
  class_year: PropTypes.number,
  emails_enabled: PropTypes.bool,
  gender: PropTypes.string,
  integrations: PropTypes.arrayOf(PropTypes.shape({})),
  isLoggedIn: PropTypes.bool.isRequired,
  major: PropTypes.string,
  social_all: PropTypes.bool,
  social_courses: PropTypes.bool,
  social_offerings: PropTypes.bool,
  userFirstName: PropTypes.string,
  userLastName: PropTypes.string,
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

export const semester = PropTypes.shape({
  name: PropTypes.string.isRequired,
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

export const foreignUser = PropTypes.shape({
  major: PropTypes.string,
  social_all: PropTypes.bool,
  social_courses: PropTypes.bool,
  social_offerings: PropTypes.bool,
  userFirstName: PropTypes.string,
  userLastName: PropTypes.string,
  img_url: PropTypes.string.isRequired,
  gender: PropTypes.string,
  class_year: PropTypes.number,
});

export const peer = PropTypes.shape({
  is_friend: PropTypes.bool.isRequired,
  large_img: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  peer: foreignUser.isRequired,
  profile_url: PropTypes.string.isRequired,
  shared_courses: PropTypes.arrayOf(course).isRequired,
});

