import { getLogFinalExamViewEndpoint } from './constants/endpoints';

export const randomString = (length = 30, chars = '!?()*&^%$#@![]0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') => {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};
export const browserSupportsLocalStorage = () => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (exception) {
    return false;
  }
};
// TODO: merge set functions into generic set(key, value)
export const saveLocalCourseSections = (courseSections) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('courseSections', JSON.stringify(courseSections));
};
export const saveLocalActiveIndex = (activeIndex) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('active', activeIndex);
};
export const saveLocalPreferences = (preferences) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('preferences', JSON.stringify(preferences));
};
export const saveLocalSemester = (semester) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('semester', semester);
};
export const setFirstVisit = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('firstVisit', time);
};
export const setFriendsCookie = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('friendsCookie', time);
};
export const setTimeShownBanner = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem('timeShownBanner', time);
};
export const setDeclinedNotifications = (declined) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
    // console.log("settings decline", declined);
  localStorage.setItem('declinedNotifications', declined);
};
export const timeLapsedGreaterThan = (time, days) => {
  if (!browserSupportsLocalStorage()) {
    return null;
  }
  const timeNow = new Date();
  const windowInMilli = 1000 * 60 * 60 * 24 * days;
    // console.log(timeNow.getTime(), Number(time), windowInMilli);
  return ((timeNow.getTime() - Number(time)) > windowInMilli);
};
export const timeLapsedInDays = time =>
  ((new Date()).getTime() - Number(time)) / (1000 * 60 * 60 * 24);
export const getLocalTimetable = () => {
  if (!browserSupportsLocalStorage()) {
    return {};
  }
  try {
    return {
      courseSections: JSON.parse(localStorage.getItem('courseSections')),
      active: localStorage.getItem('active'),
    };
  } catch (exception) {
    return {};
  }
};
export const logFinalExamView = () => {
  fetch(getLogFinalExamViewEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
};
export const getMaxHourBasedOnWindowHeight = () => {
  const calRow = $('.cal-row');
  const lastRowY = calRow.last().position();
  if (!lastRowY) {
    return 0;
  }
  const lastHour = 7 + (calRow.length / 2);
  const hourHeight = calRow.height() * 2;
  const maxHour = parseInt(lastHour +
    (($(document).height() - 250 - lastRowY.top) / hourHeight), 10);
  if (maxHour < lastHour) {
    return lastHour;
  }
  return Math.min(24, parseInt(maxHour, 10));
};
/*
 gets the end hour of the current timetable, based on the class that ends latest
 */
export const getMaxEndHour = (timetable, hasCourses) => {
  let maxEndHour = 17;
  if (!hasCourses) {
    return maxEndHour;
  }
  getMaxHourBasedOnWindowHeight();
  const courses = timetable.courses;
  for (let courseIndex = 0; courseIndex < courses.length; courseIndex++) {
    const course = courses[courseIndex];
    for (let slotIndex = 0; slotIndex < course.slots.length; slotIndex++) {
      const slot = course.slots[slotIndex];
      const endHour = parseInt(slot.time_end.split(':')[0], 10);
      maxEndHour = Math.max(maxEndHour, endHour);
    }
  }
  return Math.max(maxEndHour, getMaxHourBasedOnWindowHeight());
};

export const isIncomplete = prop => prop === undefined || prop === '' || prop === null;
