import React, { PropTypes } from 'react';
import { DragSource } from 'react-dnd'
import { HALF_HOUR_HEIGHT, DRAGTYPES } from '../constants.jsx';


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

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
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
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
    componentDidMount() {
        // TODO: set connectDragPreview
    }
    render() {
        return this.props.connectDragSource(
            <div className="fc-event-container">
                <div className={"fc-time-grid-event fc-event slot"}
                     style={ this.getSlotStyles() }>
                    <div className="slot-bar" />
                        <i className="fa fa-times" onClick={ (e) => this.stopPropagation(this.props.removeCustomSlot, e) }></i>
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ this.props.time_start } – { this.props.time_end }</span>
                        </div>
                        <div className="fc-time">
                            <input type="text" name="eventName" style={ {backgroundColor: "#C8F7C5"} } value={ this.props.name } />
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
    isDragging: PropTypes.bool.isRequired,
    time_start: PropTypes.string.isRequired,
    time_end: PropTypes.string.isRequired,
    depth_level: PropTypes.number.isRequired,
    num_conflicts: PropTypes.number.isRequired,
    shift_index: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired
}

export default DragSource(DRAGTYPES.DRAG, dragSlotSource, collect)(CustomSlot);
// export default CustomSlot