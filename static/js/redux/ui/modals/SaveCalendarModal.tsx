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

import React from "react";
import { createICalFromTimetable } from "../../actions";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { saveCalendarModalActions } from "../../state/slices/saveCalendarModalSlice";
import Modal from "./Modal";

const SaveCalendarModal = () => {
  const isVisible = useAppSelector((state) => state.saveCalendarModal.isVisible);
  const isDownloading = useAppSelector(
    (state) => state.saveCalendarModal.isDownloading
  );
  const hasDownloaded = useAppSelector(
    (state) => state.saveCalendarModal.hasDownloaded
  );
  const dispatch = useAppDispatch();

  const modalHeader = (
    <div className="modal-header">
      <div
        className="header-pic"
        style={{ backgroundImage: "url(/static/img/addtocalendarfeature.png)" }}
      />
      <h1>Export calendar</h1>
      <div
        className="modal-close"
        onClick={() => dispatch(saveCalendarModalActions.toggleSaveCalendarModal())}
      >
        <i className="fa fa-times" />
      </div>
    </div>
  );

  let DownloadIcon = <i className="fa fa-download" />;
  DownloadIcon = isDownloading ? <div className="loader" /> : DownloadIcon;
  DownloadIcon = hasDownloaded ? <i className="done fa fa-check" /> : DownloadIcon;

  return (
    <Modal
      visible={isVisible}
      className="save-calendar-modal abnb-modal max-modal"
      customStyles={{ height: "300px", width: "450px" }}
      onClose={() => {
        dispatch(saveCalendarModalActions.toggleSaveCalendarModal());
        history.replaceState({}, "Semester.ly", "/");
      }}
    >
      {modalHeader}
      <div className="save-calendar-modal__container">
        <button
          className="btn abnb-btn secondary"
          onClick={() => {
            dispatch(createICalFromTimetable());
          }}
        >
          <span className="img-icon">{DownloadIcon}</span>
          <span>Download Calendar</span>
        </button>
        <p className="method-details">
          Downloads a .ics file which can be uploaded to Google Calendar, loaded into
          iCal., or any other calendar application.
        </p>
      </div>
    </Modal>
  );
};

export default SaveCalendarModal;
