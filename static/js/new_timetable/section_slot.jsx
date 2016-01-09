var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

// maps base colour of slot to colour on highlight
var colour_to_highlight = {
    "#FD7473" : "#E26A6A",
    "#44BBFF" : "#28A4EA",
    "#4CD4B0" : "#3DBB9A",
    "#8870FF" : "#7059E6",
    "#F9AE74" : "#F7954A",
    "#D4DBC8" : "#B5BFA3",
    "#E7F76D" : "#C4D44D",
    "#F182B4" : "#DE699D",
    "#7499A2" : "#668B94",
} // consider #CF000F, #e8fac3

// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var day_to_letter = {
    'M':  'M', 
    'T':  'T', 
    'W':  'W',
    'R': 'Th',
    'F':  'F',
    'S': 'Sa',
    'U': 'S'
}

module.exports = React.createClass({
    render: function() {
        var cos = this.getRelatedCourseOfferings()
        var dayAndTimes = this.getDaysAndTimes(cos);
        var sect = <div id="section-num">{cos[0].meeting_section}</div>
        var prof = <div id="profs">{cos[0].instructors}</div>
        var sect_prof = <div id="sect-prof">{sect}{prof}</div>
        return <div id="section-wrapper">{sect_prof}{dayAndTimes}</div>
    },

    getRelatedCourseOfferings: function() {
        co_objects = []
        for (var i = 0; i < this.props.all_sections.length; i++) {
            var o = this.props.all_sections[i];
            if (o.meeting_section == this.props.section) {
                co_objects.push(o);
            }
        }
        return co_objects;
    },

    getDaysAndTimes: function(cos) {
        var dayAndTimes = cos.map(function(o) {
            return (<div id="day-time">{day_to_letter[o.day] + " " + o.time_start + "-" + o.time_end}</div>);
        }.bind(this));
        return ( <div id="dt-container">
                {dayAndTimes}
            </div> )
    }
});