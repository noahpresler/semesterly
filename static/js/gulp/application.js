"use strict";

<<<<<<< HEAD
var MenuOption = React.createClass({
  displayName: "MenuOption",

  render: function render() {
    var button_style = { backgroundColor: "#1fc08e" };
    if (this.props.chosen) {
      // if the relevant option has been picked (button pressed)
      button_style.color = "#ffffff";
      if (this.props.icon == "hotel") {
        button_style.backgroundColor = "#302C44";
      } else if (this.props.icon == "moon-o") {
        button_style.backgroundColor = "#1D3A37";
      } else if (this.props.icon == "glass") {
        button_style.backgroundColor = "#643934";
      } else {
        button_style.backgroundColor = "#453723";
      }
    } else {
      if (this.props.icon == "hotel") {
        button_style.backgroundColor = "#A094E3";
      } else if (this.props.icon == "moon-o") {
        button_style.backgroundColor = "#63C3BA";
      } else if (this.props.icon == "glass") {
        button_style.backgroundColor = "#FC9084";
      } else {
        button_style.backgroundColor = "#E8B875";
      }
    }
    return React.createElement(
      "div",
      { className: "menu-option-wrapper" },
      React.createElement(
        "button",
        {
          className: "btn btn-xs menu-option",
          style: button_style,
          onClick: this.handleChange },
        React.createElement("i", { className: "fa fa-2x fa-" + this.props.icon }),
        React.createElement("input", { ref: "checkbox", type: "checkbox", className: "menu-button-checkbox" })
      ),
      React.createElement(
        "p",
        { className: "preferences-text" },
        React.createElement(
          "small",
          null,
          this.props.text
        )
      )
    );
  },

  handleChange: function handleChange(event) {
    if (this.props.loading) {
      return;
    }
    this.refs.checkbox.checked = !this.refs.checkbox.checked;
    this.props.method(!this.refs.checkbox.checked);
  }
});

// var SchoolModal = React.createClass({
//   mixins: [BootstrapModalMixin],

//   getInitialState: function() {
//     return {};
//   },

//   render: function() {
//     var modal_style={top:'150'};
//     /* to display "Pick Your School" above the school logos
//     // var header = (         
//     //       <div className="modal-header">
//     //         <strong clasName="text-center">{this.props.header}</strong>
//     //       </div>);
//     */
//     var header = null;
//     return (
//     <div className="modal fade" style={modal_style}>
//       <div className="modal-dialog">
//         <div className="modal-content">
//           {header}
//           <div className="modal-body">
//             <img src="/static/img/school_logos/uoft_logo.png" className="school_logo" id="uoft_logo"
//             onClick={this.setSchool("uoft")}/>
//             <img src="/static/img/school_logos/jhu_logo.png" className="school_logo" id="jhu_logo"
//             onClick={this.setSchool("jhu")}/>
//           </div>
//         </div>
//       </div>
//     </div>);
//   },

//   setSchool: function(new_school) {
//     return (function(event) {
//       this.props.setSchool(new_school);
//       this.exitModal();
//     }).bind(this);

//   },

//   exitModal: function() {
//     this.props.handleCloseModal();
//   },

// });

/* 
TEMPORARILY REMOVED PREFERENCES: Grouped together, spread apart
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='groupedCheckbox' value='??' ref='grouped' onChange={this.handleGroupedChange}> I want my classes grouped together. </input>
//   </label>
// </div>
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='spreadCheckbox' value='??' ref='spread' onChange={this.handleSpreadChange}> I want my classes spread out. </input>
//   </label>
// </div>



*/
"use strict";
"use strict";

var SideMenu = React.createClass({
  displayName: "SideMenu",

  getInitialState: function getInitialState() {
    return {
      school: this.props.school,
      campuses: [1, 3, 5], // preference state variables
      num_campuses: 3,
      grouped: false,
      do_ranking: false,
      with_conflicts: this.props.initial_conflict,
      change_search: false, // variables which tell us whether to refresh search, timetable, or both
      change_timetable: true
    };
  },

  render: function render() {
    var copy_url_button = this.props.num_tts > 0 ? React.createElement("i", { id: "copy_tt_url",
      tabIndex: "0",
      className: "copy-url-button fa fa-3x fa-share-alt-square",
      "data-clipboard-target": "url_to_copy",
      role: "button",
      "data-container": "body",
      "data-toggle": "popover",
      "data-trigger": "focus",
      "data-placement": "auto left",
      title: "URL copied!",
      "data-content": "The URL for this timetable was copied to your clipboard. Share away!" }) : null;
    if (copy_url_button) {
      // add id to popover to change for mobile sized screens
      if ($('#copy_tt_url').data('bs.popover')) {
        $('#copy_tt_url').data('bs.popover').tip().addClass('url-share-popover');
      }
    }
    var school_logo = this.props.school == "uoft" ? React.createElement("img", { className: "pure-drawer-school-logo", src: "/static/img/school_logos/uoft_logo_white.png" }) : React.createElement("img", { className: "pure-drawer-school-logo", src: "/static/img/school_logos/jhu_logo_white.png" });

    if (this.refs.mornings) {
      var mornings_chosen = this.refs.mornings.refs.checkbox.checked;
      var evenings_chosen = this.refs.evenings.refs.checkbox.checked;
      var long_weekends_chosen = this.refs.weekends.refs.checkbox.checked;
      var conflicts_chosen = this.refs.conflicts.refs.checkbox.checked;
    } else {
      var mornings_chosen = false,
          evenings_chosen = false,
          long_weekends_chosen = false,
          conflicts_chosen = false;
    }

    return React.createElement(
      "div",
      { className: "side-menu-container", "data-effect": "pure-effect-scaleDown" },
      React.createElement(
        "div",
        { "data-position": "top" },
        React.createElement(
          "div",
          { className: "preferences-container" },
          React.createElement(
            "div",
            { className: "preferences-row", id: "top-row" },
            React.createElement(MenuOption, {
              ref: "mornings",
              icon: "hotel", text: "Mornings Free",
              method: this.handleMorningChange,
              chosen: mornings_chosen,
              loading: this.props.loading }),
            React.createElement(MenuOption, {
              ref: "evenings",
              icon: "moon-o", text: "Evenings Free",
              method: this.handleEveningChange,
              chosen: evenings_chosen,
              loading: this.props.loading })
          ),
          React.createElement(
            "div",
            { className: "preferences-row", id: "bottom-row" },
            React.createElement(MenuOption, {
              ref: "weekends",
              icon: "glass", text: "Long Weekends",
              method: this.handleLongWeekendChange,
              chosen: long_weekends_chosen,
              loading: this.props.loading }),
            React.createElement(MenuOption, {
              ref: "conflicts",
              icon: "exclamation", text: "Allow Conflicts",
              method: this.handleConflictChange,
              chosen: conflicts_chosen,
              loading: this.props.loading })
          )
        ),
        React.createElement(
          "div",
          null,
          this.props.copy_url,
          copy_url_button
        ),
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "fb-like",
            "data-href": "https://www.facebook.com/semesterly/",
            "data-layout": "button_count",
            "data-action": "like",
            "data-show-faces": "true", "data-share": "true" })
        )
      ),
      React.createElement("label", { className: "pure-overlay", htmlFor: "pure-toggle-top", "data-overlay": "top" })
    );
  },

  updateParentSettings: function updateParentSettings() {
    if (this.props.loading) {
      return;
    }
    var mornings_chosen = this.refs.mornings.refs.checkbox.checked;
    var evenings_chosen = this.refs.evenings.refs.checkbox.checked;
    var long_weekends = this.refs.weekends.refs.checkbox.checked;
    var with_conflicts = this.refs.conflicts.refs.checkbox.checked;

    var refresh_search = this.state.change_search;
    var refresh_tt = this.state.change_timetable;

    this.props.refreshPage(this.state.campuses, mornings_chosen, evenings_chosen, this.state.grouped, this.state.do_ranking, long_weekends, with_conflicts, this.state.change_timetable, this.state.change_search);
  },

  handleMorningChange: function handleMorningChange(new_value) {
    this.setState({ morning_chosen: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleEveningChange: function handleEveningChange(new_value) {
    this.setState({ evening_chosen: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleLongWeekendChange: function handleLongWeekendChange(new_value) {
    this.setState({ long_weekend: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleConflictChange: function handleConflictChange(new_value) {
    this.setState({ with_conflicts: new_value, change_timetable: true });
    this.updateParentSettings();
  },
  setWithConflicts: function setWithConflicts() {
    this.refs.conflicts.refs.checkbox.checked = true;
    this.setState({ with_conflicts: true, change_timetable: true });
  }

});
"use strict";

//			   [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#449DCA", "#fb6b5b", "#8A7BDD", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var half_hour_height = 21;
=======
//             [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#E26A6A", "#67809F", "#90C695", "#83D6DE", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];

var colour_to_highlight = {
    "#E26A6A": "#FF6766",
    "#67809F": "#76B0D4",
    "#90C695": "#95DC94",
    "#83D6DE": "#70E7E8"
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
}];
>>>>>>> 74528f7b285eddd87a6f08d030ec80ba5d25706f

var slot_attributes = {};
var slot_ids = [];

// A slot of 'arbitrary' size representing one session of a course
// e.g. M1, T2-3:30
var Slot = React.createClass({
	displayName: "Slot",

<<<<<<< HEAD
	getInitialState: function getInitialState() {
		return {};
	},

	render: function render() {
		var slot_top = this.props.start_index * half_hour_height;
		slot_top = String(slot_top + 1) + "px";
		var c = 'pointer';
		var text_style = {};
		var cls = "top-slot";
		if (!this.props.on_tt) {
			c = 'default';
			text_style = { margin: '2px 3px 0px 5px' };
			var instructors = this.props.instructors == null || this.props.instructors == '' ? null : React.createElement(
				"div",
				{ className: "fc-event-title", style: text_style },
				React.createElement(
					"small",
					null,
					React.createElement(
						"strong",
						null,
						this.props.instructors.slice(0, 3) == 'TBA' ? 'TBA' : this.props.instructors
					)
				)
			);
		} else {
			cls = "tt-slot";
			var instructors = this.props.instructors == null || this.props.instructors == '' ? null : React.createElement(
				"div",
				{ className: "fc-event-title", style: text_style },
				React.createElement(
					"strong",
					null,
					this.props.instructors.slice(0, 3) == 'TBA' ? 'TBA' : this.props.instructors
				)
			);
		}
		cls += " day-" + this.props.day;

		var slot_key = this.props.on_tt ? ' ' + String(this.props.key) : "";
=======
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
            border: "1px solid " + this.props.colour };
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
>>>>>>> 74528f7b285eddd87a6f08d030ec80ba5d25706f

		var column_width = $(".day-col").width() * .93;
		var slot_width = column_width * 0.9;
		var margin_width = (column_width - slot_width) / 2;

		var day_to_left_map = new Array();
		if (this.props.on_tt) {
			var conflict_shift = this.props.horizontal_slot * (slot_width / this.props.num_conflicts) * 1.15;
			var layer_shift = 7.5 * this.props.layer_shift;
			var total_shift = margin_width + conflict_shift + layer_shift;

			day_to_left_map['M'] = String($(".fc-mon").position().left + total_shift + "px");
			day_to_left_map['T'] = String($(".fc-tue").position().left + total_shift + "px");
			day_to_left_map['W'] = String($(".fc-wed").position().left + total_shift + "px");
			day_to_left_map['R'] = String($(".fc-thu").position().left + total_shift + "px");
			day_to_left_map['F'] = String($(".fc-fri").position().left + total_shift + "px");
		} else {
			day_to_left_map['M'] = String($(".fc-mon").position().left + margin_width + "px");
			day_to_left_map['T'] = String($(".fc-tue").position().left + margin_width + "px");
			day_to_left_map['W'] = String($(".fc-wed").position().left + margin_width + "px");
			day_to_left_map['R'] = String($(".fc-thu").position().left + margin_width + "px");
			day_to_left_map['F'] = String($(".fc-fri").position().left + margin_width * .75 + "px");
		}

		for (var i = 1; i <= 9; i++) {
			// top slots
			if ($(window).width() > 1080) {
				day_to_left_map[i] = String(265 + (i - 1) * 105 + "px");
			} else {
				day_to_left_map[i] = String(265 + (i - 1) * 85 + "px");
			}
		}
		var slot_height = String(this.props.duration * (2 * half_hour_height) - 9) + "px";
		var rl = { float: 'right', cursor: 'pointer' };
		var loc_style = { float: 'left', cursor: 'pointer' };
		var slot_style = {
			position: 'absolute',
			top: slot_top,
			height: slot_height,
			backgroundColor: this.props.color,
			width: this.props.width,
			cursor: c,
			border: '0px',
			left: day_to_left_map[this.props.day],
			zIndex: this.props.zInd
		};
		var location = this.props.num_conflicts == 1 ? React.createElement(
			"p",
			{ style: rl, className: "offering-location" },
			this.props.location
		) : null;
		var offering_time = this.props.num_conflicts == 1 || !this.props.on_tt ? React.createElement(
			"a",
			{ style: rl, className: "slot-link" },
			this.props.time
		) : null;

		if (this.props.on_tt) {
			var section = React.createElement(
				"div",
				{ className: "fc-event-title offering-section", style: text_style },
				React.createElement(
					"strong",
					null,
					" " + this.props.section
				),
				location
			);
		} else {
			var section = this.props.locked ? React.createElement(
				"div",
				{ className: "fc-event-title slot-locked offering-section", style: text_style, onClick: this.props.lockOrUnlockSection },
				React.createElement(
					"strong",
					null,
					React.createElement("i", { className: "fa fa-lock" }),
					" " + this.props.section
				),
				location
			) : React.createElement(
				"div",
				{ className: "fc-event-title slot-unlocked offering-section", style: text_style, onClick: this.props.lockOrUnlockSection },
				React.createElement(
					"strong",
					null,
					React.createElement("i", { className: "fa fa-unlock-alt" }),
					" " + this.props.section
				),
				location
			);
		}
		if (this.props.section[0] == 'T' || this.props.section[0] == 'P') {
			section = React.createElement(
				"div",
				{ className: "fc-event-title offering-section", style: text_style },
				React.createElement(
					"strong",
					null,
					" " + this.props.section
				),
				location
			);
		}

		var instructors = this.props.instructors == null || this.props.instructors == '' ? null : React.createElement(
			"div",
			{ className: "fc-event-title", style: text_style },
			React.createElement(
				"strong",
				null,
				this.props.instructors.slice(0, 3) == 'TBA' || this.props.instructors.slice(0, 3) == 'T.B' ? 'TBA' : this.props.instructors
			)
		);

		return React.createElement(
			"div",
			{ className: "fc-event fc-event-vert fc-event-draggable fc-event-start fc-event-end ui-draggable ui-resizable " + cls + slot_key, style: slot_style, "data-toggle": "tooltip", "data-placement": "bottom", title: this.props.name },
			React.createElement(
				"div",
				{ className: "fc-event-inner" },
				React.createElement(
					"div",
					{ className: "fc-event-title", style: text_style },
					React.createElement(
						"strong",
						null,
						this.props.code
					),
					" ",
					offering_time
				),
				section,
				instructors
			),
			React.createElement("div", { className: "fc-event-bg" }),
			React.createElement(
				"div",
				{ className: "ui-resizable-handle ui-resizable-s" },
				" "
			)
		);
	}
});

var TimetablePage = React.createClass({
	displayName: "TimetablePage",

<<<<<<< HEAD
	getInitialState: function getInitialState() {
		// Check for conflict flag in cookie/url
		var path = window.location.pathname.split("/");
		var url_data = path[2];
		var initial_conflict;
		var has_results = false;
		// first check for URL. if none, then check cookie. (sharing gets priority)
		if (url_data == null || url_data == "") {
			// no URL.
			if (document.cookie != "" && document.cookie != null) {
				// check for cookie.
				var courses = getCookie("data");
				if (courses != null) {
					var school_ = courses.split("&")[0];
				} else {
					var school_ = "";
				}
			}
		} else {
			// we're here from URL
			var school_ = url_data.split("&")[0];
			courses = url_data;
		}

		if (school_ != "jhu" && school_ != "uoft") {
			school_ = "";courses = "";
		}

		if (courses != "" && courses != null) {
			initial_conflict = courses.split("&")[2] == 't' ? true : false;
		} else {
			initial_conflict = false;
		}

		return { school: school_,
			all_tts: [], current_tt_id: null, all_slots: [], semester: 'S',
			all_f_tts: [], all_s_tts: [], current_f_tt_id: 0, current_s_tt_id: 0,
			all_f_slots: [], all_s_slots: [],
			course_to_colour: [], f_course_to_colour: [], s_course_to_colour: [],
			used_colours: [], f_used_colours: [], s_used_colours: [],
			loading: false, conflict: false, retry: false,
			campuses: [1, 3, 5], none_before: false, none_after: false, grouped: false, do_ranking: false, long_weekend: false, with_conflicts: initial_conflict,
			courses: [], f_courses: [], s_courses: [], selected_sections: {},
			search: true }; // search == true => search bar + search results show. false => side menu shows
	},

	hasSearchResults: function hasSearchResults(has_results) {
		this.setState({ has_results: has_results });
	},

	getTimetableSlots: function getTimetableSlots(ttable) {
		var i,
		    slots = [];
		for (var course in ttable) {
			var crs = ttable[course];
			for (var slot in crs[2]) {
				for (var k in crs[2][slot]) {
					slots.push(crs[2][slot][k]);
				}
			}
		}
		return slots;
	},

	updateTimetable: function updateTimetable(ttables, tt_id) {
		if (ttables.length > 0 && tt_id > ttables.length - 1 || tt_id < 0) {
			tt_id = 0;
		}
		if (this.state.semester == 'F') {
			var updated_mapping = this.state.course_to_colour;

			var updated_used_colours = this.state.used_colours;

			var ttable = ttables[tt_id];
			var i,
			    slots = [];

			// if a course was removed, remove its associated mapping from updated_mapping
			// and indicate its colour as available

			for (var course_code in updated_mapping) {
				var in_new_tt = false;
				for (var c in ttable) {
					if (ttable[c][0].code == course_code) {
						in_new_tt = true;
					}
				}
				if (!in_new_tt) {
					var colour_index = updated_mapping[course_code];
					delete updated_mapping[course_code];
					var del_index = updated_used_colours.indexOf(colour_index);
					updated_used_colours.splice(del_index, 1);
				}
			}

			for (var course in ttable) {
				var crs = ttable[course];
				for (var slot in crs[2]) {
					for (var k in crs[2][slot]) {
						slots.push(crs[2][slot][k]);
					}
				}
				var code = crs[0].code;
				if (updated_mapping[code] == null) {
					for (i = 0; i < colour_list.length; i++) {
						if (updated_used_colours.indexOf(i) == -1) {
							updated_mapping[code] = i; // update the prev course to colour mapping
							updated_used_colours.push(i);
							break;
						}
					}
				}
			}
			this.setState({ all_f_tts: ttables,
				all_tts: ttables,
				current_f_tt_id: tt_id,
				current_tt_id: tt_id,
				all_f_slots: slots,
				all_slots: slots,
				course_to_colour: updated_mapping,
				f_course_to_colour: updated_mapping,
				used_colours: updated_used_colours,
				f_used_colours: updated_used_colours,
				conflict: false });
		} else {

			var updated_mapping = this.state.course_to_colour;

			var updated_used_colours = this.state.used_colours;

			var ttable = ttables[tt_id];
			var i,
			    slots = [];

			// if a course was removed, remove its associated mapping from updated_mapping
			// and indicate its colour as available

			for (var course_code in updated_mapping) {
				var in_new_tt = false;
				for (var c in ttable) {
					if (ttable[c][0].code == course_code) {
						in_new_tt = true;
					}
				}
				if (!in_new_tt) {
					var colour_index = updated_mapping[course_code];
					delete updated_mapping[course_code];
					var del_index = updated_used_colours.indexOf(colour_index);
					updated_used_colours.splice(del_index, 1);
				}
			}

			for (var course in ttable) {
				var crs = ttable[course];
				for (var slot in crs[2]) {
					for (var k in crs[2][slot]) {
						slots.push(crs[2][slot][k]);
					}
				}
				var code = crs[0].code;
				if (updated_mapping[code] == null) {
					for (i = 0; i < colour_list.length; i++) {
						if (updated_used_colours.indexOf(i) == -1) {
							updated_mapping[code] = i; // update the prev course to colour mapping
							updated_used_colours.push(i);
							break;
						}
					}
				}
			}

			this.setState({ all_s_tts: ttables,
				all_tts: ttables,
				current_s_tt_id: tt_id,
				current_tt_id: tt_id,
				all_s_slots: slots,
				all_slots: slots,
				course_to_colour: updated_mapping,
				s_course_to_colour: updated_mapping,
				used_colours: updated_used_colours,
				s_used_colours: updated_used_colours,
				conflict: false });
		}
	},

	prevTimetable: function prevTimetable() {
		var total = this.state.all_tts.length;
		if (total > 1 && this.state.current_tt_id > 0) {
			var all_tts = this.state.all_tts;
			var new_id = this.state.current_tt_id - 1;
			var new_tt = all_tts[new_id];
			var slots = this.getTimetableSlots(new_tt);
			if (this.state.semester == 'F') {
				this.setState({ current_f_tt_id: new_id,
					current_tt_id: new_id,
					all_f_slots: slots,
					all_slots: slots });
			} else {
				this.setState({ current_s_tt_id: new_id,
					current_tt_id: new_id,
					all_s_slots: slots,
					all_slots: slots });
			}
		}
	},

	nextTimetable: function nextTimetable() {
		var total = this.state.all_tts.length;
		if (total > 1 && this.state.current_tt_id < total - 1) {
			var all_tts = this.state.all_tts;
			var new_id = this.state.current_tt_id + 1;
			var new_tt = all_tts[new_id];
			var slots = this.getTimetableSlots(new_tt);
			if (this.state.semester == 'F') {
				this.setState({ current_f_tt_id: new_id,
					current_tt_id: new_id,
					all_f_slots: slots,
					all_slots: slots });
			} else {
				this.setState({ current_s_tt_id: new_id,
					current_tt_id: new_id,
					all_s_slots: slots,
					all_slots: slots });
			}
		}
	},

	removeTimetable: function removeTimetable() {
		if (this.state.semester == 'F') {
			this.setState({ all_f_tts: [], all_tts: [], all_f_slots: [], all_slots: [], current_tt_id: 0, current_f_tt_id: 0, conflict: false,
				courses: [], f_courses: [], sections: {} });
		} else {
			this.setState({ all_s_tts: [], all_tts: [], all_s_slots: [], all_slots: [], current_tt_id: 0, current_s_tt_id: 0, conflict: false,
				courses: [], s_courses: [], sections: {} });
		}
	},
	setSchool: function setSchool(updated_school) {
		this.setState({ school: updated_school });
		setTimeout(this.beginTutorial, 500);
	},

	setSemester: function setSemester(sem) {
		if (sem == 'F') {
			this.setF();
		} else {
			this.setS();
		}
	},
	setF: function setF() {
		this.setState({ semester: 'F', all_tts: this.state.all_f_tts, current_tt_id: this.state.current_f_tt_id, all_slots: this.state.all_f_slots, course_to_colour: this.state.f_course_to_colour, used_colours: this.state.f_used_colours, conflict: false, courses: this.state.f_courses });
	},
	setS: function setS() {
		this.setState({ semester: 'S', all_tts: this.state.all_s_tts, current_tt_id: this.state.current_s_tt_id, all_slots: this.state.all_s_slots, course_to_colour: this.state.s_course_to_colour, used_colours: this.state.s_used_colours, conflict: false, courses: this.state.s_courses });
	},
	setConflict: function setConflict() {
		this.setState({ conflict: true });
	},
	setWithConflicts: function setWithConflicts() {
		this.setState({ with_conflicts: true });
		this.refs.side_menu.setWithConflicts();
	},
	tryWithConflicts: function tryWithConflicts() {
		this.setWithConflicts();
		this.refs.tta.refreshTimetable(this.state.courses);
	},
	removeConflictMsg: function removeConflictMsg() {
		this.setState({ conflict: false });
	},
	setRetry: function setRetry() {
		this.setState({ retry: false });
	},
	setLoading: function setLoading() {
		this.setState({ loading: true });
	},
	setDone: function setDone() {
		this.setState({ loading: false });
	},

	handleShowModal: function handleShowModal() {
		this.refs.preference_modal.show();
	},

	handleExternalHide: function handleExternalHide() {
		this.refs.tta.updateResults();
	},

	handleCloseModal: function handleCloseModal() {
		this.refs.preference_modal.hide();
	},

	handleCloseSchoolModal: function handleCloseSchoolModal() {
		this.refs.school_modal.hide();
	},

	refreshPage: function refreshPage(updated_campuses, updated_morning, updated_evening, updated_grouped, updated_ranking, updated_lw, updated_conflicts, refresh_tt, refresh_search) {
		this.setState({ campuses: updated_campuses,
			none_before: updated_morning,
			none_after: updated_evening,
			grouped: updated_grouped,
			do_ranking: updated_ranking,
			long_weekend: updated_lw,
			with_conflicts: updated_conflicts,
			retry: updated_conflicts == false ? true : false });
		// this.refs.preference_modal.hide();
		if (!refresh_search && refresh_tt && this.state.courses.length > 0) {
			this.refs.tta.refreshTimetable(this.state.courses);
		} else {
			this.refs.tta.updateResults(this.state.courses, refresh_tt);
		}
	},

	updateCourses: function updateCourses(chosen) {
		if (this.state.semester == 'F') {
			this.setState({ courses: chosen, f_courses: chosen });
		} else {
			this.setState({ courses: chosen, s_courses: chosen });
		}
		if (this.state.tutorial) {
			setTimeout((function () {

				this.setState({ tutorial: false });

				this.continueTutorial();
			}).bind(this), 200);
		}
	},
	continueTutorial: function continueTutorial() {
		+_.bind(function ($) {

			$(_.bind(function () {

				var intro = introJs();

				intro.setOptions({
					steps: [{
						element: '.tt-wrapper',
						intro: '<p class="h4 text-uc"><strong>2: Schedule</strong></p><p>Great job! Your course has now been added to your roster, and you can see exactly how it fits into your schedule right here.</p>',
						position: 'left'
					}, {
						element: '.fc-button-next',
						intro: '<p class="h4 text-uc"><strong>3: Cycle Through Timetables</strong></p><p>Once you\'ve chosen a set of courses, there may be more schedules for you to view –– each including the same courses but at different times. Click the arrows to cycle through <b>all</b> your potential schedules for the semester!</p>',
						position: 'left'
					}, {
						element: '.top-slot',
						intro: '<p class="h4 text-uc"><strong>4: Roster</strong></p><p>Up here is your entire roster –– all the courses you\'ve chosen this semester. If you like a particular section, click the Lock Icon (<i class="fa fa-unlock-alt"></i>) to Lock it in place – this will ensure that all timetables you see will only include this section.</p>',
						position: 'right'
					}, {
						element: '.fa-exchange',
						intro: '<p class="h4 text-uc"><strong>5: Preferences and Sharing</strong></p><p>Click the double arrow icon at anytime to set preferences –– for example, you can choose to sleep in or take Fridays off! We\'ll try to satisfy as many of your preferences as possible. Lastly, click the share icon to get a custom link to your timetable that you can share with your friends!</p>',
						position: 'right'
					}],
					showBullets: true
				});
				intro.setOptions({
					exitOnOverlayClick: false
				});

				intro.start();
			}, this));
		}, this)(jQuery);
	},
	updateSections: function updateSections(sections) {
		this.setState({ selected_sections: sections });
	},

	generateUrl: function generateUrl() {
		var url = "";
		if (this.state.all_tts.length > 0) {
			var conflict_flag = this.state.with_conflicts ? 't' : 'f';
			url = window.location.href + "/" + this.state.school + "&" + this.state.semester + "&" + conflict_flag + "&" + this.state.current_tt_id;
			var courses = this.state.courses;
			var sections = this.state.selected_sections;
			for (var i = 0; i < courses.length; i++) {
				url += "&" + String(h2.encode(courses[i]));
				var hex = hexEncode(sections[courses[i]]);
				url += '+' + String(h2.encodeHex(hex));
			}
		}
		return url;
	},

	render: function render() {

		var user_courses = [];
		if (this.state.all_tts.length != 0) {
			var cur_tt = this.state.all_tts[this.state.current_tt_id];
			var num_courses = cur_tt.length;
			for (var m = 0; m < num_courses; m++) {
				var course = cur_tt[m];
				// RELEVANT "IF" STATEMENT REMOVED FOR HOPKINS:
				// if (course[1].indexOf("L") > -1) {
				if (this.state.school == "uoft" && course[1].indexOf("L") > -1 || this.state.school != "uoft") {
					user_courses.push([course[0].id, course[0].code, course[1], course[2][0][0]]);
				}
			}
		}
		var c = -1;
		var days = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		var user_courses_display = user_courses.length == 0 ? null : user_courses.map((function (uc) {
			// these are the top slots

			c = c + 1;
			var nextColour = colour_list[c];
			var crs = new Array();
			crs['id'] = uc[0];
			var rm = !this.state.loading ? this.refs.tta.removeCourse(crs) : null;
			var close = React.createElement("i", { onClick: rm, className: "fa fa-times" });
			var co_obj = uc[3];
			var colour = colour_list[this.state.course_to_colour[uc[1]]];
			var w = window.width >= 768 ? "87px" : "105px";
			var is_locked = this.state.selected_sections[co_obj.course_id] == uc[2];
			var new_section = is_locked ? "" : co_obj.section;
			var lock_unlock = !this.state.loading ? this.refs.tta.updateSection(co_obj.course_id, new_section) : null;
			return React.createElement(
				"span",
				null,
				React.createElement(Slot, {
					code: uc[1],
					section: uc[2],
					locked: is_locked,
					locked_section: this.state.selected_sections[co_obj.course_id],
					name: co_obj.name,
					course_id: co_obj.course_id,
					instructors: co_obj.instructors,
					key: co_obj.id,
					day: days[c],
					start_index: .97,
					duration: 1.5,
					time: close,
					color: colour,
					width: w,
					on_tt: false,
					lockOrUnlockSection: lock_unlock })
			);
		}).bind(this));

		//  var course, code, title, lecture, off;
		var x = 9;
		var all_current_slots = this.state.all_slots.slice(0);
		all_current_slots.sort(function (a, b) {
			return b.depth_level - a.depth_level;
		});

		var slot_attributes = {};
		var slot_ids = [];
		var slots = all_current_slots.map((function (s) {
			// these are the on-timetable slots
			var nextColour = colour_list[this.state.course_to_colour[s.code]];
			x -= 1;
			var column_width = $(".day-col").width() * 0.93;
			var padding_factor = 0.9;
			var conflict_factor = 1 / s.num_conflicts * Math.pow(.93, s.num_conflicts - 1);
			var layer_factor = s.depth_level * 7.5;
			var w = String(column_width * padding_factor * conflict_factor) - layer_factor + "px";
			var is_locked = this.state.selected_sections[s.course_id] == s.section;
			var new_section = is_locked ? "" : s.section;
			var lock_unlock = !this.state.loading ? this.refs.tta.updateSection(s.course_id, new_section) : null;

			slot_ids.push(s.id);
			slot_attributes[s.id] = { col_width: column_width, padding_factor: padding_factor, conflict_factor: conflict_factor,
				layer_factor: layer_factor, shift_index: s.shift_index, num_conflicts: s.num_conflicts,
				depth_level: s.depth_level, day: s.day };

			return React.createElement(Slot, {
				zInd: x,
				code: s.code,
				name: s.name,
				course_id: s.course_id,
				section: s.section,
				locked: is_locked,
				locked_section: this.state.selected_sections[s.course_id],
				location: s.location,
				duration: s.duration,
				time: s.full_time,
				day: s.day,
				start_index: s.start_index,
				color: nextColour,
				width: w,
				on_tt: true,
				layer_shift: s.depth_level,
				num_conflicts: s.num_conflicts,
				horizontal_slot: s.shift_index,
				lockOrUnlockSection: lock_unlock,
				key: s.id });
		}).bind(this));

		var tt_count = this.state.all_tts.length;

		var prev_button = tt_count > 1 && this.state.current_tt_id > 0 ? React.createElement(
			"span",
			{ onClick: this.prevTimetable, className: "fc-button fc-button-prev fc-state-default fc-corner-left fc-corner-right", unselectable: "on" },
			React.createElement("a", { className: "btn btn-dark btn-md switch-tt fa fa-long-arrow-left" })
		) : React.createElement(
			"span",
			{ className: "fc-button fc-button-prev fc-state-default fc-corner-left fc-corner-right greyed", unselectable: "on" },
			React.createElement("a", { className: "btn btn-dark btn-md switch-tt fa fa-long-arrow-left disabled-arrow" })
		);

		var next_button = tt_count > 1 && this.state.current_tt_id < tt_count - 1 ? React.createElement(
			"span",
			{ onClick: this.nextTimetable, className: "fc-button fc-button-next fc-state-default fc-corner-left fc-corner-right", unselectable: "on" },
			React.createElement("a", { className: "btn btn-dark btn-md switch-tt fa fa-long-arrow-right" })
		) : React.createElement(
			"span",
			{ className: "fc-button fc-button-next fc-state-default fc-corner-left fc-corner-right greyed", unselectable: "on" },
			React.createElement("a", { className: "btn btn-dark btn-md switch-tt fa fa-long-arrow-right disabled-arrow" })
		);

		var loader = null;
		var load_or_not_style = {};
		if (this.state.loading) {
			prev_button = null;
			next_button = null;
			loader = React.createElement("i", { className: "fc-button fc-button-next fc-corner-left fc-corner-right fa fa-spin fa-cog tt-loader" });
			load_or_not_style = { opacity: '0.6' };
		}

		var second_semester_name = this.state.school == "jhu" ? "Spring" : "Winter";

		var timetable_semester = this.state.semester == 'F' ? "Fall 2015" : second_semester_name + " 2016";

		var vbox_style = { marginTop: '89px' };

		var conflict_msg = this.state.conflict && !this.state.with_conflicts ? React.createElement(
			"div",
			{ className: "alert alert-danger alert-dismissable conflict-msg" },
			React.createElement(
				"span",
				{ className: "fa-stack fa-lg" },
				React.createElement("i", { className: "fa fa-ban fa-stack-2x calendar-ban" })
			),
			"     ",
			React.createElement(
				"strong",
				null,
				"That course/section could not be added without a conflict!"
			),
			" Give it a shot with conflicts turned on!",
			React.createElement(
				"div",
				null,
				React.createElement(
					"button",
					{ type: "button", className: "btn btn-danger btn-conflict", onClick: this.tryWithConflicts },
					"Turn conflicts on"
				),
				React.createElement(
					"button",
					{ type: "button", className: "btn btn-danger btn-conflict", onClick: this.removeConflictMsg },
					"Exit"
				)
			)
		) : null;

		var num_tts_string = this.state.all_tts.length > 1 ? "timetables" : "timetable";
		// var num_timetables_generated = this.state.all_tts.length > 0 ? (<span className="fc-button fc-button-next label bg-light" id="num-tts-generated">{this.state.all_tts.length} {num_tts_string} generated!</span>) : null;
		var num_timetables_generated = null;

		var copy_style = { display: 'none' };
		var url = this.generateUrl();
		var copy_url = React.createElement(
			"p",
			{ id: "url_to_copy", style: copy_style },
			url
		);
		var copy_url_button = this.state.all_tts.length > 0 ? React.createElement("i", { id: "copy_tt_url",
			tabIndex: "0",
			className: "copy-url-button fa fa-2x fa-share-alt-square",
			"data-clipboard-target": "url_to_copy",
			role: "button",
			"data-toggle": "popover",
			"data-trigger": "focus",
			"data-placement": "left",
			title: "URL copied!",
			"data-content": "The URL for this timetable was copied to your clipboard. Share away!" }) : null;

		var school_picker = null;
		// var school_picker = this.state.school == "" ?
		// (<SchoolModal ref="school_modal"
		// 			  backdrop="static"
		// 			  show={true}
		// 			  header="Pick Your School"
		// 			  setSchool={this.setSchool}
		// 			  handleCloseModal={this.handleCloseSchoolModal}
		// 			>
		// </SchoolModal>
		// ) : null;

		var drawer_menu = null;
		// var drawer_menu = <DrawerMenu
		// 					ref="menu"
		// 					loading={this.state.loading}
		// 					school={this.state.school}
		// 					refreshPage={this.refreshPage}
		//    					handleCloseModal={this.handleCloseModal}
		// 					initial_conflict={this.state.with_conflicts}
		// 					num_tts={this.state.all_tts.length}
		// 					copy_url={copy_url}
		// 					> </DrawerMenu>;

		var search_bar = React.createElement(TimetableSearch, {
			display: this.state.search,
			ref: "tta",
			school: this.state.school,
			updateTimetable: this.updateTimetable,
			removeTimetable: this.removeTimetable,
			updateCourses: this.updateCourses,
			updateSections: this.updateSections,
			setRetry: this.setRetry,
			setWithConflicts: this.setWithConflicts,
			setF: this.setF,
			setS: this.setS,
			setConflict: this.setConflict,
			setLoading: this.setLoading,
			setDone: this.setDone,
			hasSearchResults: this.hasSearchResults,
			campuses: this.state.campuses,
			none_before: this.state.none_before,
			none_after: this.state.none_after,
			grouped: this.state.grouped,
			do_ranking: this.state.do_ranking,
			long_weekend: this.state.long_weekend,
			with_conflicts: this.state.with_conflicts,
			retry: this.state.retry,
			setSemester: this.setSemester });

		var side_menu = React.createElement(SideMenu, {
			ref: "side_menu",
			loading: this.state.loading,
			school: this.state.school,
			refreshPage: this.refreshPage,
			handleCloseModal: this.handleCloseModal,
			initial_conflict: this.state.with_conflicts,
			num_tts: this.state.all_tts.length,
			copy_url: copy_url });

		var switch_side_panel = React.createElement(
			"div",
			{ id: "bar-switcher" },
			React.createElement("i", { className: "fa fa-exchange fa-3x", id: "switch-sidebar-icon",
				onClick: this.switchSidePanel })
		);
		var mobileClassName = this.state.has_results ? "mobile-nav-sidebar expanded" : "mobile-nav-sidebar collapsed";
		return React.createElement(
			"div",
			{ id: "wrapper" },
			React.createElement("i", { className: "fa fa-question-circle help", onClick: this.beginTutorial }),
			React.createElement(
				"div",
				{ className: "collapse navbar-collapse navbar-ex1-collapse" },
				React.createElement(
					"ul",
					{ className: "nav navbar-nav side-nav cool-nav" },
					React.createElement("img", { className: "tt-logo", src: "/static/img/semesterly_shield_large.png" }),
					React.createElement(
						"div",
						{ className: "timetable-container" },
						switch_side_panel,
						side_menu,
						React.createElement(
							"div",
							{ className: mobileClassName },
							search_bar
						)
					)
				)
			),
			React.createElement(
				"div",
				{ id: "page-wrapper" },
				school_picker,
				React.createElement(
					"div",
					{ className: "separation" },
					user_courses_display,
					conflict_msg
				),
				React.createElement(
					"section",
					{ className: "vbox", style: vbox_style },
					React.createElement(
						"section",
						null,
						React.createElement(
							"section",
							{ className: "hbox stretch" },
							React.createElement(
								"section",
								{ id: "content" },
								React.createElement(
									"section",
									{ className: "hbox stretch" },
									React.createElement(
										"aside",
										null,
										React.createElement(
											"section",
											{ className: "vbox" },
											React.createElement(
												"section",
												{ className: "scrollable wrapper tt-wrapper" },
												React.createElement(
													"section",
													{ className: "panel panel-default" },
													React.createElement(
														"div",
														{ className: "fc fc-ltr", id: "calendar" },
														React.createElement(
															"table",
															{ className: "fc-header full-width" },
															React.createElement(
																"tbody",
																null,
																React.createElement(
																	"tr",
																	null,
																	React.createElement(
																		"td",
																		{ className: "fc-header-left" },
																		prev_button,
																		loader,
																		num_timetables_generated
																	),
																	React.createElement(
																		"td",
																		{ className: "fc-header-center" },
																		React.createElement(
																			"span",
																			{ className: "fc-header-title" },
																			React.createElement(
																				"h2",
																				null,
																				timetable_semester
																			)
																		)
																	),
																	React.createElement(
																		"td",
																		{ className: "fc-header-right" },
																		next_button
																	)
																)
															)
														),
														React.createElement(
															"div",
															{ className: "fc-content prel" },
															React.createElement(
																"div",
																{ className: "fc-view fc-view-agendaWeek fc-agenda prel", unselectable: "on", style: load_or_not_style },
																React.createElement(
																	"table",
																	{ className: "fc-agenda-days fc-border-separate full-width", cellSpacing: "0" },
																	React.createElement(
																		"thead",
																		null,
																		React.createElement(
																			"tr",
																			{ className: "fc-first fc-last" },
																			React.createElement(
																				"th",
																				{ className: "fc-agenda-axis fc-widget-header fc-first first-col" },
																				" "
																			),
																			React.createElement(
																				"th",
																				{ className: "fc-mon fc-col1 fc-widget-header day-col" },
																				"Monday"
																			),
																			React.createElement(
																				"th",
																				{ className: "fc-tue fc-col2 fc-widget-header day-col" },
																				"Tuesday"
																			),
																			React.createElement(
																				"th",
																				{ className: "fc-wed fc-col3 fc-widget-header day-col" },
																				"Wednesday"
																			),
																			React.createElement(
																				"th",
																				{ className: "fc-thu fc-col4 fc-widget-header day-col" },
																				"Thursday"
																			),
																			React.createElement(
																				"th",
																				{ className: "fc-fri fc-col5 fc-widget-header day-col fc-last" },
																				"Friday"
																			)
																		)
																	),
																	React.createElement(
																		"tbody",
																		null,
																		React.createElement(
																			"tr",
																			{ className: "fc-first fc-last" },
																			React.createElement(
																				"th",
																				{ className: "fc-agenda-axis fc-widget-header fc-first" },
																				" "
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-col0 fc-mon fc-widget-content" },
																				React.createElement(
																					"div",
																					{ className: "box-height" },
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement(
																							"div",
																							{ className: "prel" },
																							" "
																						)
																					)
																				)
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-col1 fc-tue fc-widget-content" },
																				React.createElement(
																					"div",
																					null,
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement(
																							"div",
																							{ className: "prel" },
																							" "
																						)
																					)
																				)
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-col2 fc-wed fc-widget-content" },
																				React.createElement(
																					"div",
																					null,
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement(
																							"div",
																							{ className: "prel" },
																							" "
																						)
																					)
																				)
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-col3 fc-thu fc-widget-content" },
																				React.createElement(
																					"div",
																					null,
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement(
																							"div",
																							{ className: "prel" },
																							" "
																						)
																					)
																				)
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-col4 fc-fri fc-widget-content" },
																				React.createElement(
																					"div",
																					null,
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement(
																							"div",
																							{ className: "prel" },
																							" "
																						)
																					)
																				)
																			),
																			React.createElement(
																				"td",
																				{ className: "fc-agenda-gutter fc-widget-content fc-last gutter1" },
																				" "
																			)
																		)
																	)
																),
																React.createElement(
																	"div",
																	{ className: "before-before-courses2" },
																	React.createElement("div", { className: "fc-event-container before-courses" }),
																	React.createElement(
																		"table",
																		{ className: "fc-agenda-allday full-width", cellSpacing: "0" },
																		React.createElement(
																			"tbody",
																			null,
																			React.createElement(
																				"tr",
																				null,
																				React.createElement(
																					"th",
																					{ className: "fc-widget-header fc-agenda-axis tt-time" },
																					"Time"
																				),
																				React.createElement(
																					"td",
																					null,
																					React.createElement(
																						"div",
																						{ className: "fc-day-content" },
																						React.createElement("div", { className: "prel after-time" })
																					)
																				)
																			)
																		)
																	),
																	React.createElement(
																		"div",
																		{ className: "fc-agenda-divider fc-widget-header" },
																		React.createElement("div", { className: "fc-agenda-divider-inner" })
																	),
																	React.createElement(
																		"div",
																		{ className: "tt-scroll" },
																		React.createElement(
																			"div",
																			{ className: "before-before-courses" },
																			React.createElement(
																				"div",
																				{ className: "fc-event-container before-courses" },
																				slots
																			),
																			React.createElement(
																				"table",
																				{ className: "fc-agenda-slots full-width", cellSpacing: "0" },
																				React.createElement(
																					"tbody",
																					null,
																					React.createElement(
																						"tr",
																						{ className: "fc-slot0 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"8am"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot1 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot2 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"9am"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot3 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot4 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"10am"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot5 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot6 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"11am"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot7 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot8 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"12pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot9 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot26 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"1pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot27 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot28 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"2pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot29 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot30 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"3pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot31 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot32 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"4pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot33 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot34 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"5pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot35 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot36 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"6pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot37 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot38 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"7pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot39 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot40 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"8pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot41 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot42 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"9pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot43 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot44 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"10pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot45 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot46 " },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							"11pm"
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					),
																					React.createElement(
																						"tr",
																						{ className: "fc-slot47 fc-minor" },
																						React.createElement(
																							"th",
																							{ className: "fc-agenda-axis fc-widget-header" },
																							" "
																						),
																						React.createElement(
																							"td",
																							{ className: "fc-widget-content" },
																							React.createElement(
																								"div",
																								{ className: "prel" },
																								" "
																							)
																						)
																					)
																				)
																			)
																		)
																	)
																)
															)
														)
													)
												)
											)
										)
									)
								),
								React.createElement("a", { href: "#", className: "hide nav-off-screen-block", "data-toggle": "className:nav-off-screen, open", "data-target": "#nav,html" })
							)
						)
					)
				)
			)
		);
	},

	componentWillUpdate: function componentWillUpdate() {},

	componentDidMount: function componentDidMount(props, state, root) {
		var after = $(".side-menu-container").fadeOut();
		this.maybeRemoveSearchResults();
	},
	beginTutorial: function beginTutorial() {
		if ($(window).width() <= 768) {
			return;
		} // no tutorial on mobile
		+_.bind(function ($) {

			$(_.bind(function () {

				var intro = introJs();

				intro.setOptions({
					steps: [{
						element: '.tt-logo',
						intro: '<p class="h4 text-uc"><strong>Welcome to Semester.ly!</strong></p><p>A course scheduler to help you find the best schedule with ease. Click Next to start a quick tutorial on how to get the most out of Semester.ly.</p>',
						position: 'right'
					}, {
						element: '.searchInput',
						intro: '<p class="h4 text-uc"><strong>1: Search</strong></p><p>This is the search bar. You\'ll find all your courses here –– when you are ready, click try, search for a course and click the (<i class="fa fa-plus"></i>) button to add it!</p>',
						position: 'right'
					}],
					showBullets: true
				});
				intro.setOptions({
					exitOnOverlayClick: false
				});

				intro.start();
				intro.oncomplete((function () {
					this.setState({ tutorial: true });
				}).bind(this));
			}, this));
		}, this)(jQuery);
	},

	componentDidUpdate: function componentDidUpdate(props, state, root) {
		var url_split = this.generateUrl().split("/");
		var cookie = url_split[url_split.length - 1];
		document.cookie = "data=" + cookie + "; expires=Sat, 31 Dec 2016 12:00:00 UTC;";
		var clip = new ZeroClipboard($("#copy_tt_url"));
		$("[data-toggle=popover]").popover();

		$("[data-toggle=tooltip]").tooltip();
		var window_width = $(window).width();
		for (var i = 2; i <= 9; i++) {
			if (window_width > 1080) {
				$(".day-" + i).css('left', 265 + (i - 1) * 115 + "px");
			} else {
				if (window.innerWidth > 767) {
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
	},

	maybeRemoveSearchResults: function maybeRemoveSearchResults() {
		$("#wrapper").click(_.bind(function (e) {
			if ($(window).width() > 767) {
				return;
			}
			var x = e.pageX;
			var y = e.pageY;
			var sr = $(".search-results");
			if (sr != [] && sr != null && sr.length > 0) {
				if (x < sr.offset().left || y > sr.offset().top + sr.height()) {
					this.refs.tta.nullifyResults();
				}
			}
		}, this));
	},

	switchSidePanel: function switchSidePanel() {

		if (this.state.search) {
			var now = $(".course-search-container");
			var after = $(".side-menu-container");
		} else {
			var now = $(".side-menu-container");
			var after = $(".course-search-container");
		}

		now.fadeOut(300, _.bind(function () {
			this.setState({ search: !this.state.search });
			after.fadeIn(300);
		}, this));
	}

});

$(window).unload(function () {
	$.ajax({
		type: 'POST',
		async: false,
		url: '/exit',
		data: { u_sid: sid }
	});
});

ReactDOM.render(React.createElement(TimetablePage, null), document.getElementById('timetable-page-container'));
"use strict";

var mx = 0;
var my = 0;
$(document).bind('mousemove', function (e) {
	mx = e.pageX;
	my = e.pageY;
});

var sid = "";
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = ca.length - 1; i >= 0; i--) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1, c.length);
		}if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

// generates a random string based of @length characters based on the input @chars (each character in the input adds to the mask)
function randomString(length, chars) {
	var mask = '';
	if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
	if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (chars.indexOf('#') > -1) mask += '0123456789';
	if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
	var result = '';
	for (var i = length; i > 0; --i) {
		result += mask[Math.round(Math.random() * (mask.length - 1))];
	}return result;
}

function getUserInfo() {
	var sid = randomString(25, "aA#!");
	var response1 = { 'sid': sid };
	$.post("/AX82mA2jjQ3r1z", response1, _.bind(function (response2) {}, this));
}

var TimetableSearch = React.createClass({
	displayName: "TimetableSearch",

	getInitialState: function getInitialState() {
		var path = window.location.pathname.split("/");
		window.history.pushState("", "", '/timetable');
		getUserInfo();
		var url_data = path[2];
		var school_ = "";
		var courses = "";
		var has_results = false;

		// first check for URL. if none, then check cookie. (sharing gets priority)
		if (url_data == null || url_data == "") {
			// no URL.
			if (document.cookie != "" && document.cookie != null) {
				// check for cookie.
				courses = getCookie("data");
				// next two lines were added to support cross-school compatibility
				if (courses != null) {
					school_ = courses.split("&")[0];
					courses = courses.substring(school_.length + 1);
				}
			}
		} else {
			// we're here from URL
			school_ = url_data.split("&")[0];
			courses = url_data.substring(school_.length + 1);
		}

		if (school_ != "jhu" && school_ != "uoft") {
			school_ = "";courses = "";
		}

		if (courses != "" && courses != null) {
			var sem = courses[0];
			if (sem == 'F' || sem == 'S') {
				courses = courses.substring(3);
				var courses = courses.split("&").slice(1);
				if (courses.length > 1 && courses.length <= 10) {
					var index = courses[0];
					courses = courses.slice(1);
					selected_secs = {};

					for (var j = 0; j < courses.length; j++) {
						var pair = courses[j].split('+');
						courses[j] = h2.decode(pair[0])[0];
						if (pair.length == 1) {
							selected_secs[courses[j]] = "";
						} else {
							var decoded = h2.decodeHex(pair[1]);
							selected_secs[courses[j]] = hexDecode(decoded);
						}
					}

					if (sem == 'F') {
						return { school: school_, course: "", results: [], loading: false, selected: courses,
							f_selected: courses,
							s_selected: [],
							semester: sem, tt_loading: false, tt_index: +index, novel: true, selected_sections: selected_secs };
					}

					return { school: school_, course: "", results: [], loading: false, selected: courses,
						f_selected: [],
						s_selected: courses,
						semester: sem, tt_loading: false, tt_index: +index, novel: true, selected_sections: selected_secs };
				}
			}
		} else {
			// Fresh visit to semesterly: no cookies, no shared link
		}

		return { school: "", course: "", results: [], loading: false, selected: [],
			f_selected: [],
			s_selected: [],
			semester: 'S', tt_loading: false, tt_index: 0, novel: false, selected_sections: {} };
	},

	setSearchResults: function setSearchResults(hasResults) {
		this.props.hasSearchResults(hasResults);
	},

	render: function render() {
		// var create_tt_btn = this.state.selected.length > 0 ? (<a className="btn btn-danger create-tt" onClick={this.createTimetable}>Create Timetable</a>) : (<a className="btn btn-danger create-tt" disabled>Create Timetable</a>);
		var load_btn = this.state.loading ? React.createElement(
			"span",
			null,
			React.createElement("i", { className: "fa fa-2x fa-refresh fa-spin load" })
		) : null;

		var results = this.state.course == "" || this.state.loading || this.state.results.length == 0 ? null : this.state.results.map((function (result) {
			var inSelected = this.state.selected.indexOf(result.id) > -1;
			var display = this.state.school == "jhu" ? result.name : result.code;
			return React.createElement(SearchResult, {
				key: result.id,
				school: this.state.school,
				sections: result.sections,
				locked_section: this.state.selected_sections[result.id],
				description: result.description,
				code: result.code,
				display: display,
				title: result.name,
				inRoster: inSelected,
				addCourse: this.addCourse.bind(this, result),
				removeCourse: this.removeCourse.bind(this, result),
				loading: this.state.loading });
		}).bind(this));
		var semester_f = this.state.semester == 'F' ? React.createElement(
			"a",
			{ onClick: this.setF, className: "btn btn-xs btn-default sem-button fall-button" },
			"Fall"
		) : React.createElement(
			"a",
			{ onClick: this.setF, className: "btn btn-xs sem-button fall-button greyed" },
			"Fall"
		);

		var second_semester_name = this.props.school == "jhu" ? "Spring" : "Winter";
		var semester_s = this.state.semester != 'F' ? React.createElement(
			"a",
			{ onClick: this.setS, className: "btn btn-xs btn-default sem-button" },
			second_semester_name
		) : React.createElement(
			"a",
			{ onClick: this.setS, className: "btn btn-xs sem-button greyed" },
			second_semester_name
		);

		var all_results = results != null && results.length > 0 ? React.createElement(
			"div",
			{ className: "search-results" },
			results
		) : null;
		return React.createElement(
			"div",
			{ className: "course-search-container" },
			React.createElement(
				"span",
				null,
				React.createElement("input", { className: "searchInput", onInput: this.inputChanged, onFocus: this.handleFocus, placeholder: "Course name, code or description" }),
				React.createElement("br", { className: "clear-both" }),
				semester_f,
				" ",
				semester_s,
				load_btn
			),
			all_results
		);
	},

	componentWillUpdate: function componentWillUpdate() {
		$('.popover').hide();
	},

	componentDidMount: function componentDidMount() {

		if (this.state.novel) {
			//cache/sharing url
			var sel = this.state.selected;
			this.createTimetable(sel, sel[0]);
			this.setState({ novel: false });
			if (this.state.semester == 'F') {
				this.setF();
			} else {
				this.setS();
			}
		}
	},

	inputChanged: function inputChanged(event) {
		var inp = event.target.value;
		if (inp == "") {
			this.setState({ course: inp, results: [], loading: false });
			this.setSearchResults(false);
		} else {
			this.setState({ course: inp, loading: true });
			this.getResults(inp, null, false);
		}
	},

	nullifyResults: function nullifyResults(event) {
		this.setSearchResults(false);
		// var current_results = this.state.results;
		// this.setState({results: [], temp_results: current_results});
	},

	handleFocus: function handleFocus(event) {
		if ($(window).width() > 767) {
			return;
		}
		this.setSearchResults(true);

		// if (this.state.temp_results && this.state.temp_results.length > 0) {
		// 	this.setState({results: this.state.temp_results});
		// }
	},

	setF: function setF() {
		if (!this.state.loading && !this.state.tt_loading) {
			this.setState({ 'semester': 'F', results: [], selected: this.state.f_selected, loading: false });
			this.props.setF();
			if (this.state.course.length > 0) {
				this.setState({ loading: true });
				this.getResults(this.state.course, null, false);
			} else {
				this.setSearchResults(false);
			}
		}
	},

	setS: function setS() {
		if (!this.state.loading && !this.state.tt_loading) {
			this.setState({ 'semester': 'S', results: [], selected: this.state.s_selected, loading: false });
			this.props.setS();
			if (this.state.course.length > 0) {
				this.setState({ loading: true });
				this.getResults(this.state.course, null, false);
			} else {
				this.setSearchResults(false);
			}
		}
	},
	updateSection: function updateSection(course_id, section) {
		if (!this.state.tt_loading) {

			return (function (event) {

				var new_selected_sections = this.state.selected_sections;
				new_selected_sections[course_id] = section;
				this.setState({ selected_sections: new_selected_sections });
				this.props.updateSections(new_selected_sections);
				this.createTimetable(this.state.selected, course_id);
			}).bind(this);
		} else {
			return null;
		}
	},
	addCourse: function addCourse(course, section) {
		var cid = course.id;
		if (!this.state.tt_loading) {

			return (function (event) {
				var chosen = this.state.selected;
				if (chosen.indexOf(cid) == -1) {
					chosen.push(cid);
					var new_selected_sections = this.state.selected_sections;
					new_selected_sections[cid] = section;
					if (this.state.semester == 'F') {
						this.setState({ selected: chosen, f_selected: chosen, selected_sections: new_selected_sections });
					} else {
						this.setState({ selected: chosen, s_selected: chosen, selected_sections: new_selected_sections });
					}
					this.createTimetable(chosen, cid);
				}
			}).bind(this);
		} else {
			return null;
		}
	},
	removeCourse: function removeCourse(course, section) {
		var cid = course.id;
		if (!this.state.tt_loading) {

			return (function (event) {

				var chosen = this.state.selected;
				var index = chosen.indexOf(cid);
				chosen.splice(index, 1);

				var new_selected_sections = this.state.selected_sections;
				if (cid in new_selected_sections) {
					delete new_selected_sections[cid];
				}

				if (this.state.semester == 'F') {
					this.setState({ selected: chosen, f_selected: chosen, selected_sections: new_selected_sections });
				} else {
					this.setState({ selected: chosen, s_selected: chosen, selected_sections: new_selected_sections });
				}
				if (chosen.length == 0) {
					this.props.removeTimetable();
					return;
				}

				this.createTimetable(chosen, cid);
			}).bind(this);
		} else {
			return null;
		}
	},
	hasResults: function hasResults() {
		return !(this.state.course == "" || this.state.loading || this.state.results.length == 0);
	},
	getSelected: function getSelected() {
		return this.state.selected;
	},

	createTimetable: function createTimetable(selected_courses, cid) {
		var _this = this;

		var school = this.state.school || "uoft";

		if (school != "jhu" && school != "uoft") {
			school = "uoft";
		}
		selected_courses = selected_courses.slice(0);
		$('.tooltip-inner').hide(); // to fix weird bug when removing courses via top <Slot /> list where the tooltip of the removed course stayed on screen
		$('.tooltip-arrow').hide();

		this.props.setLoading();
		this.setState({ tt_loading: true });
		var n = this.state.novel;
		this.props.updateSections(this.state.selected_sections);
		for (var i = 0; i < selected_courses.length; i++) {
			selected_courses[i] = h2.encode(selected_courses[i]);
		}
		var params = {
			school: school,
			courses: selected_courses,
			sections: this.state.selected_sections,
			semester: this.state.semester,
			novel: this.state.novel,
			no_classes_before: this.props.none_before,
			no_classes_after: this.props.none_after,
			grouped: this.props.grouped,
			do_ranking: this.props.do_ranking,
			try_with_conflicts: this.props.with_conflicts,
			long_weekend: this.props.long_weekend,
			u_sid: sid };
		$.post("/timetable/", params, function (response) {
			var chosen = _this.state.selected;
			if (response.length == 0) {
				// conflict in courses from URL, simply show empty timetable
				chosen = [];
			} //copy url on conflict, check tt index
			_this.props.setDone();
			_this.setState({ tt_loading: false, with_conflicts: false });
			if (response.length > 0 && response[0] == null) {
				// conflicts -> no possible timetables
				if (_this.props.retry) {
					var r = confirm("Turning off that preference will remove all of your courses. Are you sure you want to continue?");
					if (r == true) {
						// remove all courses
						_this.setState({ selected: [], f_selected: [], s_selected: [], selected_sections: {} });
						_this.props.removeTimetable();
					} else {
						// set with_conflicts back to true
						_this.props.setWithConflicts();
					}
				} else {
					_this.props.setConflict();
					var index = chosen.indexOf(cid);
					chosen.splice(index, 1);

					if (_this.state.semester == 'F') {
						_this.setState({ selected: chosen, f_selected: chosen });
					} else {
						_this.setState({ selected: chosen, s_selected: chosen });
					}
					_this.props.updateCourses(chosen);
				}
			} else {
				_this.props.setSemester(_this.state.semester);
				var ind = n ? _this.state.tt_index : 0;
				_this.props.updateTimetable(response, ind);
				_this.props.updateCourses(chosen);
			}
			_this.props.setRetry();
		}, "json");
	},

	updateResults: function updateResults(courses, refresh_timetable) {
		if (courses.length > 0) {
			this.setState({ loading: true });
			this.getResults(this.state.course, courses, refresh_timetable);
		} else {
			this.setSearchResults(false);
		}
	},

	getResults: _.debounce(function (inp, courses, refresh_timetable) {
		this.setState({ school: this.props.school });
		$.get("/tt_course_search", {
			school: this.props.school,
			searchQuery: inp,
			semester: this.state.semester,
			campuses: this.props.campuses,
			u_sid: sid }, _.bind(function (response) {
			this.setState({ results: response, loading: false });
			if (inp == "") {
				this.setSearchResults(false);
			} else if (this.state.results.length == 0) {
				this.setSearchResults(false);
			} else {
				this.setSearchResults(true);
			}
			if (refresh_timetable == true) {
				this.createTimetable(courses, null);
			}
		}, this));
	}, 300),

	refreshTimetable: _.debounce(function (courses) {
		this.createTimetable(courses, null);
	}, 300)

});

var h2 = new Hashids("x98as7dhg&h*askdj^has!kj?xz<!9");

var hexEncode = function hexEncode(s) {
	var hex, i;

	var result = "";
	for (i = 0; i < s.length; i++) {
		hex = s.charCodeAt(i).toString(16);
		result += ("000" + hex).slice(-4);
	}

	return result;
};

var hexDecode = function hexDecode(hex) {
	var j;
	var hexes = String(hex).match(/.{1,4}/g) || [];
	var back = "";
	for (j = 0; j < hexes.length; j++) {
		back += String.fromCharCode(parseInt(hexes[j], 16));
	}

	return back;
};
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
=======
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
                slot["colour"] = colour_list[course];
                slot["code"] = crs.code;
                slot["title"] = crs.title;
                slot["lecture_section"] = crs.lecture_section;
                slots_by_day[slot.day].push(slot);
>>>>>>> 74528f7b285eddd87a6f08d030ec80ba5d25706f
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 74528f7b285eddd87a6f08d030ec80ba5d25706f
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