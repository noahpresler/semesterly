/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import PropTypes from 'prop-types';
import React from 'react';
import COLOUR_DATA from '../constants/colours';

const SlotHoverTip = ({ num, code, name, getShareLinkFromModal }) => {
  const maxColourIndex = COLOUR_DATA.length - 1;
  return (<a href={getShareLinkFromModal(code)} className="course-link" key={num}>
    <span>{code}</span>
    <span
      className="course-link-tip"
      style={{ backgroundColor: COLOUR_DATA[Math.min(num - 1, maxColourIndex)].background }}
    >
      <span
        className="slot-bar"
        style={{ backgroundColor: COLOUR_DATA[Math.min(num - 1, maxColourIndex)].border }}
      />
      <span className="course-link-content">
        <span>{code}</span>
        <span>{name}</span>
      </span>
    </span>
  </a>);
};

SlotHoverTip.propTypes = {
  num: PropTypes.number.isRequired,
  code: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  getShareLinkFromModal: PropTypes.func.isRequired,
};

export default SlotHoverTip;

