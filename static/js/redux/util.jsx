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

import range from "lodash/range";
import COLOUR_DATA from "./constants/colours";

export const browserSupportsLocalStorage = () => {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
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
  localStorage.setItem("courseSections", JSON.stringify(courseSections));
};
export const saveLocalActiveIndex = (activeIndex) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("active", activeIndex);
};
export const saveLocalPreferences = (preferences) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("preferences", JSON.stringify(preferences));
};
export const saveLocalSemester = (semester) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("semesterName", semester.name);
  localStorage.setItem("year", semester.year);
  localStorage.removeItem("semester"); // only use new format for semester
};
export const clearLocalTimetable = function deleteTimetableDataFromLocalStorage() {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.removeItem("semester");
  localStorage.removeItem("semesterName");
  localStorage.removeItem("year");
  localStorage.removeItem("courseSections");
  localStorage.removeItem("active");
  localStorage.removeItem("preferences");
};
export const setFirstVisit = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("firstVisit", time);
};
export const setFriendsCookie = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("friendsCookie", time);
};
export const setTimeShownBanner = (time) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  localStorage.setItem("timeShownBanner", time);
};
export const setDeclinedNotifications = (declined) => {
  if (!browserSupportsLocalStorage()) {
    return;
  }
  // console.log("settings decline", declined);
  localStorage.setItem("declinedNotifications", declined);
};
export const timeLapsedGreaterThan = (time, days) => {
  if (!browserSupportsLocalStorage()) {
    return null;
  }
  const timeNow = new Date();
  const windowInMilli = 1000 * 60 * 60 * 24 * days;
  // console.log(timeNow.getTime(), Number(time), windowInMilli);
  return timeNow.getTime() - Number(time) > windowInMilli;
};
export const timeLapsedInDays = (time) =>
  (new Date().getTime() - Number(time)) / (1000 * 60 * 60 * 24);
export const getLocalTimetable = () => {
  if (!browserSupportsLocalStorage()) {
    return {};
  }
  try {
    return {
      courseSections: JSON.parse(localStorage.getItem("courseSections")),
      active: localStorage.getItem("active"),
    };
  } catch (exception) {
    return {};
  }
};

export const getMaxHourBasedOnWindowHeight = () => {
  const calRow = $(".cal-row");
  const lastRowY = calRow.last().position();
  if (!lastRowY) {
    return 0;
  }
  const lastHour = 7 + calRow.length / 2;
  const hourHeight = calRow.height() * 2;
  const maxHour = parseInt(
    lastHour + ($(document).height() - 250 - lastRowY.top) / hourHeight,
    10
  );
  if (maxHour < lastHour) {
    return lastHour;
  }
  return Math.min(24, parseInt(maxHour, 10));
};

/*
 * Raise error if the response has an error status code, otherwise return response.
 * Used to handle errors inside of the fetch() promise chain
 */
export const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

// TODO: define map somewhere or use CHOICES in Section model
export const getSectionTypeDisplayName = function getSectionTypeDisplayName(
  sectionTypeCode
) {
  switch (sectionTypeCode) {
    case "L":
      return "Lecture";
    case "T":
      return "Tutorial";
    case "P":
      return "Lab/Practical";
    default:
      return sectionTypeCode;
  }
};

// A comparison function for sorting objects by string property
export const strPropertyCmp = (prop) => (first, second) =>
  first[prop] > second[prop] ? 1 : -1;

export const isIncomplete = (prop) =>
  prop === undefined || prop === "" || prop === null;

export const getNextAvailableColour = (courseToColourIndex) =>
  range(COLOUR_DATA.length).find(
    (i) => !Object.values(courseToColourIndex).some((x) => x === i)
  );

export const generateCustomEventId = () =>
  new Date().getTime() + Math.floor(Math.random() * 10000 + 1);

export const slotToDisplayOffering = (course, section, offering, colourId) => ({
  ...offering,
  colourId,
  courseId: course.id,
  code: course.code,
  name: course.name,
  custom: false,
  meeting_section: section.meeting_section,
});

// gradient utils
const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

export const rgbToHex = ({ r, g, b }) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const subtractRgb = (end, start) => ({
  r: end.r - start.r,
  g: end.g - start.g,
  b: end.b - start.b,
});

export const addRgb = (op1, op2) => ({
  r: op1.r + op2.r,
  g: op1.g + op2.g,
  b: op1.b + op2.b,
});

// Change this to raw division with floats
export const divideRgb = (color, scale) => ({
  r: color.r / scale,
  g: color.g / scale,
  b: color.b / scale,
});

export const multRgb = (color, scale) => ({
  r: color.r * scale,
  g: color.g * scale,
  b: color.b * scale,
});

// Add this to round only when necessary
export const roundRgb = (color) => ({
  r: Math.round(color.r),
  g: Math.round(color.g),
  b: Math.round(color.b),
});

export const isRgbValid = (color) => {
  const invalid = Object.keys(color).some((key) => color[key] > 255 || color[key] < 0);
  return !invalid;
};

export const equalRgb = (a, b) => a.r === b.r && a.g === b.g && a.b === b.b;

export const buildGradient = (start, end, rng) => {
  if (rng < 2) {
    return [start];
    // OR: throw new Error("Gradient should have at least two steps");
  }
  const b = hexToRgb(start); // y-intercept
  const diff = subtractRgb(hexToRgb(end), b);
  // Change this to range - 1 so that you get both start and end as values
  // The caveat here is that range has to be > 1 now
  // (which means you need two colors for a gradient, which is expected anyways)
  const step = divideRgb(diff, rng - 1);
  const gradient = [];
  for (let i = 0; i < rng; i += 1) {
    const next = gradient.length > 0 ? addRgb(gradient[gradient.length - 1], step) : b;
    gradient.push(next);
  }
  // Only round when converting to Hex
  return gradient
    .map((color) => rgbToHex(roundRgb(color)))
    .map((color) => ({
      background: color,
      highlight: color, // TODO: replace with highlight color
      border: color, // TODO: replace with border color
      font: "#222",
    }));
};
