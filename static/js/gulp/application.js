"use strict";

//             [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#449DCA", "#fb6b5b", "#8A7BDD", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var half_hour_height = 30;

var slot_attributes = {};
var slot_ids = [];

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
                        this.props.start_time,
                        " – ",
                        this.props.end_time
                    )
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

        var duration = end_hour * 60 + end_minute - (start_hour * 60 + start_minute) + (end_hour - start_hour - 1);
        var top = (start_hour - 8) * 62;
        var bottom = (end_hour - 8) * 62;
        var height = bottom - top - start_minute + end_minute - 2;
        return { top: top, height: height };
    }

});

var SlotManager = React.createClass({
    displayName: "SlotManager",

    render: function render() {
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
                    React.createElement(
                        "td",
                        null,
                        React.createElement(
                            "div",
                            { className: "fc-event-container" },
                            React.createElement(Slot, { start_time: "8:00", end_time: "9:45", title: "Hello" })
                        )
                    ),
                    React.createElement(
                        "td",
                        null,
                        React.createElement("div", { className: "fc-event-container" })
                    ),
                    React.createElement(
                        "td",
                        null,
                        React.createElement(
                            "div",
                            { className: "fc-event-container" },
                            React.createElement(Slot, { start_time: "14:00", end_time: "15:15", title: "Meeting" })
                        )
                    ),
                    React.createElement(
                        "td",
                        null,
                        React.createElement("div", { className: "fc-event-container" })
                    ),
                    React.createElement(
                        "td",
                        null,
                        React.createElement(
                            "div",
                            { className: "fc-event-container" },
                            React.createElement(Slot, { start_time: "10:00", end_time: "12:00", title: "Hello" })
                        )
                    )
                )
            )
        );
    }
});

ReactDOM.render(React.createElement(SlotManager, null), document.getElementById('slot-manager'));