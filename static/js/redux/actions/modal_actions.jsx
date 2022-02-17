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

import fetch from "isomorphic-fetch";
import Cookie from "js-cookie";
import {
  getClassmatesInCourseEndpoint,
  getCourseInfoEndpoint,
  getReactToCourseEndpoint,
} from "../constants/endpoints";
import { getSchool, getSemester } from "../actions/school_actions";
import * as ActionTypes from "../constants/actionTypes";
import { courseInfoActions } from "../state/slices";
import { setCourseReactions, setCourseInfo } from "./initActions";

export const fetchCourseClassmates = (courseId) => (dispatch, getState) => {
  const state = getState();
  fetch(getClassmatesInCourseEndpoint(getSchool(state), getSemester(state), courseId), {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((json) => {
      dispatch(courseInfoActions.courseClassmatesReceived(json));
    });
};

export const fetchCourseInfo = (courseId) => (dispatch, getState) => {
  dispatch(courseInfoActions.requestCourseInfo());
  fetch(getCourseInfoEndpoint(courseId, getSemester(getState())), {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((json) => {
      dispatch(setCourseInfo(json));
    });
  dispatch(fetchCourseClassmates(courseId));
};

export const react = (cid, title) => (dispatch) => {
  fetch(getReactToCourseEndpoint(), {
    headers: {
      "X-CSRFToken": Cookie.get("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      cid,
      title,
    }),
    credentials: "include",
  })
    .then((response) => response.json())
    .then((json) => {
      if (!json.error) {
        dispatch(
          setCourseReactions({
            id: cid,
            reactions: json.reactions,
          })
        );
      }
    });
};

export const togglePeerModal = () => ({ type: ActionTypes.TOGGLE_PEER_MODAL });
