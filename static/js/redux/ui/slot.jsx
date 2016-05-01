import React from 'react';
import { renderCourseModal } from './course_modal.jsx';
import { index as IntervalTree, matches01 as getIntersections } from 'static-interval-tree'
import { HALF_HOUR_HEIGHT } from '../constants.jsx';

let COLOUR_DATA = [
    {background: "#FD7473", highlight: "#E26A6A", border: "#963838", font: "#222"},
    {background: "#5AC8FB", highlight: "#28A4EA", border: "#1B6B90", font: "#222"},
    {background: "#4CD4B0", highlight: "#3DBB9A", border: "#1E755E", font: "#222"},
    {background: "#8870FF", highlight: "#7059E6", border: "#382694", font: "#222"},
    {background: "#FFBF8D", highlight: "#F7954A", border: "#AF5E20", font: "#222"},
    {background: "#D4DBC8", highlight: "#B5BFA3", border: "#6C7A89", font: "#222"},
    {background: "#F182B4", highlight: "#DE699D", border: "#6C7A89", font: "#222"},
    {background: "#7499A2", highlight: "#668B94", border: "#6C7A89", font: "#222"},
    {background: "#E7F76D", highlight: "#C4D44D", border: "#6C7A89", font: "#222"},
    {background: "#C8F7C5", highlight: "#C4D44D", border: "#548A50", font: "#222"}
] // consider #CF000F, #e8fac3, #C8F7C5


class Slot extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hovered: false };
        this.removeCourse = this.removeCourse.bind(this);
    }
    removeCourse(event) {
        this.props.removeCourse();
        event.stopPropagation();
    }
	render() {
        let remove_button = this.state.hovered ? 
            <i className="fa fa-times" onClick={this.removeCourse}></i> : null;
		return (
			<div className="fc-event-container">
                <div className="fc-time-grid-event fc-event slot" 
                     style={this.getSlotStyles()} 
                     onClick={() => this.props.fetchCourseInfo(this.props.course)}
                     onMouseEnter={() => this.setState({ hovered: true })}
                     onMouseLeave={() => this.setState({ hovered: false })}>
    				<div className="slot-bar" 
                         style={{ backgroundColor: COLOUR_DATA[this.props.colour_id].border }}/>
                    {remove_button}
                    <div className="fc-content">
                        <div className="fc-time">
                            <span>{this.props.time_start} – {this.props.time_end}</span></div>
                        <div className="fc-time">{this.props.name}</div>
                        <div className="fc-time">{this.props.location} </div>
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
        if(push_left == 50) {
            push_left += .5;
        }
		return {
            top: top, bottom: -bottom, zIndex: 1, left: '0%', right: '0%', 
            backgroundColor: COLOUR_DATA[this.props.colour_id].background,
            color: COLOUR_DATA[this.props.colour_id].font,
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
                let p = false;
                return <Slot {...slot} key={slot.fake ? -slot.id : slot.id} pinned={p} fetchCourseInfo={this.props.fetchCourseInfo}
                    removeCourse={() => this.props.removeCourse(slot.course)}/>
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
    addCourseWithSection(courseWithSection) {
        this.props.timetables.courses.push(courseWithSection);
    }
    getSlotsByDay() {
    	let slots_by_day = {
            'M': [], 'T': [], 'W': [], 'R': [], 'F': []
        };
        for (let course in this.props.timetable.courses) {
            let crs = this.props.timetable.courses[course];
            for (let slot_id in crs.slots) {
                let slot = Object.assign(crs.slots[slot_id], {
                            'colour_id': course, 
                            'code': crs.code, 
                            'name': crs.name,
                            'fake': crs.fake,
                        });
            }
        }
        for (let course in this.props.timetable.courses) {
            let crs = this.props.timetable.courses[course];
            for (let slot_id in crs.slots) {
                let slot = Object.assign(crs.slots[slot_id], {
                            'colour_id': course, 'code': crs.code, 'name': crs.name});
                slots_by_day[slot.day].push(slot);
            }
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
                        let slot_id = direct_conflicts[j].id
                        day_slots[slot_id]['num_conflicts'] = direct_conflicts.length
                        day_slots[slot_id]['shift_index'] = j
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
