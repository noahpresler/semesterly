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

import ical from 'ical-generator';
import Cookie from 'js-cookie';
import FileSaver from 'browser-filesaver';
import {
    getAddTTtoGCalEndpoint,
    getLogiCalEndpoint,
    getRequestShareTimetableLinkEndpoint,
    getCourseShareLink,
} from '../constants/endpoints';
import { FULL_WEEK_LIST } from '../constants/constants';
import {
  getCurrentSemester,
  getActiveDenormTimetable,
  getActiveTimetable } from '../reducers/root_reducer';
import * as ActionTypes from '../constants/actionTypes';

const DAY_MAP = {
  M: 'mo',
  T: 'tu',
  W: 'we',
  R: 'th',
  F: 'fr',
  S: 'sa',
  U: 'su',
};

export const getNextDayOfWeek = (date, dayOfWeek) => {
  const dayIndex = FULL_WEEK_LIST.indexOf(dayOfWeek);
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + ((7 + (dayIndex - date.getDay())) % 7));
  return resultDate;
};

export const receiveShareLink = shareLink => (dispatch) => {
  dispatch({
    type: ActionTypes.RECEIVE_SHARE_TIMETABLE_LINK,
    shareLink,
  });
};

export const fetchShareTimetableLink = () => (dispatch, getState) => {
  const state = getState();

  const semester = getCurrentSemester(state);
  const { shareLink, shareLinkValid } = state.calendar;
  dispatch({
    type: ActionTypes.REQUEST_SHARE_TIMETABLE_LINK,
  });
  if (shareLinkValid) {
    receiveShareLink(shareLink);
    return;
  }
  fetch(getRequestShareTimetableLinkEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      timetable: getActiveTimetable(state),
      semester,
    }),
    credentials: 'include',
  })
        .then(response => response.json())
        .then((ref) => {
          dispatch(receiveShareLink(`${window.location.href.split('/')[2]}/timetables/links/${ref.slug}`));
        });
};

export const addTTtoGCal = () => (dispatch, getState) => {
  const state = getState();

  if (!state.saveCalendarModal.isUploading && !state.saveCalendarModal.hasUploaded) {
    dispatch({ type: ActionTypes.UPLOAD_CALENDAR });
    fetch(getAddTTtoGCalEndpoint(), {
      headers: {
        'X-CSRFToken': Cookie.get('csrftoken'),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        timetable: getActiveDenormTimetable(state),
        semester: getCurrentSemester(state),
      }),
      credentials: 'include',
    })
      .then(response => response.json())
      .then(() => {
        dispatch({ type: ActionTypes.CALENDAR_UPLOADED });
      });
  }
};

export const createICalFromTimetable = () => (dispatch, getState) => {
  const state = getState();
  if (!state.saveCalendarModal.isDownloading && !state.saveCalendarModal.hasDownloaded) {
    dispatch({ type: ActionTypes.DOWNLOAD_CALENDAR });
    const cal = ical({ domain: 'https://semester.ly', name: 'My Semester Schedule' });
    const tt = getActiveDenormTimetable(state);

    // TODO - MUST BE REFACTORED AFTER CODED IN TO CONFIG
    let semStart = new Date();
    let semEnd = new Date();
    const semester = getCurrentSemester(state);

    if (semester.name === 'Fall') {
      // ignore year, year is set to current year
      semStart = new Date(`August 30 ${semester.year} 00:00:00`);
      semEnd = new Date(`December 20 ${semester.year} 00:00:00`);
    } else {
      // ignore year, year is set to current year
      semStart = new Date(`January 30 ${semester.year} 00:00:00`);
      semEnd = new Date(`May 20 ${semester.year} 00:00:00`);
    }

    semStart.setYear(new Date().getFullYear());
    semEnd.setYear(new Date().getFullYear());

    tt.slots.forEach((slot) => {
      const { course, section, offerings } = slot;
      const description = course.description || '';
      offerings.forEach((offering) => {
        const instructors = section.instructors && section.instructors.length > 0 ? `Taught by: ${section.instructors}\n` : '';
        const start = getNextDayOfWeek(semStart, offering.day);
        const [startHours, startMinutes] = offering.time_start.split(':');
        start.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));

        const end = getNextDayOfWeek(semStart, offering.day);
        const [endHours, endMinutes] = offering.time_end.split(':');
        end.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));

        const event = cal.createEvent({
          start,
          end,
          summary: `${course.name} ${course.code}${section.meeting_section}`,
          description: `${course.code + section.meeting_section}\n${instructors}${description}`,
          location: offering.location,
          url: getCourseShareLink(slot.code, getCurrentSemester(state)),
        });

        event.repeating({
          freq: 'WEEKLY',
          byDay: DAY_MAP[offering.day],
          until: getNextDayOfWeek(semEnd, offering.day),
        });
      });
    });

    const file = new Blob([cal.toString()], { type: 'data:text/calendar;charset=utf8,' });
    FileSaver.saveAs(file, 'my_semester.ics');
    fetch(getLogiCalEndpoint(), {
      method: 'POST',
      credentials: 'include',
    });
    dispatch({ type: ActionTypes.CALENDAR_DOWNLOADED });
  }
};
