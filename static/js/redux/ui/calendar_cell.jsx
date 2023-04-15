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

import PropTypes from "prop-types";
import React from "react";
import { DragSource, DropTarget } from "react-dnd";
import { DRAG_TYPES } from "../constants/constants";
import { generateCustomEventId } from "../util";
import { convertToHalfHours, getNewSlotValues } from "./slotUtils";

// ---------------  drag target:
const dragTarget = {
  drop(props, monitor) {
    // move it to current location on drop
    const { timeStart, timeEnd, id } = monitor.getItem();

    const newStartHour = convertToHalfHours(props.time);
    const newValues = getNewSlotValues(timeStart, timeEnd, newStartHour, props.day);
    props.updateCustomSlot(newValues, id);
  },
  canDrop(props, monitor) {
    const { timeStart, timeEnd } = monitor.getItem();
    const duration = convertToHalfHours(timeEnd) - convertToHalfHours(timeStart);
    const desiredStart = convertToHalfHours(props.time);
    const desiredEnd = desiredStart + duration;

    return Math.floor(desiredEnd) / 2 < props.endHour + 1;
  },
};

function collectDragDrop(connect) {
  // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

// ----------------- create source:
const createSource = {
  beginDrag(props) {
    if (props.customEventModeOn) {
      const newSlotId = generateCustomEventId();
      props.addCustomSlot(props.time, props.time, props.day, true, newSlotId);
      return {
        timeStart: props.time,
        day: props.day,
        id: newSlotId,
      };
    } else {
      // create search slot
      props.addSearchSlot(props.time, props.time, props.day);
      return {
        timeStart: props.time,
        day: props.day,
      };
    }
  },
  canDrag(props) {
    if (props.customEventModeOn) {
      return props.loggedIn;
    }
    return true;
  },
  endDrag(props, monitor) {
    if (props.customEventModeOn) {
      const { id } = monitor.getItem();
      props.finalizeCustomSlot(id);
    } else {
      props.finalizeSearchSlot();
    }
  },
};

function collectCreateBegin(connect) {
  // inject props as drag target
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
    if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
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
    if (props.customEventModeOn) {
      props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
    } else {
      props.updateSearchSlot(timeStart, timeEnd);
    }
  },
};

function collectCreateDrop(connect) {
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

/**
 * This is the cell component for the calendar and is wrapped with helpers of React DND
 * (Drag & Drop) so that custom events can be dragged and dropped.
 */
class Cell extends React.Component {
  render() {
    return this.props.connectDragTarget(
      this.props.connectCreateTarget(
        this.props.connectCreateSource(<div className="cal-cell" />)
      )
    );
  }
}

Cell.propTypes = {
  connectCreateSource: PropTypes.func.isRequired,
  connectDragTarget: PropTypes.func.isRequired,
  connectCreateTarget: PropTypes.func.isRequired,
};

export default DragSource(
  DRAG_TYPES.CREATE,
  createSource,
  collectCreateBegin
)(
  DropTarget(
    DRAG_TYPES.CREATE,
    createTarget,
    collectCreateDrop
  )(DropTarget(DRAG_TYPES.DRAG, dragTarget, collectDragDrop)(Cell))
);
