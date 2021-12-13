import { createAction } from '@reduxjs/toolkit';

export * from './calendar_actions';
export * from './exam_actions';
export * from './modal_actions';
export * from './school_actions';
export * from './search_actions';
export * from './timetable_actions';
export * from './user_actions';


// the INIT_STATE action typed version
export const initAllState = createAction('global/init');
// action that alerts there is a timetable conflict
export const alertConflict = createAction('global/alertConflict');
// ALERT_TIMETABLE_EXISTS
export const alertTimeTableExists = createAction('global/alertTimeTableExists');