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

var h2 = new Hashids("***REMOVED***");

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