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

import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { DRAG_TYPES } from '../constants/constants';
import { generateCustomEventId } from '../util';

function convertToHalfHours(str) {
  const start = parseInt(str.split(':')[0], 10);
  return str.split(':')[1] === '30' ? (start * 2) + 1 : start * 2;
}

function convertToStr(halfHours) {
  const numHour = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${numHour}:30` : `${numHour}:00`;
}

// ---------------  drag target:
const dragTarget = {
  drop(props, monitor) { // move it to current location on drop
    const { timeStart, timeEnd, id } = monitor.getItem();

    const startHalfhour = convertToHalfHours(timeStart);
    const endHalfhour = convertToHalfHours(timeEnd);

    const newStartHour = convertToHalfHours(props.time);
    const newEndHour = newStartHour + (endHalfhour - startHalfhour);

    const newValues = {
      time_start: props.time,
      time_end: convertToStr(newEndHour),
      day: props.day,
    };
    props.updateCustomSlot(newValues, id);
  },
  canDrop(props, monitor) {
    const { timeStart, timeEnd } = monitor.getItem();
    const duration = convertToHalfHours(timeEnd) - convertToHalfHours(timeStart);
    const desiredStart = convertToHalfHours(props.time);
    const desiredEnd = desiredStart + duration;

    return (Math.floor(desiredEnd) / 2) < props.endHour + 1;
  },
};

function collectDragDrop(connect) { // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

// ----------------- create source:
const createSource = {
  beginDrag(props) {
    const newSlotId = generateCustomEventId();
    props.addCustomSlot(
            props.time,
            props.time,
            props.day,
            true,
            newSlotId,
        );
    return {
      timeStart: props.time,
      day: props.day,
      id: newSlotId,
    };
  },
  canDrag(props) {
    return props.loggedIn;
  },
};

function collectCreateBegin(connect) { // inject props as drag target
  return {
    connectCreateSource: connect.dragSource(),
    connectCreatePreview: connect.dragPreview(),
  };
}

// ------------------ create target:
let lastPreview = null;
const createTarget = {
  drop(props, monitor) {
    let { timeStart } = monitor.getItem();
    const { id } = monitor.getItem();

    let timeEnd = props.time;
    if (timeStart > timeEnd) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    props.updateCustomSlot({ preview: false }, id);
  },
  hover(props, monitor) {
    if (props.time === lastPreview) {
      return;
    }
    let { timeStart } = monitor.getItem();
    const { id } = monitor.getItem();
    let timeEnd = props.time;
    if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    lastPreview = props.time;
    props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
  },
};

function collectCreateDrop(connect) {
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

class Cell extends React.Component {
  render() {
    return (
      this.props.connectDragTarget(
        this.props.connectCreateTarget(
          this.props.connectCreateSource(
            <div className="cal-cell" />,
          ),
        ),
      )
    );
  }
}

export default DragSource(DRAG_TYPES.CREATE, createSource, collectCreateBegin)(
    DropTarget(DRAG_TYPES.CREATE, createTarget, collectCreateDrop)(
        DropTarget(DRAG_TYPES.DRAG, dragTarget, collectDragDrop)(Cell),
    ),
);

