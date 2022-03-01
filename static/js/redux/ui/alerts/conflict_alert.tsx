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

import React, { useEffect } from "react";
import { useAppDispatch } from "../../hooks";
import { alertsActions } from "../../state/slices";
import { preferencesActions } from "../../state/slices/preferencesSlice";
import { addLastAddedCourse } from "../../actions/timetable_actions";

const ConflictAlert = () => {
  const dispatch = useAppDispatch();

  useEffect(
    // cleanup on unmount
    () => () => {
      dispatch(alertsActions.dismissAlertConflict());
    },
    []
  );

  const handleClick = () => {
    dispatch(preferencesActions.toggleConflicts());
    dispatch(preferencesActions.savePreferences());
    dispatch(addLastAddedCourse());
    dispatch(alertsActions.dismissAlertConflict());
  };

  return (
    <div className="conflict-alert">
      Adding that course causes a conflict!
      <button onClick={() => handleClick()} className="conflict-alert-btn">
        Allow Conflicts!
      </button>
    </div>
  );
};

export default ConflictAlert;
