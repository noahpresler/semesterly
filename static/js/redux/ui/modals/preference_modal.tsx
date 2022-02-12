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

import React, { useEffect, useRef } from "react";
// @ts-ignore
import { FadeModal } from "boron-15";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  preferencesActions,
  savePreferences,
} from "../../state/slices/preferencesSlice";

const PreferenceModal = () => {
  const { tryWithConflicts, showWeekend, isModalVisible } = useAppSelector(
    (state) => state.preferences
  );
  const modal = useRef<FadeModal>();
  useEffect(() => {
    if (modal.current) {
      if (isModalVisible) {
        modal.current.show();
      } else {
        modal.current.hide();
      }
    }
  }, [isModalVisible]);

  const modalHeader = (
    <div className="modal-content">
      <div className="modal-header">
        <h1>Timetable Preferences</h1>
      </div>
    </div>
  );
  const modalStyle = {
    width: "100%",
  };

  const dispatch = useAppDispatch();

  const onSave = () => {
    dispatch(savePreferences);
    dispatch(preferencesActions.hidePreferenceModal());
  };

  return (
    <FadeModal
      ref={modal}
      className="pref-modal max-modal"
      modalStyle={modalStyle}
      onHide={() => dispatch(preferencesActions.hidePreferenceModal())}
    >
      <div id="perf-modal-wrapper">
        {modalHeader}
        <div className="conflict-row">
          <div style={{ marginRight: "auto", marginLeft: "15%" }}>
            <p style={{ margin: 0 }}>Conflicts: </p>
          </div>
          <div style={{ marginLeft: "auto", marginRight: "10%" }}>
            <label className="switch switch-slide" htmlFor="with-conflicts">
              <input
                id="with-conflicts"
                className="switch-input"
                type="checkbox"
                checked={tryWithConflicts}
                onChange={() => dispatch(preferencesActions.toggleConflicts())}
              />
              <span className="switch-label" data-on="Enabled" data-off="Disabled" />
              <span className="switch-handle" />
            </label>
          </div>
        </div>
        <div className="conflict-row">
          <div style={{ marginRight: "auto", marginLeft: "15%" }}>
            <p style={{ margin: 0 }}>Show Weekends: </p>
          </div>
          <div style={{ marginLeft: "auto", marginRight: "10%" }}>
            <label className="switch switch-slide" htmlFor="show-weekend">
              <input
                id="show-weekend"
                className="switch-input"
                type="checkbox"
                checked={showWeekend}
                onChange={() => dispatch(preferencesActions.toggleShowWeekend())}
              />
              <span className="switch-label" data-on="Enabled" data-off="Disabled" />
              <span className="switch-handle" />
            </label>
          </div>
        </div>
        <hr style={{ marginTop: 0, width: "80%" }} />
        <div className="preference-footer">
          <button
            className="btn btn-primary"
            style={{ marginLeft: "auto", marginRight: "auto" }}
            onClick={onSave}
          >
            Save and Close
          </button>
        </div>
      </div>
    </FadeModal>
  );
};

export default PreferenceModal;
