import React from 'react';
import { renderCourseModal } from './course_modal.jsx';
export const HALF_HOUR_HEIGHT = 25;
let COLOUR_DATA = {
    "#FD7473" : {highlight: "#E26A6A", border: "#6C7A89"},
    "#5AC8FB" : {highlight: "#28A4EA", border: "#6C7A89"},
    "#4CD4B0" : {highlight: "#3DBB9A", border: "#6C7A89"},
    "#8870FF" : {highlight: "#7059E6", border: "#6C7A89"},
    "#FFBF8D" : {highlight: "#F7954A", border: "#6C7A89"},
    "#D4DBC8" : {highlight: "#B5BFA3", border: "#6C7A89"},
    "#F182B4" : {highlight: "#DE699D", border: "#6C7A89"},
    "#7499A2" : {highlight: "#668B94", border: "#6C7A89"},
    "#E7F76D" : {highlight: "#C4D44D", border: "#6C7A89"},
    "#C8F7C5" : {highlight: "#C4D44D", border: "#6C7A89"}

} // consider #CF000F, #e8fac3, #C8F7C5
var lol;
class Slot extends React.Component {
	render() {
		return (
			<div className="fc-event-container">
                <div className="fc-time-grid-event fc-event slot" style={this.getSlotStyles()} onClick={() => renderCourseModal(this.props.id, false)}>
    				<div className="slot-bar" style={{backgroundColor: COLOUR_DATA[this.props.colour].border}}/>
                    <div className="fc-content">
                        <div className="fc-time"><span>{this.props.time_start} – {this.props.time_end}</span></div>
                        <div className="fc-title">{this.props.name}</div>
                        <div className="fc-title">{this.props.location}</div>

                    </div>
                </div>
            </div>
		);
	}
	getSlotStyles() {
        var start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        var top = (start_hour - 8)*52 + (start_minute)*(HALF_HOUR_HEIGHT/30);
        var bottom = (end_hour - 8)*52 + (end_minute)*(HALF_HOUR_HEIGHT/30) - 1;
        var height = bottom - top - 2;
        // the cumulative width of this slot and all of the slots it is conflicting with
        var total_slot_widths = 99 - (5 * this.props.depth_level);
        // the width of this particular slot
        var slot_width_percentage = total_slot_widths / this.props.num_conflicts;
        // the amount of left margin of this particular slot, in percentage
        var push_left = (this.props.shift_index * slot_width_percentage) + 5 * this.props.depth_level;
        // return {
        //     width: slot_width_percentage + "%",
        //     top: top,
        //     height: height,
        //     backgroundColor: this.props.colour,
        //     border: "1px solid " + this.props.colour,
        //     left: push_left + "%",
        //     zIndex: 100 * this.props.depth_level
        // };
		return {top: top, bottom: -bottom, zIndex: 1, left: '0%', right: '0%', backgroundColor: this.props.colour,
                width: '100%'};
	}
}

export class SlotManager extends React.Component {
	render() {
        var days = ["M", "T", "W", "R", "F"];
        var slots_by_day = this.getSlotsByDay();
        var all_slots = days.map(function(day) {
            var day_slots = slots_by_day[day].map(function(slot) {
                var p = false;
                return <Slot {...slot} key={slot.id} pinned={p}/>
            }.bind(this));
            return (
                    <td key={day}>
                        <div className="fc-content-col">
                            {day_slots}
                        </div>
                    </td>
            );
        }.bind(this));
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
    	var slots_by_day = {
            'M': [], 'T': [], 'W': [], 'R': [], 'F': []
        };

        var slot = {
        	id: 38619,
        	course: "fkingwin",
        	code: 'MAT301H1',
        	meeting_section: 'L0101',
        	name: 'Groups and Symmetry',
        	location: 'MP202',
        	time_start: '11:00',
        	time_end: '13:10',
        	colour: "#FD7473"
        }


        var slot2 = {
        	id: 38392,
        	course: "fkingwin",
        	code: 'MAT301H1',
        	meeting_section: 'L0101',
        	name: 'Database Implementation',
        	location: 'BA1102',
        	time_start: '08:00',
        	time_end: '14:00',
        	colour: "#5AC8FB"
        }


        var slot3 = {
        	id: 35574,
        	course: "fkingwin",
        	code: 'BIO255H1',
        	meeting_section: 'L0101',
        	name: 'Cell & Molecular Biology',
        	location: 'AP130',
        	time_start: '16:00',
        	time_end: '19:15',
        	colour: "#C8F7C5"
        }
        var slot4 = {
            id: 36235,
            course: "fkingwin",
            code: 'CSC373H1',
            meeting_section: 'L5101',
            name: 'Algorithm Design, Analysis and Complexity',
            location: 'BA1160',
            time_start: '14:00',
            time_end: '15:20',
            colour: "#8870FF"
        }
        var slot5 = {
            id: 36241,
            course: "fkingwin",
            code: 'ESS105H1',
            meeting_section: 'L0201',
            name: 'Earth: Our Home Planet',
            location: 'BA1160',
            time_start: '12:00',
            time_end: '15:00',
            colour: "#FFBF8D"
        }
        slots_by_day['W'].push(slot);
        slots_by_day['M'].push(slot2);
        slots_by_day['F'].push(slot3);
        slots_by_day['T'].push(slot4);
        slots_by_day['R'].push(slot5);

        return slots_by_day;
    }
}



