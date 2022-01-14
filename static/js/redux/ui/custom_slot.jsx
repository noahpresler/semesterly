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
import { DragSource, DropTarget } from 'react-dnd';
import { DRAG_TYPES, HALF_HOUR_HEIGHT } from '../constants/constants';


function convertToHalfHours(str) {
  const start = parseInt(str.split(':')[0], 10);
  return str.split(':')[1] === '30' ? (start * 2) + 1 : start * 2;
}

function convertToStr(halfHours) {
  const numHours = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${numHours}:30` : `${numHours}:00`;
}

const dragSlotSource = {
  beginDrag(props) {
    return {
      timeStart: props.time_start,
      timeEnd: props.time_end,
      id: props.id,
    };
  },
  endDrag() {
  },
};

function collectDragSource(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  };
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
        // props.addCustomSlot(timeStart, timeEnd, props.day, false, new Date().getTime());
    props.updateCustomSlot({ preview: false }, id);
  },
  canDrop(props, monitor) { // new custom slot must start and end on the same day
    const { day } = monitor.getItem();
    return day === props.day;
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

// TODO: set connectDragPreview or update state as preview
class CustomSlot extends React.Component {

  static stopPropagation(callback, event) {
    event.stopPropagation();
    callback();
  }

  constructor(props) {
    super(props);
    this.state = { hovered: false };
    this.onSlotHover = this.onSlotHover.bind(this);
    this.onSlotUnhover = this.onSlotUnhover.bind(this);
  }

  componentDidMount() {
    $(`#${this.props.id} .fc-time input`).on('keydown', (e) => {
      if (e.key === 'Enter') {
        $(`#${this.props.id} .fc-time input`).blur();
      }
    });
  }

  onSlotHover() {
    this.setState({ hovered: true });
  }

  onSlotUnhover() {
    this.setState({ hovered: false });
  }

  getSlotStyles() {
    const startHour = parseInt(this.props.time_start.split(':')[0], 10);
    const startMinute = parseInt(this.props.time_start.split(':')[1], 10);
    const endHour = parseInt(this.props.time_end.split(':')[0], 10);
    const endMinute = parseInt(this.props.time_end.split(':')[1], 10);

    const top = ((startHour - 8) * ((HALF_HOUR_HEIGHT * 2) + 2)) +
      ((startMinute) * (HALF_HOUR_HEIGHT / 30));
    const bottom = ((endHour - 8) * ((HALF_HOUR_HEIGHT * 2) + 2)) +
      (((endMinute) * (HALF_HOUR_HEIGHT / 30)) - 1);
    if (this.props.preview) { // don't take into account conflicts, reduce opacity, increase z-index
      return {
        top,
        bottom: -bottom,
        zIndex: 10,
        right: '0%',
        backgroundColor: '#F8F6F7',
        color: '#222',
        width: '100%',
        left: 0,
        opacity: 0.5,
      };
    }
    // the cumulative width of this slot and all of the slots it is conflicting with
    const totalSlotsWidth = 100 - (5 * this.props.depth_level);
    // the width of this particular slot
    const slotWidthPercentage = totalSlotsWidth / this.props.num_conflicts;
    // the amount of left margin of this particular slot, in percentage
    let pushLeft = (this.props.shift_index * slotWidthPercentage) + (5 * this.props.depth_level);
    if (pushLeft === 50) {
      pushLeft += 0.5;
    }
    return {
      top,
      bottom: -bottom,
      right: '0%',
      backgroundColor: '#F8F6F7',
      width: `${slotWidthPercentage}%`,
      left: `${pushLeft}%`,
      zIndex: 10 * this.props.depth_level,
      opacity: this.props.isDragging ? 0 : 1, // hide while dragging
    };
  }

  updateName(event) {
    this.props.updateCustomSlot({ name: event.target.value }, this.props.id);
  }

  render() {
    const removeButton = this.state.hovered ?
            (<i
              className="fa fa-times"
              onClick={event => CustomSlot.stopPropagation(this.props.removeCustomSlot, event)}
            />) : null;

    const convertedStart = this.props.uses12HrTime &&
    parseInt(this.props.time_start.split(':')[0], 10) > 12 ?
    `${parseInt(this.props.time_start.split(':')[0], 10) - 12}:${this.props.time_start.split(':')[1]}`
    : this.props.time_start;

    const convertedEnd = this.props.uses12HrTime &&
    parseInt(this.props.time_end.split(':')[0], 10) > 12 ?
    `${parseInt(this.props.time_end.split(':')[0], 10) - 12} :${this.props.time_end.split(':')[1]}`
    : this.props.time_end;

    return this.props.connectCreateTarget(this.props.connectDragTarget(this.props.connectDragSource(
      <div className="fc-event-container">
        <div
          className={'fc-time-grid-event fc-event slot'}
          style={this.getSlotStyles()}
          onMouseEnter={this.onSlotHover}
          onMouseLeave={this.onSlotUnhover}
          onClick={() => $(`#${this.props.id} .fc-time input`).select()}
          id={this.props.id}
        >
          <div className="slot-bar" style={{ backgroundColor: '#aaa' }} />
          {removeButton}
          <div className="fc-content">
            <div className="fc-time">
              <span>{ convertedStart } – { convertedEnd }</span>
            </div>
            <div className="fc-time">
              <input
                type="text"
                name="eventName"
                style={{
                  backgroundColor: '#F8F6F7',
                  borderStyle: 'none',
                  outlineColor: '#aaa',
                  outlineWidth: '2px',
                  width: '95%',
                }}
                value={this.props.name}
                onChange={event => this.updateName(event)}
              />
            </div>
          </div>
        </div>
      </div>,
        )));
  }
}

CustomSlot.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDragTarget: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  time_start: PropTypes.string.isRequired,
  time_end: PropTypes.string.isRequired,
  depth_level: PropTypes.number.isRequired,
  num_conflicts: PropTypes.number.isRequired,
  shift_index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  uses12HrTime: PropTypes.bool.isRequired,
  preview: PropTypes.bool.isRequired,
  updateCustomSlot: PropTypes.func.isRequired,
  removeCustomSlot: PropTypes.func.isRequired,
  connectCreateTarget: PropTypes.func.isRequired,
};

export default DropTarget(DRAG_TYPES.DRAG, dragSlotTarget, collectDragDrop)(
    DropTarget(DRAG_TYPES.CREATE, createSlotTarget, collectCreateDrop)(
        DragSource(DRAG_TYPES.DRAG, dragSlotSource, collectDragSource)(CustomSlot),
    ),
);

