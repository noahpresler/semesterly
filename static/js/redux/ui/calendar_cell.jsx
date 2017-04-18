import React from 'react';
import { DRAG_TYPES } from '../constants/constants';
import { DragSource, DropTarget } from 'react-dnd';

function convertToHalfHours(str) {
  const start = parseInt(str.split(':')[0]);
  return str.split(':')[1] == '30' ? start * 2 + 1 : start * 2;
}

function convertToStr(halfHours) {
  const num_hours = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${num_hours}:30` : `${num_hours}:00`;
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
    // TODO:
    // canDrop(props, monitor) {
    //   return Math.floor(convertToHalfHours(monitor.getItem().timeEnd)/2) < props.endHour
    // }
};

function collectDragDrop(connect, monitor) { // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

// ----------------- create source:
const createSource = {
  beginDrag(props) {
    const newSlotId = new Date().getTime();
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

function collectCreateBegin(connect, monitor) { // inject props as drag target
  return {
    connectCreateSource: connect.dragSource(),
    connectCreatePreview: connect.dragPreview(),
  };
}

// ------------------ create target:
let lastPreview = null;
const createTarget = {
  drop(props, monitor) {
    let { timeStart, id } = monitor.getItem();
    let timeEnd = props.time;
    if (timeStart > timeEnd) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
        // props.addCustomSlot(timeStart, timeEnd, props.day, false, new Date().getTime())
    props.updateCustomSlot({ preview: false }, id);
  },
  canDrop(props, monitor) { // new custom slot must start and end on the same day
    const { day } = monitor.getItem();
    return day == props.day;
  },
  hover(props, monitor) {
    if (props.time == lastPreview) {
      return;
    }
    let { timeStart, id } = monitor.getItem();
    let timeEnd = props.time;
    if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
      [timeStart, timeEnd] = [timeEnd, timeStart];
    }
    lastPreview = props.time;
    props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
  },
};

function collectCreateDrop(connect, monitor) {
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

const Cell = props => props.connectDragTarget(
    props.connectCreateTarget(
        props.connectCreateSource(
          <div className="cal-cell" />,
        ),
    ),
);

export default DragSource(DRAG_TYPES.CREATE, createSource, collectCreateBegin)(
    DropTarget(DRAG_TYPES.CREATE, createTarget, collectCreateDrop)(
        DropTarget(DRAG_TYPES.DRAG, dragTarget, collectDragDrop)(Cell),
    ),
);

