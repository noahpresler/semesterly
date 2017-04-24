import {
    getAddTTtoGCalEndpoint,
    getLogFinalExamViewEndpoint,
    getLogiCalEndpoint,
    getRequestShareTimetableLinkEndpoint,
} from '../constants/endpoints';
import { FULL_WEEK_LIST } from '../constants/constants';
import { getActiveTimetable } from './user_actions';
import { store } from '../init';
import ical from 'ical-generator';
import { getCourseShareLink } from '../helpers/timetable_helpers';
import FileSaver from 'browser-filesaver';
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

function getNextDayOfWeek(date, dayOfWeek) {
  dayOfWeek = FULL_WEEK_LIST.indexOf(dayOfWeek);
  const resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
  return resultDate;
}

function receiveShareLink(dispatch, shareLink) {
  dispatch({
    type: ActionTypes.RECEIVE_SHARE_TIMETABLE_LINK,
    shareLink,
  });
}

export const logFinalExamView = () => (dispatch) => {
  fetch(getLogFinalExamViewEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
};

export function fetchShareTimetableLink() {
  return (dispatch) => {
    const state = store.getState();
    const semester = allSemesters[state.semesterIndex];
    const timetableState = state.timetables;
    const { shareLink, shareLinkValid } = state.calendar;
    dispatch({
      type: ActionTypes.REQUEST_SHARE_TIMETABLE_LINK,
    });
    if (shareLinkValid) {
      receiveShareLink(store.dispatch, shareLink);
      return;
    }
    fetch(getRequestShareTimetableLinkEndpoint(), {
      method: 'POST',
      body: JSON.stringify({
        timetable: getActiveTimetable(timetableState),
        semester,
      }),
      credentials: 'include',
    })
            .then(response => response.json())
            .then((ref) => {
              receiveShareLink(store.dispatch,
                    `${window.location.href.split('/')[2]}/share/${ref.link}`);
            });
  };
}

export function addTTtoGCal() {
  return (dispatch) => {
    gcalCallback = false;
    const state = store.getState();
    const timetableState = state.timetables;
        // Wait for timetable to load
    if (gcalCallback) {
      while (state.timetables.items.length <= 0) {
      }
    }
    if (!state.saveCalendarModal.isUploading && !state.saveCalendarModal.hasUploaded) {
      dispatch({ type: ActionTypes.UPLOAD_CALENDAR });
      fetch(getAddTTtoGCalEndpoint(), {
        method: 'POST',
        body: JSON.stringify({
          timetable: getActiveTimetable(timetableState),
        }),
        credentials: 'include',
      })
                .then(response => response.json())
                .then((json) => {
                  dispatch({ type: ActionTypes.CALENDAR_UPLOADED });
                });
    }
  };
}

export const createICalFromEventsList = (events, icalTitle) => (dispatch) => {
  let state = store.getState();
  if (!state.saveCalendarModal.isDownloading && !state.saveCalendarModal.hasDownloaded) {
  let cal = ical({domain: 'https://semester.ly', name: icalTitle});
  dispatch({type: ActionTypes.DOWNLOAD_CALENDAR});
    for (let i = 0; i < events.length; i++){
      let repeating = events[i].repeating;
      delete(events[i].repeating);
      let currentEvent = cal.createEvent(events[i]);
      if (repeating != null) {
        console.log(repeating);
        currentEvent.repeating(repeating);
      }
    }
    const file = new Blob([cal.toString()], {type: "data:text/calendar;charset=utf8,"});
    FileSaver.saveAs(file, "my_semester.ics");
    fetch(getLogiCalEndpoint(), {
      method: 'POST',
      credentials: 'include',
    })
    dispatch({type: ActionTypes.CALENDAR_DOWNLOADED});
  }
}


export const createICalFromTimetable = (active) => (dispatch) => {
  let state = store.getState();
  let event_list = [];  
  if (!state.saveCalendarModal.isDownloading && !state.saveCalendarModal.hasDownloaded) {
    let cal = ical({domain: 'https://semester.ly', name: 'My Semester Schedule'});
    let tt = getActiveTimetable(state.timetables);

    //TODO - MUST BE REFACTORED AFTER CODED IN TO CONFIG
    let sem_start = new Date()
    let sem_end = new Date()
    let semester = allSemesters[state.semesterIndex]
    if (semester.name == 'Fall') {
      //ignore year, year is set to current year
      sem_start = new Date('August 30 ' + semester.year + ' 00:00:00');
      sem_end = new Date('December 20 ' + semester.year + ' 00:00:00');
    } else {
      //ignore year, year is set to current year
      sem_start = new Date('January 30 ' + semester.year + ' 00:00:00');
      sem_end = new Date('May 20 ' + semester.year + ' 00:00:00');
    }
    sem_start.setYear(new Date().getFullYear());
    sem_end.setYear(new Date().getFullYear());
    for (let c_idx = 0; c_idx < tt.courses.length; c_idx++) {
      for (let slot_idx = 0; slot_idx < tt.courses[c_idx].slots.length; slot_idx++) {
        const course = tt.courses[c_idx];
        const slot = course.slots[slot_idx];
        const instructors = slot.instructors && slot.instructors.length > 0 ? `Taught by: ${slot.instructors}\n` : '';
        const start = getNextDayOfWeek(sem_start, slot.day);
        const end = getNextDayOfWeek(sem_start, slot.day);
        const until = getNextDayOfWeek(sem_end, slot.day);
        const description = course.description ? course.description : '';
        let times = slot.time_start.split(':');
        start.setHours(parseInt(times[0], 10), parseInt(times[1], 10));
        times = slot.time_end.split(':');
        end.setHours(parseInt(times[0], 10), parseInt(times[1], 10));

        let repeating = {
          freq: 'WEEKLY',
          byDay: DAY_MAP[slot.day],
          until: until,
        }

        let event = {
          start: start,
          end: end,
          summary: slot.name + " " + slot.code + slot.meeting_section,
          description: slot.code + slot.meeting_section + '\n' + instructors + description,
          location: slot.location,
          url: getCourseShareLink(slot.code),
          repeating: repeating,
        };
        event_list.push(event);
      }
    }
  }
  dispatch(createICalFromEventsList(event_list, "myical"));
}
