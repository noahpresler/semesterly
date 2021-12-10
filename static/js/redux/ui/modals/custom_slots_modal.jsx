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
import PropTypes from "prop-types";
import { WaveModal } from "boron-15";
import * as SemesterlyPropTypes from "../../constants/semesterlyPropTypes";

/* eslint-disable react/no-unused-prop-types, no-shadow */

const CustomSlotsModal = (props) => {
  let modal = null;

  useEffect(() => {
    if (modal && props.isVisible) {
      modal.show();
    }
  }, [props.isVisible]);

  const hide = () => {
    props.hideCustomSlotsModal();
  };


  const getBody = (props) => {
    return <h1>Hello</h1>;
  };

  const modalStyle = {
    width: "100%",
  };

  return (
    <WaveModal
      ref={(c) => {
        modal = c;
      }}
      className="custom-event-modal max-modal"
      modalStyle={modalStyle}
      onHide={hide}
    >
      <div className="custom-event-modal-container">{getBody(props)}</div>
    </WaveModal>
  );
};

CustomSlotsModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  event: PropTypes.shape({
    ...SemesterlyPropTypes.customEvent,
    id: PropTypes.string.isRequired
  }).isRequired,
  hideCustomSlotsModal: PropTypes.func.isRequired,
  saveCustomSlotModal: PropTypes.func.isRequired,
};

export default CustomSlotsModal;
