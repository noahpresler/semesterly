/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import * as ActionTypes from '../constants/actionTypes';

const termsOfServiceBanner = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case ActionTypes.TRIGGER_TOS_BANNER:
      return { isVisible: true };
    case ActionTypes.DISMISS_TOS_BANNER:
      return { isVisible: false };
    default:
      return state;
  }
};

export default termsOfServiceBanner;
