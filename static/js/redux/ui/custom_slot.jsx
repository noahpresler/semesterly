import React from 'react';
import { DragSource } from 'react-dnd'
import { HALF_HOUR_HEIGHT, COLOUR_DATA } from '../constants.jsx';


const dragSlotSource = {
    beginDrag(props) {
        console.log('oowee look at me')
        return {}
    },
    endDrag(props) {
        console.log('end')
    }
}

function collect(connect, monitor) {
    return {
        isDragging: monitor.isDragging
    }
}

class CustomSlot extends React.Component {
    constructor(props) {
        super(props);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    render() {
        return (
            <div className="fc-event-container">
                <div className={"fc-time-grid-event fc-event slot"}
                     style={ this.getSlotStyles() }>
                    <div className="slot-bar" />
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ this.props.time_start } – { this.props.time_end }</span>
                        </div>
                        <div className="fc-time">
                            { this.props.name }
                        </div>
                    </div>
                </div>
            </div>
        );
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
            backgroundColor: 'black',
            width: slot_width_percentage + "%",
            left: push_left + "%",
            zIndex: 100 * this.props.depth_level,
            opacity: this.props.isDragging ? 0.5 : 1
        };
    }
}

export default DragSource('DRAG', dragSlotSource, collect)(CustomSlot);
// export default CustomSlot