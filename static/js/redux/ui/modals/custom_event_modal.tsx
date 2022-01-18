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

// @ts-ignore
import { DropModal } from "boron-15";
import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { customEventsActions } from "../../state/slices/customEventsSlice";

const CustomEventModal = () => {
  const isVisible = useAppSelector((state) => state.customEvents.isModalVisible);
  const modal = useRef<DropModal>();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isVisible && modal.current) {
      modal.current.show();
    }
  }, [isVisible]);

  const modalHeader = (
    <div className="modal-content">
      <div className="modal-header">
        <h1>Edit Custom Event</h1>
      </div>
    </div>
  );

  const modalStyle = {
    width: "100%",
  };

  const dispatch = useAppDispatch();

  const createLabel = (name: string, label: string) => (
    <label htmlFor={name}>{label}</label>
  );

  const createTextInput = (
    name: string,
    value: string,
    validator?: (newValue: string) => boolean,
    messageIfInvalid?: string
  ) => (
    <div className="input-text-field">
      <input
        id={name}
        type="text"
        value={value}
        onChange={(e) => {
          if (validator && !validator(e.target.value)) {
            setErrorMessage(messageIfInvalid || "Invalid input");
          }
        }}
      />
    </div>
  );

  const editCustomEventForm = (
    <form className="edit-custom-event-form">
      <div className="event-form-items">
        <div className="event-labels">
          {createLabel("event-name", "Event Name:")}
          {createLabel("event-location", "Location:")}
          {createLabel("event-color", "Color:")}
          {createLabel("event-start-time", "Start Time:")}
          {createLabel("event-end-time", "End Time:")}
        </div>
        <div className="event-text-inputs">
          {createTextInput("event-name", "New Custom Event")}
          {createTextInput("event-location", "")}
          {createTextInput("event-color", "#F8F6F7")}
          {createTextInput("event-start-time", "08:30")}
          {createTextInput("event-end-time", "09:30")}
        </div>
      </div>
      <p>{errorMessage}</p>
      <button className="btn btn-primary">Save</button>
    </form>
  );

  return (
    <DropModal
      ref={modal}
      className="custom-event-modal"
      modalStyle={modalStyle}
      onHide={() => {
        dispatch(customEventsActions.hideCustomEventsModal());
      }}
    >
      {modalHeader}
      {editCustomEventForm}
    </DropModal>
  );
};

export default CustomEventModal;
