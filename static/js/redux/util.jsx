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
/**
 * This file contains various utility functions, but mostly those for saving data to
 * local storage.
 */
import Cookie from "js-cookie";
import range from "lodash/range";
import { lightSlotColor } from "./constants/colors";
import { getUIErrorLogEndpoint } from "./constants/endpoints";

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

export const getMaxTimetableHeightBasedOnWindowHeight = (height) => {
  // Hard-coded hour height because not sure how to get it post-render
  const hourHeight = 25 * 2;
  const otherElementsHeight = 140; // Ex: Topbar, toolbar, footer
  const maxHour = parseInt((height - otherElementsHeight) / hourHeight, 10);
  const maxHeight = maxHour * hourHeight;
  const height24Hours = 24 * hourHeight;
  return Math.min(maxHeight, height24Hours);
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
  range(lightSlotColor.length).find(
    (i) => !Object.values(courseToColourIndex).some((x) => x === i)
  );

export const generateCustomEventId = () =>
  new Date().getTime() + Math.floor(Math.random() * 10000 + 1);

export const slotToDisplayOffering = (
  course,
  section,
  offering,
  colourId,
  colorData
) => ({
  ...offering,
  colourId,
  courseId: course.id,
  code: course.code,
  name: course.name,
  custom: false,
  meeting_section: section.meeting_section,
  sectionId: section.id,
  colorData,
});

export const reportUIError = (error) => {
  fetch(getUIErrorLogEndpoint(), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": Cookie.get("csrftoken"),
    },
    method: "POST",
    body: JSON.stringify(error),
  });
};
