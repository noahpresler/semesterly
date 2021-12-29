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
import store from './state';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import SemesterlyContainer from './ui/containers/semesterly_container';
import { fetchMostClassmatesCount, handleAgreement, isRegistered } from './actions/user_actions';
import {
  handleCreateNewTimetable, loadCachedTimetable, loadTimetable,
  lockTimetable,
} from './actions/timetable_actions';
import { fetchSchoolInfo } from './actions/school_actions';
import { fetchCourseClassmates } from './actions/modal_actions';
import { alertsActions, userAcquisitionModalActions, userInfoActions } from './state/slices';
import { receiveCourses } from './actions/initActions';
import {
  browserSupportsLocalStorage,
  setFirstVisit,
  setFriendsCookie,
  timeLapsedGreaterThan,
  timeLapsedInDays,
} from './util';
// import { addTTtoGCal } from './actions/calendar_actions';
import * as ActionTypes from './constants/actionTypes';
import { initAllState, setCourseInfo } from './actions';
import { timetablesActions } from './state/slices/timetablesSlice';


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
    dispatch(timetablesActions.cachedTimetableLoaded());
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
    dispatch(alertsActions.alertEnableNotifications());
  }
};

// possible show friend alert based on visit pattern
const showFriendAlert = () => (dispatch) => {
  const friendsCookie = localStorage.getItem('friendsCookie');
  const isFirstVisit = friendsCookie === null;

  if (isFirstVisit || timeLapsedGreaterThan(friendsCookie, 3)) {
    const time = new Date();
    setFriendsCookie(time.getTime());
    dispatch(alertsActions.alertFacebookFriends());
  }
};

const handleFlows = featureFlow => (dispatch) => {
  switch (featureFlow.name) {
    case 'SIGNUP':
      dispatch(userAcquisitionModalActions.triggerAcquisitionModal());
      break;
    case 'USER_ACQ':
      dispatch(userAcquisitionModalActions.triggerAcquisitionModal());
      break;
    // case 'GCAL_CALLBACK':
      // hide settings info modal until user is finished adding to gcal
      // dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: true });
      // dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      // dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: false });
      // dispatch(addTTtoGCal());
      // break;
    case 'EXPORT_CALENDAR':
      dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      break;
    case 'SHARE_TIMETABLE':
      dispatch(timetablesActions.cachedTimetableLoaded());
      // TODO: replace course objects in userInfo with course ids after storing in entities
      dispatch(receiveCourses(featureFlow.courses));
      if (initData.currentUser.isLoggedIn) {
        dispatch(handleCreateNewTimetable());
      }
      dispatch(lockTimetable(featureFlow.sharedTimetable));
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
        dispatch(userInfoActions.overrideSettingsShow(true));
      }
      break;
    case 'EXPORT_SIS_TIMETABLE':
      dispatch({ type: ActionTypes.EXPORT_SIS_TIMETABLE });
      break;
    case 'DELETE_ACCOUNT':
      dispatch(userInfoActions.overrideSettingsShow(true));
      break;
    default:
      // unexpected feature name
      break;
  }
};

const setup = () => (dispatch) => {
  initData = JSON.parse(initData);

  dispatch({ type: ActionTypes.INIT_STATE, data: initData });
  dispatch(initAllState(initData));
  dispatch(receiveCourses(initData.currentUser.courses));
  dispatch(setupTimetables(initData.currentUser.timetables, initData.allSemesters,
    initData.oldSemesters));

  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    dispatch(setupChromeNotifs());
  }
  dispatch(showFriendAlert());

  if (initData.featureFlow.name === null) {
    dispatch(handleAgreement(
      initData.currentUser,
      Date.parse(initData.latestAgreement.timeUpdated)));
  }

  dispatch(handleFlows(initData.featureFlow));
  dispatch(fetchSchoolInfo());
};

store.dispatch(
  setup(),
);

render(
  <Provider store={store}>
    <DndProvider backend={HTML5Backend}>
      <SemesterlyContainer />
    </DndProvider>
  </Provider>,
  document.getElementsByClassName('page')[0],
);
