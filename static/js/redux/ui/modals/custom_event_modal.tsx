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
import { WaveModal } from "boron-15";
import React, { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { customEventsActions } from "../../state/slices/customEventsSlice";

const CustomEventModal = () => {
  const isVisible = useAppSelector((state) => state.customEvents.isModalVisible);
  const modal = useRef<WaveModal>();

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

  return (
    <WaveModal
      ref={modal}
      className="custom-event-modal abnb-modal max-modal"
      modalStyle={modalStyle}
      onHide={() => {
        dispatch(customEventsActions.hideCustomEventsModal());
      }}
    >
      {modalHeader}
      <h1>Hello World!</h1>
    </WaveModal>
  );
};

export default CustomEventModal;
