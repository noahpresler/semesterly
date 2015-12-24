"use strict";

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

var slot_attributes = {};
var slot_ids = [];

var TimetablePage = React.createClass({
	displayName: "TimetablePage",

	render: function render() {
		return React.createElement(
			"div",
			null,
			"Hey"
		);
	}
});

// ReactDOM.render(
//   <TimetablePage />,
//   document.getElementById('timetable-page-container')
// );
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