"use strict";

//             [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#3A539B", "#D24D57", "#66C3A3", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var test_timetable = [{
    code: 'MAT223H1',
    lecture_section: 'L0101',
    title: 'Linear Algebra Methodology',
    slots: [{
        day: 'Monday',
        start_time: '14:00',
        end_time: '16:00'
    }, {
        day: 'Wednesday',
        start_time: '10:00',
        end_time: '12:15'
    }]
}, {
    code: 'CSC148H1',
    lecture_section: 'L5001',
    title: 'Introduction to Computer Programming',
    slots: [{
        day: 'Tuesday',
        start_time: '13:00',
        end_time: '15:20'
    }, {
        day: 'Friday',
        start_time: '9:45',
        end_time: '10:45'
    }]
}, {
    code: 'LIN203H1',
    lecture_section: 'L2001',
    title: 'English Words',
    slots: [{
        day: 'Thursday',
        start_time: '12:00',
        end_time: '15:00'
    }]
}];

var Slot = React.createClass({
    displayName: "Slot",

    render: function render() {
        var slot_style = this.getSlotStyle();
        return React.createElement(
            "div",
            { className: "fc-time-grid-event fc-event slot", style: slot_style },
            React.createElement(
                "div",
                { className: "fc-content" },
                React.createElement(
                    "div",
                    { className: "fc-time" },
                    React.createElement(
                        "span",
                        null,
                        this.props.course.start_time,
                        " – ",
                        this.props.course.end_time
                    )
                ),
                React.createElement(
                    "div",
                    { className: "fc-title" },
                    this.props.course.code
                ),
                React.createElement(
                    "div",
                    { className: "fc-title" },
                    this.props.course.title
                )
            )
        );
    },

    getSlotStyle: function getSlotStyle() {
        var start_hour = parseInt(this.props.course.start_time.split(":")[0]),
            start_minute = parseInt(this.props.course.start_time.split(":")[1]),
            end_hour = parseInt(this.props.course.end_time.split(":")[0]),
            end_minute = parseInt(this.props.course.end_time.split(":")[1]);

        var top = (start_hour - 8) * 62 + start_minute;
        var bottom = (end_hour - 8) * 62 + end_minute;
        var height = bottom - top - 2;
        return {
            top: top,
            height: height,
            backgroundColor: this.props.course.colour,
            border: "1px solid " + this.props.course.colour };
    }

});

var SlotManager = React.createClass({
    displayName: "SlotManager",

    getInitialState: function getInitialState() {
        var slots_by_day = {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': []
        };
        for (var course in test_timetable) {
            var crs = test_timetable[course];
            for (var slot_id in crs.slots) {
                var slot = crs.slots[slot_id];
                slot["colour"] = colour_list[course];
                slot["code"] = crs.code;
                slot["title"] = crs.title;
                slot["lecture_section"] = crs.lecture_section;
                slots_by_day[slot.day].push(slot);
            }
        }
        return { slots_by_day: slots_by_day };
    },

    render: function render() {
        var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        var slots_by_day = this.state.slots_by_day;
        var all_slots = days.map(function (day) {
            var day_slots = slots_by_day[day].map(function (slot) {
                return React.createElement(Slot, { course: slot });
            });
            return React.createElement(
                "td",
                null,
                React.createElement(
                    "div",
                    { className: "fc-event-container" },
                    day_slots
                )
            );
        });
        return React.createElement(
            "table",
            null,
            React.createElement(
                "tbody",
                null,
                React.createElement(
                    "tr",
                    null,
                    React.createElement("td", { className: "fc-axis" }),
                    all_slots
                )
            )
        );
    },

    componentDidMount: function componentDidMount() {
        var days = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
        var d = new Date();
        var selector = ".fc-" + days[d.getDay()];
        // $(selector).addClass("fc-today");
    }

});

ReactDOM.render(React.createElement(SlotManager, null), document.getElementById('slot-manager'));