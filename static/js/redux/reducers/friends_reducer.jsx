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

const friends = (state = { peers: [], isFetching: false }, action) => {
  switch (action.type) {
    case ActionTypes.FRIENDS_RECEIVED:
      return Object.assign({}, state, { peers: action.peers, isFetching: false });
    case ActionTypes.REQUEST_FRIENDS:
      return Object.assign({}, state, { isFetching: true });
    default:
      return state;
  }
};

export default friends;
