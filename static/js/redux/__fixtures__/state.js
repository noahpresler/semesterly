export const emptySlot = {
  custom: true,
};

export const emptyCourse = {
  slots: [emptySlot],
};

export const emptyTimetable = {
  courses: [emptyCourse],
  events: [],
};

export const loggedIn = {
  data: { isLoggedIn: true },
};

export const withTimetables = {
  items: [emptyTimetable],
  ids: [],
  active: 0,
};

const fallSemester = { name: 'Fall', year: '2016' };
const springSemseter = { name: 'Spring', year: '2016' };
export const sampleSemesters = {
  current: 0,
  all: [fallSemester, springSemseter],
};
