import React, { PropTypes } from 'react';
import { DragSource, DropTarget } from 'react-dnd'
import { HALF_HOUR_HEIGHT, DRAGTYPES } from '../constants.jsx';


function convertToHalfHours(str) {
    let start = parseInt(str.split(':')[0])
    return str.split(':')[1] == '30' ? start*2 + 1 : start * 2;
}

function convertToStr(halfHours) {
    let num_hours = Math.floor(halfHours/2)
    return halfHours % 2 ? num_hours + ':30' : num_hours + ':00' 
}

const dragSlotSource = {
    beginDrag(props) {
        console.log('oowee look at me')
        return {
            timeStart: props.time_start,
            timeEnd: props.time_end,
            id: props.id
        }
    },
    endDrag(props, monitor) {
        console.log('end');
    }
}

function collectDragSource(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    }
}

const dragSlotTarget = {
  drop(props, monitor) { // move it to current location on drop
    let { timeStart, timeEnd, id } = monitor.getItem();

    let startHalfhour = convertToHalfHours(timeStart)
    let endHalfhour = convertToHalfHours(timeEnd)

    let slotStart = props.time_start
    let slotTop = $('#' + props.id).offset().top
    // number half hours from slot start
    let n = Math.floor((monitor.getClientOffset().y - slotTop)/HALF_HOUR_HEIGHT)

    let newStartHour = convertToHalfHours(props.time_start) + n
    let newEndHour = newStartHour + (endHalfhour - startHalfhour)

    let newValues = {
      time_start: convertToStr(newStartHour),
      time_end: convertToStr(newEndHour),
      day: props.day
    }
    props.updateCustomSlot(newValues, id);
  },
}

function collectDragDrop(connect, monitor) { // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

const createSlotTarget = {
    drop(props, monitor) { // move it to current location on drop
        let { timeStart, id } = monitor.getItem();

        // get the time that the mouse dropped on
        let slotStart = props.time_start
        let slotTop = $('#' + props.id).offset().top
        let n = Math.floor((monitor.getClientOffset().y - slotTop)/HALF_HOUR_HEIGHT)
        let timeEnd = convertToStr(convertToHalfHours(props.time_start) + n)

        if (timeStart > timeEnd) {
            [timeStart, timeEnd] = [timeEnd, timeStart]
        }
        // props.addCustomSlot(timeStart, timeEnd, props.day, false, new Date().getTime());
        props.updateCustomSlot({preview: false}, id);
    },
    canDrop(props, monitor) { // new custom slot must start and end on the same day
        let { day } = monitor.getItem();
        return day == props.day
    },
    hover(props, monitor) {
        console.log('!!!!')
        let { timeStart, id } = monitor.getItem()
        // get the time that the mouse dropped on
        let slotStart = props.time_start
        let slotTop = $('#' + props.id).offset().top
        let n = Math.floor((monitor.getClientOffset().y - slotTop)/HALF_HOUR_HEIGHT)
        let timeEnd = convertToStr(convertToHalfHours(props.time_start) + n)

        if (timeStart > timeEnd) {
            [timeStart, timeEnd] = [timeEnd, timeStart]
        }
        if (timeStart > timeEnd) {
          [timeStart, timeEnd] = [timeEnd, timeStart]
        }
        props.updateCustomSlot({time_start: timeStart, time_end: timeEnd}, id)
    }
}

function collectCreateDrop(connect, monitor) { // inject props as drop target
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

// TODO: set connectDragPreview
class CustomSlot extends React.Component {
    constructor(props) {
        super(props);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    updateName(event) {
        this.props.updateCustomSlot({ name: event.target.value }, this.props.id)
    }
    render() {
        return this.props.connectCreateTarget(this.props.connectDragTarget(this.props.connectDragSource(
            <div className="fc-event-container">
                <div className={"fc-time-grid-event fc-event slot"}
                     style={ this.getSlotStyles() }
                     id={ this.props.id }>
                    <div className="slot-bar" />
                        <i className="fa fa-times" onClick={ (e) => this.stopPropagation(this.props.removeCustomSlot, e) }></i>
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ this.props.time_start } – { this.props.time_end }</span>
                        </div>
                        <div className="fc-time">
                            <input type="text" 
                                    name="eventName" 
                                    style={ {backgroundColor: "#C8F7C5"} } 
                                    value={ this.props.name } 
                                    onChange={ (event) => this.updateName(event) }/>
                        </div>
                    </div>
                </div>
            </div>
        )));
    }
    // TODO: move this out
    getSlotStyles() {
        let start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        let top = (start_hour - 8)*(HALF_HOUR_HEIGHT*2 + 2) + (start_minute)*(HALF_HOUR_HEIGHT/30);
        let bottom = (end_hour - 8)*(HALF_HOUR_HEIGHT*2 + 2) + (end_minute)*(HALF_HOUR_HEIGHT/30) - 1;
        let height = bottom - top - 2;
        if (this.props.preview) { // don't take into account conflicts, reduce opacity, increase z-index
            return {
                top: top, bottom: -bottom, zIndex: 10, left: '0%', right: '0%', 
                backgroundColor: "#C8F7C5",
                color: "#222",
                width: '100%',
                left: 0,
                opacity: 0.5
            };
        } else {
            // the cumulative width of this slot and all of the slots it is conflicting with
            let total_slot_widths = 100 - (5 * this.props.depth_level);
            // the width of this particular slot
            let slot_width_percentage = total_slot_widths / this.props.num_conflicts;
            // the amount of left margin of this particular slot, in percentage
            let push_left = (this.props.shift_index * slot_width_percentage) + 5 * this.props.depth_level;
            if (push_left == 50) {
                push_left += .5;
            }
            return {
                top: top, bottom: -bottom, zIndex: 1, left: '0%', right: '0%', 
                backgroundColor: "#C8F7C5",
                width: slot_width_percentage + "%",
                left: push_left + "%",
                zIndex: 10 * this.props.depth_level,
                opacity: this.props.isDragging ? 0 : 1 // hide while dragging
            };
        }
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
    id: PropTypes.number.isRequired
}

export default DropTarget(DRAGTYPES.DRAG, dragSlotTarget, collectDragDrop)(
    DropTarget(DRAGTYPES.CREATE, createSlotTarget, collectCreateDrop)(
        DragSource(DRAGTYPES.DRAG, dragSlotSource, collectDragSource)(CustomSlot)
    )
)
// export default CustomSlot