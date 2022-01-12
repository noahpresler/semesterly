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

import * as ActionTypes from "../constants/actionTypes";

const saveCalendarModal = (
  state = {
    isVisible: false,
    hasDownloaded: false,
    hasUploaded: true,
    isDownloading: false,
    isUploading: true,
  },
  action
) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_SAVE_CALENDAR_MODAL:
      return { isVisible: !state.isVisible };
    case ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL:
      return {
        isVisible: true,
        hasUploaded: false,
        hasDownloaded: false,
        isDownloading: false,
        isUploading: false,
      };
    case ActionTypes.DOWNLOAD_CALENDAR:
      return Object.assign({}, state, { isDownloading: true });
    case ActionTypes.UPLOAD_CALENDAR:
      return Object.assign({}, state, { isUploading: true });
    case ActionTypes.CALENDAR_DOWNLOADED:
      return Object.assign({}, state, { hasDownloaded: true });
    case ActionTypes.CALENDAR_UPLOADED:
      return Object.assign({}, state, { hasUploaded: true });
    default:
      return state;
  }
};

export default saveCalendarModal;
