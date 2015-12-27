"use strict";

// maps base colour of slot to colour on highlight
var colour_to_highlight = {
    "#E26A6A": "#FD7473",
    "#67809F": "#76B0D4",
    "#90C695": "#95DC94",
    "#ACA46F": "#D6C761",
    "#7356C9": "#8870FF"
};

// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var test_timetable = [{
    code: 'MAT223H1',
    lecture_section: 'L0101',
    title: 'Linear Algebra Methodology',
    slots: [{
        day: 'M',
        start_time: '14:00',
        end_time: '16:00'
    }, {
        day: 'W',
        start_time: '10:00',
        end_time: '12:15'
    }]
}, {
    code: 'CSC148H1',
    lecture_section: 'L5001',
    title: 'Introduction to Computer Programming',
    slots: [{
        day: 'T',
        start_time: '13:00',
        end_time: '15:20'
    }, {
        day: 'F',
        start_time: '9:45',
        end_time: '10:45'
    }]
}, {
    code: 'LIN203H1',
    lecture_section: 'L2001',
    title: 'English Words',
    slots: [{
        day: 'R',
        start_time: '12:00',
        end_time: '15:00'
    }]
}, {
    code: 'SMC438H1',
    lecture_section: 'L0101',
    title: 'Chocolate Inquiries',
    slots: [{
        day: 'W',
        start_time: '17:00',
        end_time: '18:30'
    }]
}, {
    code: 'OPT315H1',
    lecture_section: 'L0101',
    title: 'Optimizing Semesterly',
    slots: [{
        day: 'F',
        start_time: '15:30',
        end_time: '17:00'
    }]
}];

var Slot = React.createClass({
    displayName: "Slot",

    render: function render() {
        var slot_style = this.getSlotStyle();
        return React.createElement(
            "div",
            {
                onMouseEnter: this.highlightSiblings,
                onMouseLeave: this.unhighlightSiblings,
                className: "fc-time-grid-event fc-event slot slot-" + this.props.code,
                style: slot_style },
            React.createElement(
                "div",
                { className: "fc-content" },
                React.createElement(
                    "div",
                    { className: "fc-time" },
                    React.createElement(
                        "span",
                        null,
                        this.props.start_time,
                        " – ",
                        this.props.end_time
                    )
                ),
                React.createElement(
                    "div",
                    { className: "fc-title" },
                    this.props.code
                ),
                React.createElement(
                    "div",
                    { className: "fc-title" },
                    this.props.title
                )
            )
        );
    },

    getSlotStyle: function getSlotStyle() {
        var start_hour = parseInt(this.props.start_time.split(":")[0]),
            start_minute = parseInt(this.props.start_time.split(":")[1]),
            end_hour = parseInt(this.props.end_time.split(":")[0]),
            end_minute = parseInt(this.props.end_time.split(":")[1]);

        var top = (start_hour - 8) * 62 + start_minute;
        var bottom = (end_hour - 8) * 62 + end_minute;
        var height = bottom - top - 2;
        return {
            top: top,
            height: height,
            backgroundColor: this.props.colour,
            border: "1px solid " + this.props.colour
        };
    },

    highlightSiblings: function highlightSiblings() {
        this.updateColours(colour_to_highlight[this.props.colour]);
    },
    unhighlightSiblings: function unhighlightSiblings() {
        this.updateColours(this.props.colour);
    },

    updateColours: function updateColours(colour) {
        $(".slot-" + this.props.code).css('background-color', colour).css('border-color', colour);
    }

});

var SlotManager = React.createClass({
    displayName: "SlotManager",

    getInitialState: function getInitialState() {
        var slots_by_day = {
            'M': [],
            'T': [],
            'W': [],
            'R': [],
            'F': []
        };
        for (var course in test_timetable) {
            var crs = test_timetable[course];
            for (var slot_id in crs.slots) {
                var slot = crs.slots[slot_id];
                slot["colour"] = Object.keys(colour_to_highlight)[course];
                slot["code"] = crs.code;
                slot["title"] = crs.title;
                slot["lecture_section"] = crs.lecture_section;
                slots_by_day[slot.day].push(slot);
            }
        }
        return { slots_by_day: slots_by_day };
    },

    render: function render() {
        var days = ["M", "T", "W", "R", "F"];
        var slots_by_day = this.state.slots_by_day;
        var all_slots = days.map(function (day) {
            var day_slots = slots_by_day[day].map(function (slot) {
                return React.createElement(Slot, slot);
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