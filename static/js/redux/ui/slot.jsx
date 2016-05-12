import React from 'react';
import { renderCourseModal } from './course_modal.jsx';
import { index as IntervalTree, matches01 as getIntersections } from 'static-interval-tree'
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
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{ this.props.time_start } – { this.props.time_end }</span>
                        </div>
                        <div className="fc-time">
                            { this.props[this.props.primaryDisplayAttribute] + " " + this.props.meeting_section}
                        </div>
                        <div className="fc-time">
                            <div className="slot-friends">
                                <h3>4</h3>
                                <i className="fa fa-user"></i>
                                <span> , </span>
                            </div>
                            { this.props.location }
                        </div>
                    </div>
                    { removeButton }
                    { lockButton }
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
            zIndex: 100 * this.props.depth_level
        };
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
            zIndex: 100 * this.props.depth_level
        };
    }
}

class SlotManager extends React.Component {

	render() {
        let days = ["M", "T", "W", "R", "F"];
        let slots_by_day = this.getSlotsByDay();
        let all_slots = days.map((day) => {
            let day_slots = slots_by_day[day].map((slot) => {
                let courseId = slot.course;
                let locked = this.props.isLocked(courseId, slot.meeting_section);
                return slot.custom ?
                <CustomSlot {...slot}/>
                :
                <Slot {...slot} 
                    fetchCourseInfo={ () => this.props.fetchCourseInfo(courseId) }
                    key={ slot.fake ? -slot.id : slot.id } 
                    locked={ locked } 
                    lockOrUnlockSection={ () => this.props.addOrRemoveCourse(courseId, slot.meeting_section) }
                    removeCourse={ () => this.props.addOrRemoveCourse(courseId) }
                    primaryDisplayAttribute={this.props.primaryDisplayAttribute}/>
            });
            return (
                    <td key={day}>
                        <div className="fc-content-col">
                            {day_slots}
                        </div>
                    </td>
            );
        });
        return (
            <table>
			    <tbody>
			        <tr>
			            <td className="fc-axis" style={{width: 49}} />
			            {all_slots}
			        </tr>
			    </tbody>
			</table>

        );
    }

    getSlotsByDay() {
    	let slots_by_day = {
            'M': [], 'T': [], 'W': [], 'R': [], 'F': []
        };
        let courses = this.props.timetable.courses;

        // course slots
        for (let i in courses) {
            let crs = courses[i];
            for (let slotId in crs.slots) {
                let slotObj = crs.slots[slotId];
                // first assume this course already has a colour (was added previously)
                let colourIndex = _.range(COLOUR_DATA.length).find((i) => 
                            !Object.values(this.props.courseToColourIndex).some( x => x === i)
                    );
                let colourId = this.props.courseToColourIndex[slotObj.course] === undefined ? colourIndex : this.props.courseToColourIndex[slotObj.course];
                let slot = Object.assign(slotObj, {
                            'colourId': colourId, 'code': crs.code, 'name': crs.name});
                if (slots_by_day[slot.day]) {
                    slot['custom'] = false;
                    slots_by_day[slot.day].push(slot);
                }
            }
        }

        // custom slots
        for (let i in this.props.custom) {
            let customSlot = this.props.custom[i];
            customSlot['custom'] = true;
            customSlot['key'] = i; // TODO: Find better unique key
            slots_by_day[customSlot.day].push(customSlot)
        }
        return this.getConflictStyles(slots_by_day)
    }
    
    getConflictStyles(slots_by_day) {
        for (let day in slots_by_day) {
            let day_slots = slots_by_day[day]
            // sort by start time
            day_slots.sort((a, b) => this.getMinutes(a.time_start) - this.getMinutes(b.time_start))

            // build interval tree corresponding to entire slot
            let intervals = day_slots.map((slot, index) => {
                return {
                    start: this.getMinutes(slot.time_start),
                    end: this.getMinutes(slot.time_end),
                    id: index // use day_slot index to map back to the slot object
                }
            })
            let tree = IntervalTree(intervals)

            // build interval tree with part of slot that should not be overlayed (first hour)
            let info_intervals = intervals.map((s) => {
                return {
                    start: s.start,
                    end: Math.min(s.start + 60, s.end),
                    id: s.id
                }
            })
            let info_slots = IntervalTree(info_intervals)

            // bit map to store if slot has already been processed
            let seen = day_slots.map(() => false)

            // get num_conflicts + shift_index
            for (let i = 0; i < info_intervals.length; i++) {
                if (!seen[i]) { // if not seen, perform dfs search on conflicts
                    let direct_conflicts = [];
                    let frontier = [info_intervals[i]];
                    while (frontier.length > 0) {
                        let next = frontier.pop()
                        seen[next.id] = true
                        direct_conflicts.push(next)
                        let neighbors = getIntersections(info_slots, next)
                        for (let k = 0; k < neighbors.length; k++) {
                            if (!seen[neighbors[k].id]) {
                                frontier.push(neighbors[k])
                            }
                        }
                    }
                    direct_conflicts.sort((a, b) => (intervals[b.id].end - intervals[b.id].start) - (intervals[a.id].end - intervals[a.id].start))
                    for (let j = 0; j < direct_conflicts.length; j++) {
                        let slotId = direct_conflicts[j].id
                        day_slots[slotId]['num_conflicts'] = direct_conflicts.length
                        day_slots[slotId]['shift_index'] = j
                    }
                }
            }

            // build interval tree with part of slot that should not be overlayed
            let over_slots = IntervalTree(intervals.filter((s) => s.end - s.start > 60).map((s) => {
                return {
                    start: s.start + 60,
                    end: s.end,
                    id: s.id
                }
            }))

            // get depth_level
            for (let i = 0; i < info_intervals.length; i++) {
                let conflicts = getIntersections(over_slots, info_intervals[i])
                conflicts.sort((a, b) => (b.start - a.start))
                day_slots[i]['depth_level'] = conflicts.length > 0 ? day_slots[conflicts[0].id].depth_level + 1 : 0
            }
            slots_by_day[day] = day_slots
        }
        return slots_by_day
    }
    getMinutes(time_string) {
        let l = time_string.split(':')
        return (+l[0]) * 60 + (+l[1])
    }
}

export default SlotManager;
