import React from 'react';
let COLOUR_DATA = {
    "#FD7473" : {highlight: "#E26A6A", border: "#6C7A89"},
    "#5AC8FB" : {highlight: "#28A4EA", border: "#6C7A89"},
    "#4CD4B0" : {highlight: "#3DBB9A", border: "#6C7A89"},
    "#8870FF" : {highlight: "#7059E6", border: "#6C7A89"},
    "#F9AE74" : {highlight: "#F7954A", border: "#6C7A89"},
    "#D4DBC8" : {highlight: "#B5BFA3", border: "#6C7A89"},
    "#F182B4" : {highlight: "#DE699D", border: "#6C7A89"},
    "#7499A2" : {highlight: "#668B94", border: "#6C7A89"},
    "#E7F76D" : {highlight: "#C4D44D", border: "#6C7A89"},
    "#C8F7C5" : {highlight: "#C4D44D", border: "#6C7A89"}

} // consider #CF000F, #e8fac3, #C8F7C5

class Slot extends React.Component {
	render() {
		return (
			<div className="fc-event-container">
                <div className="fc-time-grid-event fc-event slot" style={this.getSlotStyles()}>
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
		return {top: 307, bottom: '-395px', zIndex: 1, left: '0%', right: '0%', backgroundColor: this.props.colour};
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
        	id: 123,
        	course: "fkingwin",
        	code: 'MAT301H1',
        	meeting_section: 'L0101',
        	name: 'Groups and Symmetry',
        	location: 'MP202',
        	time_start: '13:00',
        	time_end: '14:00',
        	colour: "#FD7473"
        }


        var slot2 = {
        	id: 1234,
        	course: "fkingwin",
        	code: 'MAT301H1',
        	meeting_section: 'L0101',
        	name: 'Groups and Symmetry',
        	location: 'BA1102',
        	time_start: '13:00',
        	time_end: '14:00',
        	colour: "#5AC8FB"
        }


        var slot3 = {
        	id: 12345,
        	course: "fkingwin",
        	code: 'MAT301H1',
        	meeting_section: 'L0101',
        	name: 'Groups and Symmetry',
        	location: 'AP130',
        	time_start: '13:00',
        	time_end: '14:00',
        	colour: "#C8F7C5"
        }

        slots_by_day['W'].push(slot);
        slots_by_day['M'].push(slot2);
        slots_by_day['F'].push(slot3);

        return slots_by_day;
    }
}



