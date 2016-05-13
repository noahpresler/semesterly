import React from 'react';
import { renderCourseModal } from './course_modal.jsx';
import Slot from './slot.jsx'
import CustomSlot from './custom_slot.jsx'
import { index as IntervalTree, matches01 as getIntersections } from 'static-interval-tree'
import { HALF_HOUR_HEIGHT, COLOUR_DATA, DAYS } from '../constants.jsx';

class SlotManager extends React.Component {

	render() {
        let slots_by_day = this.getSlotsByDay();
        let all_slots = DAYS.map((day) => {
            let day_slots = slots_by_day[day].map((slot) => {
                let courseId = slot.course;
                let locked = this.props.isLocked(courseId, slot.meeting_section);
                return slot.custom ?
                <CustomSlot {...slot}
                    key={ slot.id }
                    removeCustomSlot={ () => this.props.removeCustomSlot(slot.id) }/>
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
            let custom_slot = this.props.custom[i];
            custom_slot['custom'] = true;
            custom_slot['key'] = custom_slot.id;
            slots_by_day[custom_slot.day].push(custom_slot)
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
