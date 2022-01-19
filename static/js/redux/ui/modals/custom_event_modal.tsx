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
  const [eventName, setEventName] = useState("New Custom Event");
  const [eventLocation, setEventLocation] = useState("");
  const [eventColor, setEventColor] = useState("#F8F6F7");
  const [eventStartTime, setEventStartTime] = useState("08:30");
  const [eventEndTime, setEventEndTime] = useState("09:30");
  const [eventCredits, setEventCredits] = useState("0");
  const [errorMessage, setErrorMessage] = useState("Error message");

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
    <label htmlFor={name}>
      <span>{label}</span>
    </label>
  );

  const createTextInput = (
    name: string,
    value: string,
    setter: (newValue: string) => void,
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
          setter(e.target.value);
          setErrorMessage("")
        }}
      />
    </div>
  );

  const eventNameValidator = (newValue: string) => newValue.length <= 50;
  const eventLocationValidator = (newValue: string) => newValue.length <= 50;
  const eventColorValidator = (newValue: string) => /^#[0-9A-F]{6}$/i.test(newValue);
  const eventTimeValidator = (newValue: string) => /^[0-9]{2}:[0-9]{2}$/.test(newValue);
  const eventCreditsValidator = (newValue: string) =>
    /^[0-9]{1,2}(.5)?$/.test(newValue);

  const editCustomEventForm = (
    <form className="edit-custom-event-form">
      <div className="event-form-items">
        <div className="event-labels">
          {createLabel("event-name", "Name:")}
          {createLabel("event-location", "Location:")}
          {createLabel("event-color", "Color:")}
          {createLabel("event-start-time", "Start Time:")}
          {createLabel("event-end-time", "End Time:")}
          {createLabel("event-credits", "Credits:")}
        </div>
        <div className="event-text-inputs">
          {createTextInput(
            "event-name",
            eventName,
            setEventName,
            eventNameValidator,
            "Event name must be less than or equal to 50 characters"
          )}
          {createTextInput(
            "event-location",
            eventLocation,
            setEventLocation,
            eventLocationValidator,
            "Event location must be less than or equal to 50 characters"
          )}
          {createTextInput(
            "event-color",
            eventColor,
            setEventColor,
            eventColorValidator,
            "Event color must be a valid hex color"
          )}
          {createTextInput(
            "event-start-time",
            eventStartTime,
            setEventStartTime,
            eventTimeValidator,
            "Event start time must be in the format HH:MM"
          )}
          {createTextInput(
            "event-end-time",
            eventEndTime,
            setEventEndTime,
            eventTimeValidator,
            "Event end time must be in the format HH:MM"
          )}
          {createTextInput(
            "event-credits",
            eventCredits,
            setEventCredits,
            eventCreditsValidator,
            "Event credits must be a number between 0 and 99.5"
          )}
        </div>
      </div>
      <p>{errorMessage}</p>
      <button className="btn btn-primary save-button">
        <span>Save</span>
      </button>
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
