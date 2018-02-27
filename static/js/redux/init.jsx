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

import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import rootReducer from './reducers/root_reducer';
import SemesterlyContainer from './ui/containers/semesterly_container';
import { fetchMostClassmatesCount, handleAgreement, isRegistered } from './actions/user_actions';
import {
  handleCreateNewTimetable, loadCachedTimetable, loadTimetable,
  lockTimetable,
} from './actions/timetable_actions';
import { fetchSchoolInfo } from './actions/school_actions';
import { fetchCourseClassmates, setCourseInfo } from './actions/modal_actions';
import { receiveCourses } from './actions/search_actions';
import {
    browserSupportsLocalStorage,
    setFirstVisit,
    setFriendsCookie,
    timeLapsedGreaterThan,
    timeLapsedInDays,
} from './util';
import { addTTtoGCal } from './actions/calendar_actions';
import * as ActionTypes from './constants/actionTypes';

const store = createStore(rootReducer,
    window.devToolsExtension && window.devToolsExtension(),
    applyMiddleware(thunkMiddleware),
);

// load initial timetable from user data if logged in or local storage
const setupTimetables = (userTimetables, allSemesters, oldSemesters) => (dispatch) => {
  if (userTimetables.length > 0) {
    const activeTimetable = userTimetables[0];
    dispatch(loadTimetable(activeTimetable));
    setTimeout(() => {
      dispatch(fetchMostClassmatesCount(activeTimetable));
    }, 500);
  } else if (browserSupportsLocalStorage()) {
    dispatch(loadCachedTimetable(allSemesters, oldSemesters));
    dispatch({ type: ActionTypes.CACHED_TT_LOADED });
  }
};

// Possibly ask user to enable notifications based on visit pattern
const setupChromeNotifs = () => (dispatch) => {
  dispatch(isRegistered());

  const declinedNotifications = localStorage.getItem('declinedNotifications');
  const firstVisit = localStorage.getItem('firstVisit');

  const isFirstVisit = firstVisit === null;
  const isSecondVisit = declinedNotifications === null;

  const daysSinceFirstVisit = timeLapsedInDays(firstVisit);
  const userHasActed = declinedNotifications === 'true' || declinedNotifications === 'false';

  if (isFirstVisit) {
    const time = new Date();
    setFirstVisit(time.getTime());
  } else if ((isSecondVisit && daysSinceFirstVisit > 1) || (!isSecondVisit && !userHasActed)) {
    dispatch({ type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS });
  }
};

// possible show friend alert based on visit pattern
const showFriendAlert = () => (dispatch) => {
  const friendsCookie = localStorage.getItem('friendsCookie');
  const isFirstVisit = friendsCookie === null;

  if (isFirstVisit || timeLapsedGreaterThan(friendsCookie, 3)) {
    const time = new Date();
    setFriendsCookie(time.getTime());
    dispatch({ type: ActionTypes.ALERT_FACEBOOK_FRIENDS });
  }
};

const handleFlows = featureFlow => (dispatch) => {
  switch (featureFlow.name) {
    case 'SIGNUP':
      dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
      break;
    case 'USER_ACQ':
      dispatch({ type: ActionTypes.TRIGGER_ACQUISITION_MODAL });
      break;
    case 'GCAL_CALLBACK':
      // hide settings info modal until user is finished adding to gcal
      dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: true });
      dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: false });
      dispatch(addTTtoGCal());
      break;
    case 'EXPORT_CALENDAR':
      dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      break;
    case 'SHARE_TIMETABLE':
      dispatch({ type: ActionTypes.CACHED_TT_LOADED });
      // TODO: replace course objects in userInfo with course ids after storing in entities
      dispatch(receiveCourses(featureFlow.courses));
      if (initData.currentUser.isLoggedIn) {
        dispatch(handleCreateNewTimetable());
      }
      dispatch(lockTimetable(featureFlow.sharedTimetable));
      break;
    case 'SHARE_EXAM':
      dispatch({ type: ActionTypes.SET_FINAL_EXAMS_SHARED });
      dispatch({
        type: ActionTypes.RECEIVE_FINAL_EXAMS,
        json: featureFlow.exam,
      });
      dispatch({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });
      break;
    case 'VIEW_TEXTBOOKS':
      dispatch({ type: ActionTypes.TRIGGER_TEXTBOOK_MODAL });
      break;
    case 'SHARE_COURSE':
      dispatch(setCourseInfo(featureFlow.sharedCourse));
      dispatch(fetchCourseClassmates(featureFlow.sharedCourse.id));
      break;
    case 'FIND_FRIENDS':
      dispatch({ type: ActionTypes.TOGGLE_PEER_MODAL });
      break;
    case 'ENABLE_NOTFIS':
      dispatch({ type: ActionTypes.SET_HIGHLIGHT_NOTIFS, highlightNotifs: true });
      if (!initData.currentUser.isLoggedIn) {
        dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
      } else {
        dispatch({
          type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
          data: true,
        });
      }
      break;
    case 'FINAL_EXAMS':
      dispatch({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });
      break;
    case 'EXPORT_SIS_TIMETABLE':
      dispatch({ type: ActionTypes.EXPORT_SIS_TIMETABLE });
      break;
    default:
      // unexpected feature name
      break;
  }
};

const setup = () => (dispatch) => {
  initData = JSON.parse(initData);

  dispatch({ type: ActionTypes.INIT_STATE, data: initData });

  dispatch(receiveCourses(initData.currentUser.courses));
  dispatch(setupTimetables(initData.currentUser.timetables, initData.allSemesters,
    initData.oldSemesters));

  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    dispatch(setupChromeNotifs());
  }
  dispatch(showFriendAlert());

  if (initData.featureFlow.name === null) {
    dispatch(handleAgreement(initData.currentUser, Date.parse(initData.timeUpdatedTos)));
  }

  dispatch(handleFlows(initData.featureFlow));
  dispatch(fetchSchoolInfo());
};

store.dispatch(
    setup(),
);

render(
  <Provider store={store}>
    <SemesterlyContainer />
  </Provider>, document.getElementsByClassName('page')[0]);
