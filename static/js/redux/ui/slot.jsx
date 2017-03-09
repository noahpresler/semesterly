import React from 'react';
import ReactDOM from 'react-dom'
import { DropTarget } from 'react-dnd'
import { HALF_HOUR_HEIGHT, COLOUR_DATA, DRAGTYPES, HALF_HOUR_HEIGHT_WEEKLY, HALF_HOUR_HEIGHT_WEEKLY_FAKE_MODAL } from '../constants.jsx';
import Radium, { StyleRoot } from 'radium';

function convertToHalfHours(str) {
    let start = parseInt(str.split(':')[0])
    return str.split(':')[1] == '30' ? start*2 + 1 : start * 2;
}

function convertToStr(halfHours) {
    let num_hours = Math.floor(halfHours/2)
    return halfHours % 2 ? num_hours + ':30' : num_hours + ':00'
}

const dragSlotTarget = {
  drop(props, monitor) { // move it to current location on drop
    let { timeStart, timeEnd, id } = monitor.getItem();

    let startHalfhour = convertToHalfHours(timeStart)
    let endHalfhour = convertToHalfHours(timeEnd)

    let slotStart = props.time_start
    let slotTop = $('#' + props.id).offset().top
    // number half hours from slot start
    let n = Math.floor((monitor.getClientOffset().y - slotTop)/((isPoll) ? HALF_HOUR_HEIGHT_WEEKLY : HALF_HOUR_HEIGHT))

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

var lastPreview = null
const createSlotTarget = {
    drop(props, monitor) { // move it to current location on drop
        let { timeStart, id } = monitor.getItem();

        // get the time that the mouse dropped on
        let slotStart = props.time_start
        let slotTop = $('#' + props.id).offset().top
        let n = Math.floor((monitor.getClientOffset().y - slotTop)/((isPoll) ? HALF_HOUR_HEIGHT_WEEKLY : HALF_HOUR_HEIGHT))
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
        let { timeStart, id } = monitor.getItem()

        // get the time that the mouse dropped on
        let slotStart = props.time_start
        let slotTop = $('#' + props.id).offset().top
        let n = Math.floor((monitor.getClientOffset().y - slotTop)/((isPoll) ? HALF_HOUR_HEIGHT_WEEKLY : HALF_HOUR_HEIGHT))
        if (n == lastPreview) {
            return
        }
        let timeEnd = convertToStr(convertToHalfHours(props.time_start) + n)
        if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
          [timeStart, timeEnd] = [timeEnd, timeStart]
        }
        lastPreview = n
        props.updateCustomSlot({time_start: timeStart, time_end: timeEnd}, id)
    }
}

function collectCreateDrop(connect, monitor) { // inject props as drop target
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

class Slot extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hovered: false,
            overflow: false,
            defaultScrollWidth: 0
        };
        this.stopPropagation = this.stopPropagation.bind(this);
        this.onSlotHover = this.onSlotHover.bind(this);
        this.onSlotUnhover = this.onSlotUnhover.bind(this);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    onSlotHover() {
        this.setState({ hovered: true});
        this.updateColours(COLOUR_DATA[this.props.colourId].highlight);
    }
    onSlotUnhover() {
        this.setState({ hovered: false});
        this.updateColours(COLOUR_DATA[this.props.colourId].background);
    }
    updateColours(colour) {
        // update sibling slot colours (i.e. the slots for the same course)
        $(".slot-" + this.props.course)
          .css('background-color', colour)
    }
    checkOverflow() {
        // check if scrollWidth of a slot is larger than its offsetWidth, if course name is longer than the slot's width
        if (!this.refs.courseDiv) {
            return false;
        } else if (this.refs.courseDiv.offsetWidth < this.state.defaultScrollWidth) {
            this.setState({overflow: true});
        } else if (this.refs.courseDiv.offsetWidth >= this.state.defaultScrollWidth) {
            this.setState({overflow: false});
        }
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.checkOverflow());
    }
    componentDidMount() {
        // sets scrollWidth of a slot to the width of course name and course section
        this.setState({defaultScrollWidth: this.refs.courseSpan.offsetWidth + this.refs.courseNum.offsetWidth}, function() {
            this.checkOverflow();
        });
        window.addEventListener('resize', this.checkOverflow.bind(this));
    }
  render() {
        let removeButton = this.state.hovered ?
            <i className="fa fa-times"
               onClick={ (event) => this.stopPropagation(this.props.removeCourse, event) }></i> : null;

        let lockButton = null;
        if (this.props.locked) {
            lockButton = <i title="Unlock this section" className="fa fa-lock"
                            onClick={ (event) => this.stopPropagation(this.props.lockOrUnlockSection, event) }></i>;
        }
        else { // not a locked section
            if (this.state.hovered) { // show unlock icon on hover
                lockButton = <i title="Lock this section" className="fa fa-unlock"
                                onClick={ (event) => this.stopPropagation(this.props.lockOrUnlockSection, event) }></i>;
            }
        }
        let friends = this.props.classmates && this.props.classmates.length !== 0 ? (
            <div className="slot-friends">
                <h3>{this.props.classmates.length}</h3>
                <i className="fa fa-user"></i>
                <span>{this.props.location && this.props.location !== "" ? " , " : null}</span>
            </div>) : null;
        let converted_start = uses12HrTime && parseInt(this.props.time_start.split(':')[0]) > 12 ? (parseInt(this.props.time_start.split(':')[0]) - 12) + ":" + this.props.time_start.split(':')[1] : this.props.time_start
        let converted_end = uses12HrTime && parseInt(this.props.time_end.split(':')[0]) > 12 ? (parseInt(this.props.time_end.split(':')[0]) - 12) + ":" + this.props.time_end.split(':')[1] : this.props.time_end

    return this.props.connectCreateTarget(this.props.connectDragTarget(
       <div>
        <StyleRoot>
      <div className="fc-event-container" >
                <div className={"fc-time-grid-event fc-event slot slot-" + this.props.course}
                     style={ this.getSlotStyles() }
                     onClick={ this.props.fetchCourseInfo }
                     onMouseEnter={ this.onSlotHover }
                     onMouseLeave={ this.onSlotUnhover }
                     id={ this.props.id }>
            <div className="slot-bar"
                         style={ { backgroundColor: COLOUR_DATA[this.props.colourId].border } }/>
                    { removeButton }
                    { lockButton }
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ converted_start } – { converted_end }</span>
                        </div>
                        <div ref="courseDiv" className="fc-time">
                            <span ref="courseSpan" className={"fc-time-name" + (this.state.overflow ? "-overflow" : "")}>
                            { this.props[this.props.primaryDisplayAttribute] + " "}</span>
                            <span ref="courseNum">{this.props.meeting_section}</span>
                        </div>
                        <div className="fc-time">
                            {friends}
                            { this.props.location }
                        </div>
                    </div>
                </div>
            </div>
        </StyleRoot>
        </div>
    ));
  }
  getSlotStyles() {
        let start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]),
            hour_offset  = isPoll ? 0 : 8;

        let slotHeight = this.props.isModal ? HALF_HOUR_HEIGHT_WEEKLY_FAKE_MODAL : HALF_HOUR_HEIGHT_WEEKLY
        let top = (start_hour - hour_offset)*(((isPoll) ? slotHeight : HALF_HOUR_HEIGHT)*2 + 2) + (start_minute)*(((isPoll) ? slotHeight : HALF_HOUR_HEIGHT)/30);
        let bottom = (end_hour - hour_offset)*(((isPoll) ? slotHeight : HALF_HOUR_HEIGHT)*2 + 2) + (end_minute)*(((isPoll) ? slotHeight : HALF_HOUR_HEIGHT)/30) - 1;
        let height = bottom - top - 2;
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
            '@media print': {
                boxShadow: `inset 0 0 0 1000px ${COLOUR_DATA[this.props.colourId].background}`,
            },
            top: top, bottom: -bottom, right: '0%',
            backgroundColor: COLOUR_DATA[this.props.colourId].background,
            color: COLOUR_DATA[this.props.colourId].font,
            width: slot_width_percentage + "%",
            left: push_left + "%",
            zIndex: 10 * this.props.depth_level
        };
	}
}

Slot = Radium(Slot);

export default DropTarget(DRAGTYPES.CREATE, createSlotTarget, collectCreateDrop)(
    DropTarget(DRAGTYPES.DRAG, dragSlotTarget, collectDragDrop)(Slot)
)
