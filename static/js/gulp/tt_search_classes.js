"use strict";

String.prototype.addAt = function (index, character) {
    return this.substr(0, index) + character + this.substr(index + 1);
};
function resizeHandler() {
    var window_width = $(window).width();
    $(".tt-slot").css('width', $(".day-col").width() * .80 + "px");

    var column_width = $(".day-col").width() * .93;
    var slot_width = column_width * 0.9;
    var margin_width = (column_width - slot_width) / 2;

    $(".day-M").css('left', $(".fc-mon").position().left + margin_width + "px");
    $(".day-T").css('left', $(".fc-tue").position().left + margin_width + "px");
    $(".day-W").css('left', $(".fc-wed").position().left + margin_width + "px");
    $(".day-R").css('left', $(".fc-thu").position().left + margin_width + "px");
    $(".day-F").css('left', $(".fc-fri").position().left + margin_width + "px");

    var day_to_id_map = new Array();
    day_to_id_map['M'] = '.fc-mon';
    day_to_id_map['T'] = '.fc-tue';
    day_to_id_map['W'] = '.fc-wed';
    day_to_id_map['R'] = '.fc-thu';
    day_to_id_map['F'] = '.fc-fri';

    // Stuff for course slots
    for (var i = 0; i < slot_ids.length; i++) {
        var current_slot = slot_attributes[slot_ids[i]];
        var current_id = '.' + String(slot_ids[i]);

        // margin/positional stuff
        var column_width = $(".day-col").width() * .93;
        var slot_width = column_width * 0.9;
        var margin_width = (column_width - slot_width) / 2;
        var conflict_shift = current_slot.shift_index * (slot_width / (2 * Math.pow(.93, current_slot.num_conflicts - 1)));
        var layer_shift = 7.5 * current_slot.depth_level;
        var total_shift = margin_width + conflict_shift + layer_shift;
        var position = String($(day_to_id_map[current_slot.day]).position().left + total_shift + 'px');

        // width stuff
        var padding_factor = 0.9;
        var conflict_factor = 1 / current_slot.num_conflicts * Math.pow(.93, current_slot.num_conflicts - 1);
        var layer_factor = current_slot.depth_level * 7.5;
        var w = String(column_width * padding_factor * conflict_factor) - layer_factor + "px";

        $(current_id).css('width', w);
        $(current_id).css('left', position);
    }

    // Stuff for top slots
    for (var i = 2; i <= 9; i++) {
        if (window_width > 1080) {
            $(".day-" + i).css('left', 265 + (i - 1) * 115 + "px");
        } else {
            if (window.innerWidth >= 768) {
                if (i == 2) {
                    $(".day-1").css('left', "264px");
                }
                $(".day-" + i).css('left', 265 + (i - 1) * 89 + "px");
            } else {
                if (i == 2) {
                    $(".day-1").css('left', "30px");
                }
                $(".day-" + i).css('left', 30 + (i - 1) * 89 + "px");
            }
        }
    }
}
var SearchResult = React.createClass({
    displayName: "SearchResult",

    getInitialState: function getInitialState() {
        return { showDescription: false, locked_section: "", hover: false };
    },
    lockOrUnlockSection: function lockOrUnlockSection(new_section) {

        return (function (event) {

            if (this.props.locked_section == new_section) {
                this.props.removeCourse(new_section)();
            } else {
                this.setState({ locked_section: new_section });
                this.props.addCourse(new_section)();
            }
        }).bind(this);
    },
    addCourseNoSection: function addCourseNoSection() {
        this.props.addCourse("")();
    },
    removeCourseNoSection: function removeCourseNoSection() {
        this.props.removeCourse("")();
    },
    render: function render() {
        var add_style = { width: '14px' };
        var action_icon = this.props.inRoster ? React.createElement(
            "button",
            { type: "button", className: "btn btn-success in-roster", onClick: this.removeCourseNoSection },
            React.createElement("i", { className: "fa fa-check", style: add_style })
        ) : React.createElement(
            "button",
            { type: "button", className: "btn btn-info", onClick: this.addCourseNoSection },
            React.createElement("i", { className: "fa fa-plus", style: add_style })
        );

        var buttonStyle = { backgroundColor: '#e5e5e5' };
        var course_display = React.createElement(
            "div",
            { className: "course-display" },
            React.createElement(
                "div",
                { className: "btn-group" },
                action_icon,
                React.createElement(
                    "button",
                    { type: "button", "data-toggle": "popover", style: buttonStyle,
                        title: this.props.code + ": " + this.props.title,
                        "data-placement": "right",
                        "data-container": "body",
                        className: "btn course-code hide-extra-text",
                        "data-content": this.props.description,
                        "data-trigger": "hover",
                        onMouseEnter: this.handleMouseEnter()

                    },
                    this.props.display
                )
            )
        );
        var num_sections = 1;
        // display the section buttons (so that the user can lock any desired section)
        var sections_display = this.props.sections.map((function (section) {
            if (this.props.school == "uoft" && section[0] != 'L') {
                return null;
            }
            var br = null;
            num_sections += 1;
            if (num_sections > 4) {
                br = React.createElement("br", null);
                num_sections = 1;
            }
            var locked_or_unlocked = this.props.inRoster && this.props.locked_section == section ? React.createElement(
                "span",
                { className: "label label-default section-locked" },
                React.createElement("i", { className: "fa fa-lock" }),
                " " + section
            ) : React.createElement(
                "span",
                { className: "label label-default section-unlocked" },
                React.createElement("i", { className: "fa fa-unlock-alt" }),
                " " + section
            );
            return React.createElement(
                "a",
                { onClick: this.lockOrUnlockSection(section) },
                locked_or_unlocked,
                br
            );
        }).bind(this));

        return React.createElement(
            "div",
            { className: "course" },
            course_display
        );
    },

    componentDidUpdate: function componentDidUpdate() {},

    handleMouseEnter: function handleMouseEnter() {
        var description = this.props.description;

        return (function (event) {
            $('[data-toggle="popover"]').popover();

            //     $('[data-toggle="popover"]').popover({
            //     html: true,
            //     trigger: 'manual',
            //     container: $(this).attr('id'),
            //     placement: 'right',
            //     content: function () {
            //         return description;
            //     }
            // }).on("mouseenter", function () {
            //     var _this = this;
            //     $(this).popover("show");
            //     $(this).siblings(".popover").on("mouseleave", function () {
            //         $(_this).popover('hide');
            //     });
            // }).on("mouseleave", function () {
            //     var _this = this;
            //     setTimeout(function () {
            //         if (!$(".popover:hover").length) {
            //             $(_this).popover("hide");
            //         }
            //     }, 100);
            // });
        }).bind(this);
    },

    clickHandlerResult: function clickHandlerResult() {
        return (function (event) {
            var new_description_state = !this.state.showDescription;
            this.setState({ showDescription: new_description_state });
        }).bind(this);
    },

    hoverEnd: function hoverEnd() {
        return (function (event) {
            this.setState({ hover: false });
            this.setState({ showDescription: false });
        }).bind(this);
    },

    hoverHandler: function hoverHandler() {
        if (this.state.hover) {
            var new_description_state = !this.state.showDescription;
            this.setState({ showDescription: new_description_state });
        }
    },

    hoverStart: function hoverStart() {
        return (function (event) {
            this.setState({ hover: true });
            if (!this.state.showDescription) {
                window.setTimeout(this.hoverHandler, 300);
            }
        }).bind(this);
    }

});