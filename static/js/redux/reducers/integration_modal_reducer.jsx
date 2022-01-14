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

import * as ActionTypes from '../constants/actionTypes';

const initialState = {
  isVisible: false,
  id: null,
  enabled: false,
  integration_id: null,
  studentIntegrations: [],
};

const integrationModal = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_INTEGRATION_MODAL:
      return Object.assign({}, state, { isVisible: !state.isVisible, id: action.id });
    case ActionTypes.OPEN_INTEGRATION_MODAL:
      return Object.assign({}, state, {
        enabled: action.enabled,
        isVisible: true,
        id: action.id,
        integration_id: action.integration_id,
      });
    default:
      return state;
  }
};

export default integrationModal;
