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
import Radium, { StyleRoot } from 'radium';
import { DropTarget } from 'react-dnd';
import COLOUR_DATA from '../constants/colours';
import { DRAG_TYPES, HALF_HOUR_HEIGHT } from '../constants/constants';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

function convertToHalfHours(str) {
  const start = parseInt(str.split(':')[0], 10);
  return str.split(':')[1] === '30' ? (start * 2) + 1 : start * 2;
}

function convertToStr(halfHours) {
  const numHours = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${numHours}:30` : `${numHours}:00`;
}

const dragSlotTarget = {
  drop(props, monitor) { // move it to current location on drop
    const { timeStart, timeEnd, id } = monitor.getItem();

    const startHalfhour = convertToHalfHours(timeStart);
    const endHalfhour = convertToHalfHours(timeEnd);

    const slotTop = $(`#${props.id}`).offset().top;
        // number half hours from slot start
    const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);

    const newStartHour = convertToHalfHours(props.time_start) + n;
    const newEndHour = newStartHour + (endHalfhour - startHalfhour);
    const newValues = {
      time_start: convertToStr(newStartHour),
      time_end: convertToStr(newEndHour),
      day: props.day,
    };
    props.updateCustomSlot(newValues, id);
  },
};

function collectDragDrop(connect) { // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

let lastPreview = null;
const createSlotTarget = {
  drop(props, monitor) { // move it to current location on drop
    let { timeStart } = monitor.getItem();
    const { id } = monitor.getItem();

    // get the time that the mouse dropped on
    const slotTop = $(`#${props.id}`).offset().top;
    const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);
    let timeEnd = convertToStr(convertToHalfHours(props.time_start) + n);

    if (timeStart > timeEnd) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    props.updateCustomSlot({ preview: false }, id);
  },
  hover(props, monitor) {
    let { timeStart } = monitor.getItem();
    const { id } = monitor.getItem();

    // get the time that the mouse dropped on
    const slotTop = $(`#${props.id}`).offset().top;
    const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);
    if (n === lastPreview) {
      return;
    }
    let timeEnd = convertToStr(convertToHalfHours(props.time_start) + n);
    if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    lastPreview = n;
    props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
  },
};

function collectCreateDrop(connect) { // inject props as drop target
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

class Slot extends React.Component {

  static stopPropagation(callback, event) {
    event.stopPropagation();
    callback();
  }

  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      overflow: false,
      defaultScrollWidth: 0,
    };
    this.onSlotHover = this.onSlotHover.bind(this);
    this.onSlotUnhover = this.onSlotUnhover.bind(this);
    this.checkOverflow = this.checkOverflow.bind(this);
  }

  componentDidMount() {
    // sets scrollWidth of a slot to the width of course name and course section
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      defaultScrollWidth: this.courseSpan.offsetWidth + this.courseNum.offsetWidth,
    }, () => {
      this.checkOverflow();
    });
    window.addEventListener('resize', this.checkOverflow.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkOverflow);
  }

  onSlotHover() {
    this.setState({ hovered: true });
    this.updateColours(COLOUR_DATA[this.props.colourId].highlight);
  }

  onSlotUnhover() {
    this.setState({ hovered: false });
    this.updateColours(COLOUR_DATA[this.props.colourId].background);
  }

  getSlotStyles() {
    const startHour = parseInt(this.props.time_start.split(':')[0], 10);
    const startMinute = parseInt(this.props.time_start.split(':')[1], 10);
    const endHour = parseInt(this.props.time_end.split(':')[0], 10);
    const endMinute = parseInt(this.props.time_end.split(':')[1], 10);

    const top = (((startHour - 8) * ((HALF_HOUR_HEIGHT * 2) + 2))) +
      ((startMinute) * (HALF_HOUR_HEIGHT / 30));
    const bottom = ((((endHour - 8) * ((HALF_HOUR_HEIGHT * 2) + 2))) +
      ((endMinute) * (HALF_HOUR_HEIGHT / 30))) - 1;
    // the cumulative width of this slot and all of the slots it is conflicting with
    const totalSlotWidth = 100 - (5 * this.props.depth_level);
    // the width of this particular slot
    const slotWidthPercentage = totalSlotWidth / this.props.num_conflicts;
    // the amount of left margin of this particular slot, in percentage
    let pushLeft = (this.props.shift_index * slotWidthPercentage) + (5 * this.props.depth_level);
    if (pushLeft === 50) {
      pushLeft += 0.5;
    }
    return {
      '@media print': {
        boxShadow: `inset 0 0 0 1000px ${COLOUR_DATA[this.props.colourId].background}`,
        backgroundColor: `${COLOUR_DATA[this.props.colourId].background}`,
      },
      top,
      bottom: -bottom,
      right: '0%',
      backgroundColor: COLOUR_DATA[this.props.colourId].background,
      color: COLOUR_DATA[this.props.colourId].font,
      width: `${slotWidthPercentage}%`,
      left: `${pushLeft}%`,
      zIndex: 10 * this.props.depth_level,
    };
  }

  checkOverflow() {
    // check if scrollWidth of a slot is larger than its offsetWidth,
    // if course name is longer than the slot's width
    if (!this.courseDiv) {
      return false;
    } else if (this.courseDiv.offsetWidth < this.state.defaultScrollWidth) {
      this.setState({ overflow: true });
    } else if (this.courseDiv.offsetWidth >= this.state.defaultScrollWidth) {
      this.setState({ overflow: false });
    }
    return true;
  }

  updateColours(colour) {
    // update sibling slot colours (i.e. the slots for the same course)
    $(`.slot-${this.props.courseId}`)
      .css('background-color', colour);
  }

  render() {
    const removeButton = this.state.hovered ?
            (<i
              className="fa fa-times"
              onClick={event => Slot.stopPropagation(this.props.removeCourse, event)}
            />) : null;

    const shortCourseDatesPanel = this.state.hovered && this.props.is_short_course ?
    (
      <div className="slot-shortCourseDates">
        Start Date: <b>{this.props.date_start}</b><br />
        End Date: <b>{this.props.date_end}</b>
      </div>
    ) : null;

    let lockButton = null;
    let shortCourseIndicator = '';
    if (this.props.is_short_course) {
      shortCourseIndicator = (
        <span>&nbsp;&nbsp;&nbsp;
          <img alt="Short Course" src="/static/img/short_course_icon_15x15.png" />
        </span>
      );
    }
    if (this.props.locked) {
      lockButton = (<i
        title="Unlock this section"
        className="fa fa-lock"
        onClick={event => Slot.stopPropagation(this.props.lockOrUnlockSection, event)}
      />);
    } else if (this.state.hovered) { // not a locked section
     // show unlock icon on hover
      lockButton = (<i
        title="Lock this section"
        className="fa fa-unlock"
        onClick={event => Slot.stopPropagation(this.props.lockOrUnlockSection, event)}
      />);
    }
    const friends = this.props.classmates && this.props.classmates.length !== 0 ? (
      <div className="slot-friends">
        <h3>{this.props.classmates.length}</h3>
        <i className="fa fa-user" />
        <span>{this.props.location && this.props.location !== '' ? ' , ' : null}</span>
      </div>) : null;
    const convertedStart = this.props.uses12HrTime && parseInt(this.props.time_start.split(':')[0], 10) > 12 ?
      `${parseInt(this.props.time_start.split(':')[0], 10) - 12} : 
      ${this.props.time_start.split(':')[1]}` : this.props.time_start;
    const convertedEnd = this.props.uses12HrTime && parseInt(this.props.time_end.split(':')[0], 10) > 12 ?
      `${parseInt(this.props.time_end.split(':')[0], 10) - 12}:${this.props.time_end.split(':')[1]}`
      : this.props.time_end;

    return this.props.connectCreateTarget(this.props.connectDragTarget(
      <div>
        <StyleRoot>
          <div className="fc-event-container">
            <div
              className={`fc-time-grid-event fc-event slot slot-${this.props.courseId}`}
              style={this.getSlotStyles()}
              onClick={this.props.fetchCourseInfo}
              onMouseEnter={this.onSlotHover}
              onMouseLeave={this.onSlotUnhover}
              id={this.props.id}
            >
              {shortCourseDatesPanel}
              <div
                className="slot-bar"
                style={{ backgroundColor: COLOUR_DATA[this.props.colourId].border }}
              />
              { removeButton }
              { lockButton }
              <div className="fc-content">
                <div className="fc-time">
                  <span>{ convertedStart } – { convertedEnd }</span>
                  { shortCourseIndicator }
                </div>
                <div ref={(c) => { this.courseDiv = c; }} className="fc-time">
                  <span
                    ref={(c) => { this.courseSpan = c; }}
                    className={`fc-time-name${this.state.overflow ? '-overflow' : ''}`}
                  >
                    { `${this.props[this.props.primaryDisplayAttribute]} `}</span>
                  <span ref={(c) => { this.courseNum = c; }}>
                    {this.props.meeting_section}
                  </span>
                </div>
                <div className="fc-time">
                  {friends}
                  { this.props.location }
                </div>
              </div>
            </div>
          </div>
        </StyleRoot>
      </div>,
        ));
  }
}

// eslint-disable-next-line no-class-assign
Slot = Radium(Slot);

Slot.propTypes = {
  classmates: SemesterlyPropTypes.classmatesArray.isRequired,
  colourId: PropTypes.number.isRequired,
  courseId: PropTypes.number.isRequired,
  depth_level: PropTypes.number.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
  location: PropTypes.string.isRequired,
  locked: PropTypes.bool.isRequired,
  meeting_section: PropTypes.string.isRequired,
  num_conflicts: PropTypes.number.isRequired,
  primaryDisplayAttribute: PropTypes.string.isRequired,
  removeCourse: PropTypes.func.isRequired,
  shift_index: PropTypes.number.isRequired,
  is_short_course: PropTypes.bool.isRequired,
  date_end: PropTypes.string.isRequired,
  date_start: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  time_start: PropTypes.string.isRequired,
  lockOrUnlockSection: PropTypes.func.isRequired,
  connectCreateTarget: PropTypes.func.isRequired,
  connectDragTarget: PropTypes.func.isRequired,
  uses12HrTime: PropTypes.bool.isRequired,
};

export default DropTarget(DRAG_TYPES.CREATE, createSlotTarget, collectCreateDrop)(
    DropTarget(DRAG_TYPES.DRAG, dragSlotTarget, collectDragDrop)(Slot),
);

