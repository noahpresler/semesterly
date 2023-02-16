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

import "babel-polyfill";
import React from "react";
import store from "./state";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Semesterly from "./ui/Semesterly";
import {
  fetchMostClassmatesCount,
  handleAgreement,
  isRegistered,
} from "./actions/user_actions";
import {
  handleCreateNewTimetable,
  loadCachedTimetable,
  loadTimetable,
  lockTimetable,
} from "./actions/timetable_actions";
import { fetchSchoolInfo } from "./actions/school_actions";
import { fetchCourseClassmates } from "./actions/modal_actions";
import { userAcquisitionModalActions, userInfoActions } from "./state/slices";
import { receiveCourses } from "./actions/initActions";
import { browserSupportsLocalStorage } from "./util";
// import { addTTtoGCal } from './actions/calendar_actions';
import { initAllState, setCourseInfo } from "./actions";
import { timetablesActions } from "./state/slices/timetablesSlice";
import { saveCalendarModalActions } from "./state/slices/saveCalendarModalSlice";
import { togglePeerModal } from "./state/slices/peerModalSlice";

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

// handle feature flows
const handleFlows = (featureFlow) => (dispatch) => {
  switch (featureFlow.name) {
    case "SIGNUP":
      dispatch(userAcquisitionModalActions.triggerAcquisitionModal());
      break;
    case "USER_ACQ":
      dispatch(userAcquisitionModalActions.triggerAcquisitionModal());
      break;
    case "EXPORT_CALENDAR":
      dispatch(saveCalendarModalActions.triggerSaveCalendarModal());
      break;
    case "SHARE_TIMETABLE":
      dispatch(timetablesActions.cachedTimetableLoaded());
      // TODO: replace course objects in userInfo with course ids after storing in entities
      dispatch(receiveCourses(featureFlow.courses));
      if (initData.currentUser.isLoggedIn) {
        dispatch(handleCreateNewTimetable());
      }
      dispatch(lockTimetable(featureFlow.sharedTimetable));
      break;
    case "SHARE_COURSE":
      dispatch(setCourseInfo(featureFlow.sharedCourse));
      dispatch(fetchCourseClassmates(featureFlow.sharedCourse.id));
      break;
    case "FIND_FRIENDS":
      dispatch(togglePeerModal());
      break;
    case "DELETE_ACCOUNT":
      dispatch(userInfoActions.overrideSettingsShow(true));
      break;
    default:
      // unexpected feature name
      break;
  }
};

const setup = () => (dispatch) => {
  initData = JSON.parse(initData);

  dispatch(initAllState(initData));
  dispatch(receiveCourses(initData.currentUser.courses));
  dispatch(
    setupTimetables(
      initData.currentUser.timetables,
      initData.allSemesters,
      initData.oldSemesters
    )
  );

  if (initData.featureFlow.name === null) {
    dispatch(
      handleAgreement(
        initData.currentUser,
        Date.parse(initData.latestAgreement.timeUpdated)
      )
    );
  }

  dispatch(handleFlows(initData.featureFlow));
  dispatch(fetchSchoolInfo());
};

store.dispatch(setup());

render(
  <Provider store={store}>
    <DndProvider backend={HTML5Backend}>
      <Semesterly />
    </DndProvider>
  </Provider>,
  document.getElementsByClassName("page")[0]
);
