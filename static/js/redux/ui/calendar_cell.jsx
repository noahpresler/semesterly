import React from 'react';
import { DAYS, DRAGTYPES } from '../constants.jsx';
import { DropTarget } from 'react-dnd';

function convertToHalfHours(str) {
  let start = parseInt(str.split(':')[0])
  return str.split(':')[1] == '30' ? start*2 + 1 : start * 2;
}

function convertToStr(halfHours) {
  let num_hours = Math.floor(halfHours/2)
  return halfHours % 2 ? num_hours + ':30' : num_hours + ':00' 
}

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
  };
}

const dragCellTarget = {
  drop(props, monitor) {
    let { timeStart, timeEnd, id } = monitor.getItem();

    let startHalfhour = convertToHalfHours(timeStart)
    let endHalfhour = convertToHalfHours(timeEnd)

    let newStartHour = convertToHalfHours(props.time)
    let newEndHour = newStartHour + (endHalfhour - startHalfhour)

    // console.log(props.time, convertToStr(newEndHour))
    props.moveCustomSlot(props.time, convertToStr(newEndHour), props.day, id);
  }
}

const Cell = (props) => props.connectDropTarget(<div className='cal-cell'></div>)

export default DropTarget(DRAGTYPES.DRAG, dragCellTarget, collect)(Cell)