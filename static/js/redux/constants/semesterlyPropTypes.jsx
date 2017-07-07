import PropTypes from 'prop-types';

const arrayOfIds = PropTypes.arrayOf(PropTypes.number).isRequired;

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
  time_start: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
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
  areas: PropTypes.string.isRequired,
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
const eventFields = {
  name: PropTypes.string.isRequired,
  day: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
};

export const customSlot = PropTypes.shape(eventFields);

export const calendarEventFields = {
  ...eventFields,
  // display info
  key: PropTypes.string.isRequired,
  depth_level: PropTypes.number.isRequired,
  num_conflicts: PropTypes.number.isRequired,
  shift_index: PropTypes.number.isRequired,
  uses12HrTime: PropTypes.bool.isRequired,
  // functions
  connectDragTarget: PropTypes.func.isRequired,
  connectCreateTarget: PropTypes.func.isRequired,
};

export const courseEvent = PropTypes.shape({
  ...calendarEventFields,
  // course info
  courseId: PropTypes.number.isRequired,
  classmates: classmatesArray.isRequired,
  // section info
  locked: PropTypes.bool.isRequired,
  meeting_section: PropTypes.string.isRequired,
  // offering info
  location: PropTypes.string.isRequired,
  // display info
  colourId: PropTypes.number.isRequired,
  primaryDisplayAttribute: PropTypes.string.isRequired,
  // functions
  fetchCourseInfo: PropTypes.func.isRequired,
  removeCourse: PropTypes.func.isRequired,
  lockOrUnlockSection: PropTypes.func.isRequired,
});

export const customEvent = PropTypes.shape({
  ...calendarEventFields,
  // display info
  preview: PropTypes.bool.isRequired,
  isDragging: PropTypes.bool.isRequired,
  // functions
  updateCustomSlot: PropTypes.func.isRequired,
  removeCustomSlot: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func.isRequired,
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


// should match DisplayTimetableSerializer
export const timetable = PropTypes.shape({
  id: PropTypes.number,
  slots: PropTypes.arrayOf(normalizedSlot),
  has_conflict: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired, // should be empty string for shared/generated tts
  avg_rating: PropTypes.number,
});

export const NormalizedTimetable = PropTypes.shape({
  id: PropTypes.number,
  slots: arrayOfIds,
  has_conflict: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired, // should be empty string for shared/generated tts
  avg_rating: PropTypes.number,
});

// should match StudentSerializer + isLoggedIn
export const userInfo = PropTypes.shape({
  isLoggedIn: PropTypes.bool.isRequired,
  class_year: PropTypes.number.isRequired,
  img_url: PropTypes.string.isRequired,
  fbook_uid: PropTypes.string.isRequired,
  gender: PropTypes.string.isRequired,
  major: PropTypes.string.isRequired,
  social_courses: PropTypes.bool.isRequired,
  social_offerings: PropTypes.bool.isRequired,
  social_all: PropTypes.bool.isRequired,
  emails_enabled: PropTypes.bool.isRequired,
  school: PropTypes.string.isRequired,
  integrations: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  userFirstName: PropTypes.string.isRequired,
  userLastName: PropTypes.string.isRequired,
  FacebookSignedUp: PropTypes.bool.isRequired,
  GoogleSignedUp: PropTypes.bool.isRequired,
  GoogleLoggedIn: PropTypes.bool.isRequired,
  LoginToken: PropTypes.string.isRequired,
  LoginHash: PropTypes.string.isRequired,
  timeAcceptedTos: PropTypes.string.isRequired,
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
  gender: PropTypes.string,
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
