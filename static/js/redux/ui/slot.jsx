import React from 'react';
import { HALF_HOUR_HEIGHT, COLOUR_DATA } from '../constants.jsx';


class Slot extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hovered: false };
        this.stopPropagation = this.stopPropagation.bind(this);
        this.onSlotHover = this.onSlotHover.bind(this);
        this.onSlotUnhover = this.onSlotUnhover.bind(this);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    onSlotHover() {
        this.setState({ hovered : true});
        this.updateColours(COLOUR_DATA[this.props.colourId].highlight);
    }
    onSlotUnhover() {
        this.setState({ hovered : false});
        this.updateColours(COLOUR_DATA[this.props.colourId].background);
    }
    updateColours(colour) {
        // update sibling slot colours (i.e. the slots for the same course)
        $(".slot-" + this.props.course)
          .css('background-color', colour)
    }
  render() {
        let removeButton = this.state.hovered ? 
            <i className="fa fa-times" 
               onClick={ (event) => this.stopPropagation(this.props.removeCourse, event) }></i> : null;

        let lockButton = null;
        if (this.props.locked) {
            lockButton = <i className="fa fa-lock" 
                            onClick={ (event) => this.stopPropagation(this.props.lockOrUnlockSection, event) }></i>;
        }
        else { // not a locked section
            if (this.state.hovered) { // show unlock icon on hover
                lockButton = <i className="fa fa-unlock" 
                                onClick={ (event) => this.stopPropagation(this.props.lockOrUnlockSection, event) }></i>;
            }
        }

    return (
      <div className="fc-event-container">
                <div className={"fc-time-grid-event fc-event slot slot-" + this.props.course}
                     style={ this.getSlotStyles() } 
                     onClick={ this.props.fetchCourseInfo }
                     onMouseEnter={ this.onSlotHover }
                     onMouseLeave={ this.onSlotUnhover }>
            <div className="slot-bar" 
                         style={ { backgroundColor: COLOUR_DATA[this.props.colourId].border } }/>
                    { removeButton }
                    { lockButton }
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ this.props.time_start } – { this.props.time_end }</span>
                        </div>
                        <div className="fc-time">
                            { this.props[this.props.primaryDisplayAttribute] + " " + this.props.meeting_section}
                        </div>
                        <div className="fc-time">{ this.props.location } </div>
                    </div>
                </div>
            </div>
    );
  }
  getSlotStyles() {
        let start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        let top = (start_hour - 8)*(HALF_HOUR_HEIGHT*2 + 2) + (start_minute)*(HALF_HOUR_HEIGHT/30);
        let bottom = (end_hour - 8)*(HALF_HOUR_HEIGHT*2 + 2) + (end_minute)*(HALF_HOUR_HEIGHT/30) - 1;
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
            top: top, bottom: -bottom, zIndex: 1, left: '0%', right: '0%', 
            backgroundColor: COLOUR_DATA[this.props.colourId].background,
            color: COLOUR_DATA[this.props.colourId].font,
            width: slot_width_percentage + "%",
            left: push_left + "%",
            zIndex: 10 * this.props.depth_level
        };
  }
}

export default Slot;