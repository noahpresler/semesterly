import React from 'react';
import { renderCourseModal } from './course_modal.jsx';
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
	render() {
		return (
			<div className="fc-event-container">
                <div className="fc-time-grid-event fc-event slot" style={this.getSlotStyles()} onClick={() => renderCourseModal(this.props.course, false)}>
    				<div className="slot-bar" style={{backgroundColor: COLOUR_DATA[this.props.colour_id].border}}/>
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
        let total_slot_widths = 99 - (5 * this.props.depth_level);
        // the width of this particular slot
        let slot_width_percentage = total_slot_widths / this.props.num_conflicts;
        // the amount of left margin of this particular slot, in percentage
        let push_left = (this.props.shift_index * slot_width_percentage) + 5 * this.props.depth_level;
        // return {
        //     width: slot_width_percentage + "%",
        //     top: top,
        //     height: height,
        //     backgroundColor: this.props.colour,
        //     border: "1px solid " + this.props.colour,
        //     left: push_left + "%",
        //     zIndex: 100 * this.props.depth_level
        // };
		return {
            top: top, bottom: -bottom, zIndex: 1, left: '0%', right: '0%', 
            backgroundColor: COLOUR_DATA[this.props.colour_id].background,
            color: COLOUR_DATA[this.props.colour_id].font,
            width: '100%'
        };
	}
}

export class SlotManager extends React.Component {

	render() {
        let days = ["M", "T", "W", "R", "F"];
        let slots_by_day = this.getSlotsByDay();
        let all_slots = days.map((day) => {
            let day_slots = slots_by_day[day].map((slot) => {
                let p = false;
                return <Slot {...slot} key={slot.fake ? -slot.id : slot.id} pinned={p}/>
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
        if (this.props.timetable.courses) {
            // console.log(this.props.timetable.courses[0]);
        }   
        for (let course in this.props.timetable.courses) {
            let crs = this.props.timetable.courses[course];
            for (let slot_id in crs.slots) {
                let slot = Object.assign(crs.slots[slot_id], {
                            'colour_id': course, 
                            'code': crs.code, 
                            'name': crs.name,
                            'fake': crs.fake,
                        });
                slots_by_day[slot.day].push(slot);
            }
        }

        return slots_by_day;
    }
}
