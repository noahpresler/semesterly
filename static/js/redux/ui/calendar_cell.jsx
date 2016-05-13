import React from 'react';
import { DAYS, DRAGTYPES } from '../constants.jsx';
import { DropTarget, DragSource } from 'react-dnd';

function convertToHalfHours(str) {
  let start = parseInt(str.split(':')[0])
  return str.split(':')[1] == '30' ? start*2 + 1 : start * 2;
}

function convertToStr(halfHours) {
  let num_hours = Math.floor(halfHours/2)
  return halfHours % 2 ? num_hours + ':30' : num_hours + ':00' 
}

// ---------------  drag target:
const dragTarget = {
  drop(props, monitor) { // move it to current location on drop
    let { timeStart, timeEnd, id } = monitor.getItem();

    let startHalfhour = convertToHalfHours(timeStart)
    let endHalfhour = convertToHalfHours(timeEnd)

    let newStartHour = convertToHalfHours(props.time)
    let newEndHour = newStartHour + (endHalfhour - startHalfhour)

    let newValues = {
      time_start: props.time,
      time_end: convertToStr(newEndHour),
      day: props.day
    }
    props.updateCustomSlot(newValues, id);
  },
  // TODO:
  // canDrop(props, monitor) {
  //   return Math.floor(convertToHalfHours(monitor.getItem().timeEnd)/2) < props.endHour
  // }
}

function collectDragDrop(connect, monitor) { // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

// ----------------- create source:
const createSource = {
  beginDrag(props) {
    console.log('oh me oh my')
    // props.addCustomSlot(props.time, 
    //   convertToStr(convertToHalfHours(props.time) + 1), 
    //   props.day, 
    //   true
    // )
    return {
      timeStart: props.time,
      'day': props.day
    }
  }
}

function collectCreateBegin(connect, monitor) { // inject props as drag target
  return {
    connectCreateSource: connect.dragSource(),
    connectCreatePreview: connect.dragPreview()
  }
}

// ------------------ create target:
const createTarget = {
  drop(props, monitor) {
    let { timeStart }  = monitor.getItem()
    let timeEnd = props.time
    if (timeStart > timeEnd) {
      [timeStart, timeEnd] = [timeEnd, timeStart]
    }
    props.addCustomSlot(timeStart, timeEnd, props.day, false)
  },
  canDrop(props, monitor) { // new custom slot must start and end on the same day
    let { day } = monitor.getItem();
    return day == props.day
  },
  hover(props, monitor) {
    let { timeStart, day } = monitor.getItem()
    if (day != props.day) {
      return
    }
  }
}

function collectCreateDrop(connect, monitor) {
  return {
    connectCreateTarget: connect.dropTarget()
  };
}

const Cell = (props) => props.connectDragTarget(
  props.connectCreateTarget(
    props.connectCreateSource(
      <div className='cal-cell'></div>
    )
  )
)

export default DragSource(DRAGTYPES.CREATE, createSource, collectCreateBegin)(
  DropTarget(DRAGTYPES.CREATE, createTarget, collectCreateDrop)(
    DropTarget(DRAGTYPES.DRAG, dragTarget, collectDragDrop)(Cell)
  )
)


