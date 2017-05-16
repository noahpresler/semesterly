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
  num: React.PropTypes.number.isRequired,
  code: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  getShareLinkFromModal: React.PropTypes.func.isRequired,
};

export default SlotHoverTip;
