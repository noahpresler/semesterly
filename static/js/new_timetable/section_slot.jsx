var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');


var day_to_letter = {
    'M':  'M', 
    'T':  'T', 
    'W':  'W',
    'R': 'Th',
    'F':  'F',
    'S': 'Sa',
    'U': 'S'
};

module.exports = React.createClass({
    render: function() {
        var cos = this.getRelatedCourseOfferings();
        var day_and_times = this.getDaysAndTimes(cos);
        var profs_text = cos[0].instructors ? "Prof: " + cos[0].instructors : "-";

        var section_and_prof = (
            <div className="sect-prof">
                <div className="section-num">{cos[0].meeting_section}</div>
                <div className="profs">{profs_text}</div>
            </div>
        );

        return (
            <div className={"section-wrapper sec-" + this.props.unique} ref="main_slot">
                {section_and_prof}
                {day_and_times}
            </div>);
    },

    getRelatedCourseOfferings: function() {
        co_objects = [];
        for (var i = 0; i < this.props.all_sections.length; i++) {
            var o = this.props.all_sections[i];
            if (o.meeting_section == this.props.section) {
                co_objects.push(o);
            }
        }
        return co_objects;
    },

    getDaysAndTimes: function(cos) {
        var dayAndTimes = cos.map(function(o, j) {
            return (<div key={j} className="day-time" key={o.id}>{day_to_letter[o.day] + " " + o.time_start + " - " + o.time_end}</div>);
        }.bind(this));
        return ( <div className="dt-container">
                {dayAndTimes}
            </div> );
    }
});
