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
import { deleteTimetable } from "../../actions";
import { alertsActions } from "../../state/slices";
import { useAppDispatch, useAppSelector } from "../../hooks";

const DeleteTimetableAlert = () => {
  const dispatch = useAppDispatch();
  const timetable = useAppSelector((state) => state.alerts.timetableToDelete);

  useEffect(
    // cleanup on unmount
    () => () => {
      dispatch(alertsActions.dismissDeleteTimetable());
    },
    []
  );

  const handleConfirm = () => {
    dispatch(deleteTimetable(timetable));
    dispatch(alertsActions.dismissDeleteTimetable());
  };

  const handleCancel = () => {
    dispatch(alertsActions.dismissDeleteTimetable());
  };

  return (
    <div className="delete-timetable-alert">
      Are you sure you want to delete this timetable?
      <button onClick={() => handleConfirm()} className="delete-timetable-alert-btn">
        Confirm
      </button>
    </div>
  );
};

export default DeleteTimetableAlert;
