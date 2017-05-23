import React from 'react';
import classnames from 'classnames';

const CourseModalSection = ({ secName, instr, enrolled, waitlist, size, hoverSection,
                               unHoverSection, locked, lockOrUnlock,
                               isOnActiveTimetable }) => {
  const seats = size - enrolled;
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
        <span className={benchmark}>{seatStatus}</span>
        <span> / </span>
        <span className="total-seats">{sizeDisplay} seats</span>
      </h6>
      <i className="fa fa-lock" />
    </div>
  );
};

CourseModalSection.propTypes = {
  secName: React.PropTypes.string.isRequired,
  instr: React.PropTypes.string.isRequired,
  enrolled: React.PropTypes.number.isRequired,
  waitlist: React.PropTypes.number.isRequired,
  size: React.PropTypes.number.isRequired,
  hoverSection: React.PropTypes.func.isRequired,
  unHoverSection: React.PropTypes.func.isRequired,
  lockOrUnlock: React.PropTypes.func.isRequired,
  isOnActiveTimetable: React.PropTypes.bool.isRequired,
  locked: React.PropTypes.bool.isRequired,
};

export default CourseModalSection;
