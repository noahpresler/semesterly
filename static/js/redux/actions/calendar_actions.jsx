import ical from 'ical-generator';
import Cookie from 'js-cookie';
import FileSaver from 'browser-filesaver';
import {
    getAddTTtoGCalEndpoint,
    getLogiCalEndpoint,
    getRequestShareTimetableLinkEndpoint,
} from '../constants/endpoints';
import { FULL_WEEK_LIST } from '../constants/constants';
import { getActiveTimetable } from './user_actions';
import { getCourseShareLink } from '../helpers/timetable_helpers';
import { currSem } from '../reducers/semester_reducer';
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
  const semester = currSem(state.semester);
  const timetableState = state.timetables;
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
      timetable: getActiveTimetable(timetableState),
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
  const timetableState = state.timetables;

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
        timetable: getActiveTimetable(timetableState),
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
    const tt = getActiveTimetable(state.timetables);

    // TODO - MUST BE REFACTORED AFTER CODED IN TO CONFIG
    let semStart = new Date();
    let semEnd = new Date();
    const semester = currSem(state.semester);

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

    for (let cIdx = 0; cIdx < tt.courses.length; cIdx++) {
      for (let slotIdx = 0; slotIdx < tt.courses[cIdx].slots.length; slotIdx++) {
        const course = tt.courses[cIdx];
        const slot = course.slots[slotIdx];
        const instructors = slot.instructors && slot.instructors.length > 0 ? `Taught by: ${slot.instructors}\n` : '';
        const start = getNextDayOfWeek(semStart, slot.day);
        const end = getNextDayOfWeek(semStart, slot.day);
        const until = getNextDayOfWeek(semEnd, slot.day);

        let times = slot.time_start.split(':');
        start.setHours(parseInt(times[0], 10), parseInt(times[1], 10));
        times = slot.time_end.split(':');
        end.setHours(parseInt(times[0], 10), parseInt(times[1], 10));
        const description = course.description ? course.description : '';

        const event = cal.createEvent({
          start,
          end,
          summary: `${slot.name} ${slot.code}${slot.meeting_section}`,
          description: `${slot.code + slot.meeting_section}\n${instructors}${description}`,
          location: slot.location,
          url: getCourseShareLink(slot.code, currSem(state.semester)),
        });

        event.repeating({
          freq: 'WEEKLY',
          byDay: DAY_MAP[slot.day],
          until,
        });
      }
    }
    const file = new Blob([cal.toString()], { type: 'data:text/calendar;charset=utf8,' });
    FileSaver.saveAs(file, 'my_semester.ics');
    fetch(getLogiCalEndpoint(), {
      method: 'POST',
      credentials: 'include',
    });
    dispatch({ type: ActionTypes.CALENDAR_DOWNLOADED });
  }
};
