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

import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';

const CourseModalSection = ({ secName, instr, enrolment, waitlist, size, hoverSection,
                               unHoverSection, locked, lockOrUnlock,
                               isOnActiveTimetable, location }) => {
  const seats = size - enrolment;
  let seatStatus = waitlist > 0 ? (`${waitlist} waitlist`) : (`${seats} open`);
  if (seats === -1 || size === -1) {
    seatStatus = 'Unknown';
  }
  const sizeDisplay = size === -1 ? 'Unknown' : size;
  let benchmark = 'green';
  if (waitlist > 0) {
    benchmark = 'red';
  } else if (seats === 0 && sizeDisplay !== 'Unknown') {
    benchmark = 'red';
  } else if (seats < sizeDisplay / 10) {
    benchmark = 'yellow';
  }
  return (
    <div
      className={classnames('modal-section', {
        locked,
        'on-active-timetable': isOnActiveTimetable,
      })}
      onMouseDown={lockOrUnlock}
      onMouseEnter={hoverSection}
      onMouseLeave={unHoverSection}
    >
      <h4>
        <span>{secName}</span>
        <i className="fa fa-calendar-check-o" />
      </h4>
      <h5>{instr}</h5>
      <h6>
        <span className="location">{location}</span>
        { /*
        <span className={benchmark}>{seatStatus}</span>
        <span> / </span>
        <span className="total-seats">{sizeDisplay} seats</span>
        */}
      </h6>
      
      <i className="fa fa-lock" />
    </div>
  );
};

CourseModalSection.defaultProps = {
  isOnActiveTimetable: false,
  locked: false,
};

CourseModalSection.propTypes = {
  secName: PropTypes.string.isRequired,
  instr: PropTypes.string.isRequired,
  enrolment: PropTypes.number.isRequired,
  waitlist: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  hoverSection: PropTypes.func.isRequired,
  unHoverSection: PropTypes.func.isRequired,
  lockOrUnlock: PropTypes.func.isRequired,
  isOnActiveTimetable: PropTypes.bool,
  locked: PropTypes.bool,
};

export default CourseModalSection;

