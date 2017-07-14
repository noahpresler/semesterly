export const course = {
  id: 1,
  sections: [1],
};

export const section = {
  id: 1,
  meeting_section: 'ting',
  offering_set: [1],
};

export const offering = {
  id: 1,
  day: 'M',
};

export const entities = {
  courses: { 1: course },
  sections: { 1: section },
  offering_set: { 1: offering },
};

export const slot = {
  course: 1,
  section: 1,
  offerings: [1],
};

export const timetable = {
  slots: [slot],
  events: [],
};

export const loggedIn = {
  data: { isLoggedIn: true },
};

export const withTimetables = {
  items: [timetable],
  ids: [],
  active: 0,
};

const fallSemester = { name: 'Fall', year: '2016' };
const springSemseter = { name: 'Spring', year: '2016' };
export const sampleSemesters = {
  current: 0,
  all: [fallSemester, springSemseter],
};
