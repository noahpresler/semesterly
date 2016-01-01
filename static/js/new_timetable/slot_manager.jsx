// maps base colour of slot to colour on highlight
var colour_to_highlight = {
    "#FD7473" : "#E26A6A",
    "#44BBFF" : "#28A4EA",
    "#4CD4B0" : "#3DBB9A",
    "#E7F76D" : "#C4D44D",
    "#8870FF" : "#7059E6",
} // consider #CF000F

// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var Slot = React.createClass({
    getInitialState: function() {
        return {show_buttons: false};
    },

    render: function() {
        var buttons = null;
        var slot_style = this.getSlotStyle();
        if (this.state.show_buttons) {
            buttons = (
            <div className="slot-inner" onClick={this.pinCourse} >
                <div className="button-surround">
                    <span className="fa fa-thumb-tack"></span>
               </div>
            </div>);
        }
        if (this.props.pinned) {
            buttons = (
            <div className="slot-inner" onClick={this.unpinCourse} >
                <div className="button-surround pinned">
                    <span className="fa fa-thumb-tack"></span>
               </div>
            </div>);
        }
    return (
            <div 
                onClick={this.props.toggleModal(this.props.course_id)}
                onMouseEnter={this.highlightSiblings}
                onMouseLeave={this.unhighlightSiblings}
                className={"slot-outer fc-time-grid-event fc-event slot slot-" + this.props.course_id} 
                style={slot_style}>
                <div className="fc-content">
                  <div className="fc-time">
                    <span>{this.props.time_start} – {this.props.time_end}</span>
                  </div>
                  <div className="fc-title">{this.props.code}</div>
                  <div className="fc-title">{this.props.name}</div>

                </div>
                {buttons}            
            </div>
        );
    },

    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        var top = (start_hour - 8)*62 + start_minute;
        var bottom = (end_hour - 8)*62 + end_minute;
        var height = bottom - top - 2;
        return {
            top: top, 
            height: height,
            backgroundColor: this.props.colour,
            border: "1px solid " + this.props.colour
        };
    },

    highlightSiblings: function() {
        this.setState({show_buttons: true});
        this.updateColours(colour_to_highlight[this.props.colour]);
    },
    unhighlightSiblings: function() {
        this.setState({show_buttons: false});
        this.updateColours(this.props.colour);
    },
    pinCourse: function(e) {
        e.stopPropagation();
    },
    unpinCourse: function(e) {
        e.stopPropagation();
    },

    updateColours: function(colour) {
        $(".slot-" + this.props.course_id)
          .css('background-color', colour)
          .css('border-color', colour);
    },

});

module.exports = React.createClass({

    render: function() {
        var days = ["M", "T", "W", "R", "F"];
        var slots_by_day = this.getSlotsByDay();
        var all_slots = days.map(function(day) {
            var day_slots = slots_by_day[day].map(function(slot) {
                return <Slot {...slot} toggleModal={this.props.toggleModal} key={slot.id}/>
            }.bind(this));
            return (
                    <td key={day}>
                        <div className="fc-event-container">
                            {day_slots}
                        </div>
                    </td>
            );
        }.bind(this));
        return (
            <table>
              <tbody>
                <tr>
                  <td className="fc-axis"></td>
                  {all_slots}
                </tr>
              </tbody>
            </table>

        );
    },
   
    componentDidMount: function() {
        var days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
        var d = new Date();
        var selector = ".fc-" + days[d.getDay()];
        // $(selector).addClass("fc-today");
    },

    getSlotsByDay: function() {
        var slots_by_day = {
            'M': [],
            'T': [],
            'W': [],
            'R': [],
            'F': []
        };
        for (var course in this.props.timetables.courses) {
            var crs = this.props.timetables.courses[course];
            for (var slot_id in crs.slots) {
                var slot = crs.slots[slot_id];
                slot["colour"] = Object.keys(colour_to_highlight)[course];
                slot["code"] = crs.code.trim();
                slot["course_id"] = crs.id;
                slot["name"] = crs.name;
                slot["meeting_section"] = crs.meeting_section;
                slots_by_day[slot.day].push(slot);
            }
        }
        return slots_by_day;
    },

});
