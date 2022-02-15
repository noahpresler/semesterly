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
import { preferencesActions } from "../../state/slices/preferencesSlice";
import { saveLocalPreferences } from "../../util";

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

  const isLoggedIn = useAppSelector((state) => state.userInfo.data.isLoggedIn);

  const dispatch = useAppDispatch();

  const onSave = () => {
    if (isLoggedIn) {
      dispatch(preferencesActions.savePreferences());
    } else {
      saveLocalPreferences({ tryWithConflicts, showWeekend });
    }
    dispatch(preferencesActions.hidePreferenceModal());
  };

  const createPreferenceRow = (
    label: string,
    name: string,
    checked: boolean,
    onChange: () => void
  ) => (
    <div className="preference-row">
      <div style={{ marginRight: "auto", marginLeft: "15%" }}>
        <p style={{ margin: 0 }}>{label}</p>
      </div>
      <div style={{ marginLeft: "auto", marginRight: "10%" }}>
        <label className="switch switch-slide" htmlFor={name}>
          <input
            id={name}
            className="switch-input"
            type="checkbox"
            checked={checked}
            onChange={() => onChange()}
          />
          <span className="switch-label" data-on="Enabled" data-off="Disabled" />
          <span className="switch-handle" />
        </label>
      </div>
    </div>
  );

  return (
    <FadeModal
      ref={modal}
      className="pref-modal max-modal"
      modalStyle={modalStyle}
      onHide={() => dispatch(preferencesActions.hidePreferenceModal())}
    >
      <div id="perf-modal-wrapper">
        {modalHeader}
        {createPreferenceRow(
          "Allow Conflicts:",
          "with-conflicts",
          tryWithConflicts,
          () => {
            dispatch(preferencesActions.toggleConflicts());
          }
        )}
        {createPreferenceRow("Show Weekends:", "show-weekends", showWeekend, () => {
          dispatch(preferencesActions.toggleShowWeekend());
        })}
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
    </FadeModal>
  );
};

export default PreferenceModal;
