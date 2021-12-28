import { createAction } from '@reduxjs/toolkit';
import { normalize } from 'normalizr';
import { courseSchema } from '../schema';

// the INIT_STATE action typed version
export const initAllState = createAction('global/init');

export const alertConflict = createAction('global/alertConflict');

// ALERT_TIMETABLE_EXISTS
export const alertTimeTableExists = createAction('global/alertTimeTableExists');

export const NEW_changeActiveTimeTable = createAction(
  'global/chanegActiveTimeTable',
);

export const NEW_receiveTimetables = createAction(
  'global/RECEIVE_TIMETABLES',
);

// course related actions

/**
 * action creator that normalizes `courseInfo`
 * into `offering_set`, `sections`, `courses`
 * and processed within entities reducer
 */
export const setCourseInfo = createAction(
  'global/setCourseInfo',
  courseInfo => ({
    payload: normalize(courseInfo, courseSchema),
  }),
);

export const setCourseReactions = createAction(
  'global/setCourseReactions',
);
