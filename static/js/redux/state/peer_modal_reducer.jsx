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

const peerModal = (state = { isVisible: false, isLoading: false }, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_PEER_MODAL:
      return { ...state, isVisible: !state.isVisible };
    case ActionTypes.PEER_MODAL_LOADING:
      return { ...state, isLoading: true };
    case ActionTypes.PEER_MODAL_LOADED:
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export default peerModal;
