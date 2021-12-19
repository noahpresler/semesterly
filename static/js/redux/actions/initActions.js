import { createAction } from '@reduxjs/toolkit';

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
