(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["updateTimetables"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
var Root = require('./root');

courses = [];
_SCHOOL = "jhu";
_SEMESTER = "S";

ReactDOM.render(
  React.createElement(Root, null),
  document.getElementById('page')
);

},{"./root":"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
var SearchBar = require('./search_bar');

module.exports = React.createClass({displayName: "exports",

  render: function() {
    return (
      React.createElement("div", {id: "control-bar"}, 
        React.createElement("div", {id: "search-bar-container"}, 
          React.createElement(SearchBar, {toggleModal: this.props.toggleModal})
        ), 
        React.createElement("div", {id: "menu-container", className: "collapse"}, 
          React.createElement("div", {className: "navbar-collapse"}, 
            React.createElement("ul", {className: "nav navbar-nav", id: "menu"}, 
              React.createElement("li", null, 
                React.createElement("a", {href: "#fakelink"}, "Preferences"), 
                React.createElement("ul", null, 
                  React.createElement("div", {className: "preference-item"}, 
                    React.createElement("div", {className: "preference-text"}, 
                      React.createElement("li", null, " Avoid early classes ")
                    ), 
                    React.createElement("div", {className: "preference-toggle"}, 
                      React.createElement("div", {className: "switch"}, 
                        React.createElement("input", {id: "cmn-toggle-1", defaultChecked: true, className: "cmn-toggle cmn-toggle-round", type: "checkbox"}), 
                        React.createElement("label", {htmlFor: "cmn-toggle-1"})
                      )
                    )
                  ), 
                  React.createElement("div", {className: "preference-item"}, 
                    React.createElement("div", {className: "preference-text"}, 
                      React.createElement("li", null, " Avoid late classes ")
                    ), 
                    React.createElement("div", {className: "preference-toggle"}, 
                      React.createElement("div", {className: "switch"}, 
                        React.createElement("input", {id: "cmn-toggle-2", defaultChecked: true, className: "cmn-toggle cmn-toggle-round", type: "checkbox"}), 
                        React.createElement("label", {htmlFor: "cmn-toggle-2"})
                      )
                    )
                  ), 
                  React.createElement("div", {className: "preference-item"}, 
                    React.createElement("div", {className: "preference-text"}, 
                      React.createElement("li", null, " Allow conflicts ")
                    ), 
                    React.createElement("div", {className: "preference-toggle"}, 
                      React.createElement("div", {className: "switch"}, 
                        React.createElement("input", {id: "cmn-toggle-3", defaultChecked: true, className: "cmn-toggle cmn-toggle-round", type: "checkbox"}), 
                        React.createElement("label", {htmlFor: "cmn-toggle-3"})
                      )
                    )
                  )
                )
              ), 
              React.createElement("li", null, React.createElement("a", {href: "#fakelink"}, "Profile")), 
              React.createElement("ul", null, 
                React.createElement("div", {className: "profile-text"}, 
                  React.createElement("li", null, "Favorites")
                )
              ), 
              React.createElement("ul", null, 
                React.createElement("div", {className: "profile-text"}, 
                  React.createElement("li", null, "Friends")
                )
              ), 
              React.createElement("ul", null, 
                React.createElement("div", {className: "profile-text"}, 
                  React.createElement("li", null, "Sign Out")
                )
              )
            )
          )
        )
      )

    );
  },
});

},{"./search_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",

	render: function() {

		return (
            React.createElement("div", {id: "load"}, 
                React.createElement("div", {className: "sk-cube-grid"}, 
	                React.createElement("div", {className: "sk-cube sk-cube1"}), 
	                React.createElement("div", {className: "sk-cube sk-cube2"}), 
	                React.createElement("div", {className: "sk-cube sk-cube3"}), 
	                React.createElement("div", {className: "sk-cube sk-cube4"}), 
	                React.createElement("div", {className: "sk-cube sk-cube5"}), 
	                React.createElement("div", {className: "sk-cube sk-cube6"}), 
	                React.createElement("div", {className: "sk-cube sk-cube7"}), 
	                React.createElement("div", {className: "sk-cube sk-cube8"}), 
	                React.createElement("div", {className: "sk-cube sk-cube9"})
                )
            ));
	},
});

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
var Loader = require('./loader');
var course_info_store = require('./stores/course_info');

module.exports = React.createClass({displayName: "exports",
	mixins: [Reflux.connect(course_info_store)],

	render: function() {
		var loader = this.state.loading ? React.createElement(Loader, null) : null;
		var header = this.state.loading ? null : this.getHeader()
		var description = this.state.loading ? null : this.getDescription()
		var evaluations = this.state.loading ? null : this.getEvaluations()
		var recomendations = this.state.loading ? null : this.getRecomendations()
		var textbooks =this.state.loading ? null : this.getTextbooks()
		var sections = this.state.loading ? null : this.getSections()
		return (
			React.createElement("div", {id: "modal-content"}, 
                loader, 
                header, 
                description, 
                evaluations, 
                sections, 
                textbooks, 
                recomendations
            ));
	},

	getHeader: function() {
		var header = (React.createElement("div", {className: "modal-header"}, 
			React.createElement("div", {id: "name"}, this.state.course_info.name), 
			React.createElement("div", {id: "code"}, this.state.course_info.code)
		))
		return header
	},

	getDescription: function() {
		var description = 
			(React.createElement("div", {className: "modal-entry", id: "course-description"}, 
				React.createElement("h6", null, "Description:"), 
				this.state.course_info.description
			))
		return description
	},

	getEvaluations: function() {
		var eval_items = this.state.course_info.eval_info.map(function(e) {
			return (
				React.createElement("div", {className: "eval-item"}, 
					React.createElement("div", {className: "year"}, e.year), 
					React.createElement("div", {className: "rating-wrapper"}, 
						React.createElement("div", {className: "star-ratings-sprite"}, React.createElement("span", {style: {width: 100*e.score/5 + "%"}, className: "rating"})), 
						React.createElement("div", {className: "numeric-rating"}, "(" + e.score + ")")
					)
				)
				)
		}.bind(this));
		evals = (
			React.createElement("div", {className: "eval-wrapper"}, 
				eval_items
			))
		var click_notice = this.state.course_info.eval_info.length == 0 ? null : (
			React.createElement("div", {id: "eval-intro"}, "Click an evaluation item above to read the comments"))
		var evaluations = 
			(React.createElement("div", {className: "modal-entry", id: "course-evaluations"}, 
				React.createElement("h6", null, "Course Evaluations:"), 
				evals, 
				click_notice
			))
		return evaluations
	},

	getRecomendations: function() {
		var related = this.state.course_info.related_courses.slice(0,3).map(function(rc) {
            return (
            	React.createElement("div", {id: "recomendation"}, 
            		React.createElement("div", {id: "rec-wrapper"}, 
	            		React.createElement("div", {id: "name"}, rc.name), 
	            		React.createElement("div", {id: "code"}, rc.code)
	            	)
            	))
        }.bind(this));
		var recomendations = 
			(React.createElement("div", {className: "modal-entry"}, 
				React.createElement("h6", null, "Courses You Might Like:"), 
				React.createElement("div", {id: "course-recomendations"}, 
					related
				)
			))
		return recomendations
	},

	getTextbooks: function() {
		var textbook_elements = this.state.course_info.textbook_info[0].textbooks.map(function(tb) {
            return (
            	React.createElement("div", {className: "textbook"}, 
            		React.createElement("img", {height: "125", src: tb.image_url}), 
            		React.createElement("h6", null, tb.title), 
            		React.createElement("div", null, tb.author), 
            		React.createElement("div", null, "ISBN:", tb.isbn), 
            		React.createElement("a", {href: tb.detail_url, target: "_blank"}, 
            			React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
            		)
            	))
        }.bind(this));
		var textbooks = 
			(React.createElement("div", {className: "modal-entry", id: "course-textbooks"}, 
				React.createElement("h6", null, "Textbooks:"), 
				React.createElement("div", {id: "textbooks"}, 
	            	textbook_elements
	            )
			))
		return textbooks
	},

	getSections: function() {
		// var F = this.state.course_info.sections_S.map(function(f){
		// 	return (<div>
		// 		{f}
		// 	</div>)
		// }.bind(this));
		// var S = this.state.course_info.sections_F.map(function(s){
		// 	return (<div>
		// 		{s}
		// 	</div>)
		// }.bind(this));
		// var sections = 
		// 	(<div className="modal-entry" id="course-sections">
		// 		<h6>Course Sections:</h6>
		// 		{F}
		// 		{S}
		// 	</div>)
		// return sections
		return null
	},


});

},{"./loader":"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx","./stores/course_info":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
  getInitialState: function() {
    return {first_displayed: 0};
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first_displayed button (timetable)
       var new_first = current + (9*direction) - (current % 9);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

  render: function() {
    var options = [], count = this.props.count, current = this.props.current_index;
    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    var first = current - (current % 9); // round down to nearest multiple of 9
    var limit = Math.min(first + 9, count);
    for (var i = first; i < limit; i++) {
      var className = this.props.current_index == i ? "active" : "";
      options.push(
        React.createElement("li", {key: i, className: className}, 
              React.createElement("a", {onClick: this.props.setIndex(i)}, i + 1)
        ));
    }

    return (
      React.createElement("div", {id: "pagination-container"}, 
        React.createElement("div", {className: "pagination pagination-minimal"}, 
          React.createElement("ul", null, 
            React.createElement("li", {className: "prev-double", onClick: this.changePage(-1)}, 
              React.createElement("div", {className: "pagination-btn"}, 
                React.createElement("span", {className: "fa fa-angle-double-left"}))
            ), 
            React.createElement("li", {className: "previous"}, 
              React.createElement("a", {className: "fui-arrow-left pagination-btn", 
                onClick: this.props.prev})
            ), 
            options, 
            
            React.createElement("li", {className: "next"}, 
              React.createElement("a", {className: "fui-arrow-right pagination-btn", 
                onClick: this.props.next})
            ), 
            React.createElement("li", {className: "next-double", onClick: this.changePage(1)}, 
              React.createElement("div", {className: "pagination-btn"}, 
                React.createElement("span", {className: "fa fa-angle-double-right"}))
            )
          )
        )
      )
    );
  },
  

});

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var course_actions = require('./actions/course_actions');
    
module.exports = React.createClass({displayName: "exports",
  getInitialState:function() {
    this.getCourses();

    return {};
  },
  render: function() {
    var Modal = Boron['OutlineModal'];

    return (
      React.createElement("div", {id: "root"}, 
        React.createElement("div", {id: "control-bar-container"}, 
          React.createElement(ControlBar, {toggleModal: this.toggleCourseModal})
        ), 
        React.createElement("div", {id: "modal-container"}, 
          React.createElement(Modal, {ref: "OutlineModal", className: "course-modal"}, 
              React.createElement(ModalContent, null)
          )
        ), 
        React.createElement("div", {id: "cal-container"}, 
          React.createElement(Timetable, {toggleModal: this.toggleCourseModal})
        )
      )
    );
  },

  toggleCourseModal: function(course_id) {
    return function() {
        this.refs['OutlineModal'].toggle();
        course_actions.getCourseInfo(course_id);
    }.bind(this); 
  },

  getCourses: function() {
    $.get("/courses/" + _SCHOOL + "/" + _SEMESTER, 
        {}, 
        function(response) {
          courses = response;
        }.bind(this)
    );
  },

});

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/home/linoah/Documents/semesterly/static/js/new_timetable/modal_content.jsx","./timetable":"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var SearchResult = React.createClass({displayName: "SearchResult",
  render: function() {
    var li_class = "search-result", icon_class = "fui-plus";
    if (this.props.in_roster) {
      li_class += " todo-done";
      icon_class = "fui-check";
    }
    return (
      React.createElement("li", {className: li_class, onMouseDown: this.props.toggleModal(this.props.id)}, 
        React.createElement("div", {className: "todo-content"}, 
          React.createElement("h4", {className: "todo-name"}, 
            this.props.code
          ), 
          this.props.name
        ), 
        React.createElement("span", {className: "search-result-action " + icon_class, 
          onMouseDown: this.toggleCourse}
        )
      )
    );
  },

  toggleCourse: function(e) {
    var removing = this.props.in_roster;
    TimetableActions.updateTimetables({id: this.props.id, section: '', removing: removing});
    e.preventDefault();  // stop input from triggering onBlur and thus hiding results
    e.stopPropagation(); // stop parent from opening modal
  },

});

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

  getInitialState: function() {
    return {
      results: [],
      focused: false,
    };
  },

  render: function() {
    var search_results_div = this.getSearchResultsComponent();
    return (
      React.createElement("div", {id: "search-bar"}, 
        React.createElement("div", {className: "input-combine"}, 
          React.createElement("input", {
            type: "text", 
            placeholder: "Search by code, title, description, professor, degree", 
            id: "search-input", 
            ref: "input", 
            onFocus: this.focus, onBlur: this.blur, 
            onInput: this.queryChanged}), 
          React.createElement("button", {"data-toggle": "collapse", "data-target": "#menu-container", id: "menu-btn"}, 
            React.createElement("i", {className: "fa fa-bars fa-2x"})
          ), 
          search_results_div
        )
      )
    );
  },

  getSearchResultsComponent: function() {
    if (!this.state.focused || this.state.results.length == 0) {return null;}
    var i = 0;
    var search_results = this.state.results.map(function(r) {
      i++;
      var in_roster = this.state.courses_to_sections[r.id] != null;
      return (
        React.createElement(SearchResult, React.__spread({},  r, {key: i, in_roster: in_roster, toggleModal: this.props.toggleModal}))
      );
    }.bind(this));
    return (
      React.createElement("div", {id: "search-results-container"}, 
        React.createElement("div", {className: "todo mrm"}, 
            React.createElement("ul", {id: "search-results"}, 
              search_results
            )
          )
      )
    );
  },

  focus: function() {
    this.setState({focused: true});
  },

  blur: function() {
    this.setState({focused: false});
  },

  queryChanged: function(event) {
    var query = event.target.value.toLowerCase();
    var filtered = query.length <= 1 ? [] : this.filterCourses(query);
    this.setState({results: filtered});
  },

  filterCourses: function(query) {
    var results = courses.filter(function(c) {
      return (c.code.toLowerCase().indexOf(query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1);
    });
    return results;
  },


});

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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

var Slot = React.createClass({displayName: "Slot",
    getInitialState: function() {
        return {show_buttons: false};
    },

    render: function() {
        var pin = null, remove_button = null;
        var slot_style = this.getSlotStyle();
        if (this.state.show_buttons) {
            pin = (
            React.createElement("div", {className: "slot-inner bottom"}, 
                React.createElement("div", {className: "button-surround", onClick: this.pinCourse}, 
                    React.createElement("span", {className: "fa fa-thumb-tack"})
               )
            ));
            remove_button = ( React.createElement("div", {className: "slot-inner"}, 
                React.createElement("div", {className: "button-surround", onClick: this.removeCourse}, 
                    React.createElement("span", {className: "fa fa-times remove"})
               )
            ));
        }
        if (this.props.pinned) {
            pin = (
            React.createElement("div", {className: "slot-inner bottom"}, 
                React.createElement("div", {className: "button-surround pinned", onClick: this.unpinCourse}, 
                    React.createElement("span", {className: "fa fa-thumb-tack"})
               )
            ));
        }

    return (
            React.createElement("div", {
                onClick: this.props.toggleModal(this.props.course), 
                onMouseEnter: this.highlightSiblings, 
                onMouseLeave: this.unhighlightSiblings, 
                className: "slot-outer fc-time-grid-event fc-event slot slot-" + this.props.course, 
                style: slot_style}, 
                remove_button, 
                React.createElement("div", {className: "fc-content"}, 
                  React.createElement("div", {className: "fc-time"}, 
                    React.createElement("span", null, this.props.time_start, " – ", this.props.time_end)
                  ), 
                  React.createElement("div", {className: "fc-title slot-text-row"}, this.props.code + " " + this.props.meeting_section), 
                  React.createElement("div", {className: "fc-title slot-text-row"}, this.props.name)
                ), 
                pin
            )
        );
    },

    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        var top = (start_hour - 8)*52 + (start_minute)*(26/30);
        var bottom = (end_hour - 8)*52 + (end_minute)*(26/30) - 1;
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
        TimetableActions.updateTimetables({id: this.props.course, 
            section: this.props.meeting_section, 
            removing: false});
        e.stopPropagation();
    },
    unpinCourse: function(e) {
        TimetableActions.updateTimetables({id: this.props.course, 
            section: '', 
            removing: false});
        e.stopPropagation();
    },
    removeCourse: function(e) {
        TimetableActions.updateTimetables({id: this.props.course, 
            section: '', 
            removing: true});
        e.stopPropagation();
    },

    updateColours: function(colour) {
        $(".slot-" + this.props.course)
          .css('background-color', colour)
          .css('border-color', colour);
    },

});

module.exports = React.createClass({displayName: "exports",

    render: function() {
        var days = ["M", "T", "W", "R", "F"];
        var slots_by_day = this.getSlotsByDay();
        var all_slots = days.map(function(day) {
            var day_slots = slots_by_day[day].map(function(slot) {
                var p = this.isPinned(slot);
                return React.createElement(Slot, React.__spread({},  slot, {toggleModal: this.props.toggleModal, key: slot.id, pinned: p}))
            }.bind(this));
            return (
                    React.createElement("td", {key: day}, 
                        React.createElement("div", {className: "fc-event-container"}, 
                            day_slots
                        )
                    )
            );
        }.bind(this));
        return (
            React.createElement("table", null, 
              React.createElement("tbody", null, 
                React.createElement("tr", null, 
                  React.createElement("td", {className: "fc-axis"}), 
                  all_slots
                )
              )
            )

        );
    },
   
    componentDidMount: function() {
        var days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
        var d = new Date();
        var selector = ".fc-" + days[d.getDay()];
        // $(selector).addClass("fc-today");
    },

    isPinned: function(slot) {
        var comparator = this.props.courses_to_sections[slot.course]['C'];
        if (_SCHOOL == "uoft") {
            comparator = this.props.courses_to_sections[slot.course][slot.meeting_section[0]];
        }
        return comparator == slot.meeting_section;

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
                slot["name"] = crs.name;
                slots_by_day[slot.day].push(slot);
            }
        }
        return slots_by_day;
    },

});

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
var course_actions = require('../actions/course_actions.js');

module.exports = Reflux.createStore({
  listenables: [course_actions],

  getCourseInfo: function(course_id) {
    $.get("/courses/"+ _SCHOOL + "/id/" + course_id, 
         {}, 
         function(response) {
            this.trigger({loading: false, course_info: response});
            console.log(response)
         }.bind(this)
    );

  },

  getInitialState: function() {
    return {course_info: null, loading: true};
  }
});

},{"../actions/course_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
var actions = require('../actions/update_timetables.js');


var obj = {
  school: "jhu",
  semester: "S",
  courses_to_sections: {},
  preferences: {
    'no_classes_before': false,
    'no_classes_after': false,
    'long_weekend': false,
    'grouped': false,
    'do_ranking': false,
    'try_with_conflicts': false
  }
}

module.exports = Reflux.createStore({
  listenables: [actions],
  courses_to_sections: {},

  updateTimetables: function(new_course_with_section) {
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var section = new_course_with_section.section;
    var c_to_s = $.extend(true, {}, this.courses_to_sections); // deep copy of this.courses_to_sections
    
    if (!removing) { // adding course
      if (obj.school == "jhu") {
        c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': new_course_with_section.section};
      }
      else if (obj.school == "uoft") {
        var locked_sections = {'L': '', 'T': '', 'P': '', 'C': ''} // this is what we want to send if not locking
        if (section) { // locking
          if (c_to_s[new_course_id] != null) {
            locked_sections = c_to_s[new_course_id]; // copy the old mapping
            // in case some sections were already locked for this course,
            // and now we're about to lock a new one.
          }
          locked_sections[section[0]] = section;
        }
        c_to_s[new_course_id] = locked_sections;
      }
    }
    else { // removing course
      delete c_to_s[new_course_id];
      if (Object.keys(c_to_s).length == 0) { // removed last course
          this.courses_to_sections = {};
          this.trigger(this.getInitialState());
          return;  
      }
    }
    obj.courses_to_sections = c_to_s; // to make the POST request
    $.post('/timetable/', JSON.stringify(obj), function(response) {
        if (response.length > 0) {
            this.courses_to_sections = c_to_s;
            this.trigger({
                timetables: response,
                courses_to_sections: this.courses_to_sections,
                current_index: 0,
                loading: false
            });
        }
        else {
          this.trigger({loading: false});
        }
    }.bind(this));
  },

  getInitialState: function() {
    return {
      timetables: [], 
      courses_to_sections: {}, 
      current_index: -1, 
      loading: false};
  }
});

},{"../actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  nextTimetable: function() {
    if (this.state.current_index + 1 < this.state.timetables.length) {
      this.setState({current_index: this.state.current_index + 1});
    }
  },

  prevTimetable: function() {
    if (this.state.current_index > 0) {
      this.setState({current_index: this.state.current_index - 1});
    }    
  },

  setIndex: function(new_index) {
    return(function () {
      this.setState({current_index: new_index});
    }.bind(this));
  },

  render: function() {
      var slot_manager = this.state.timetables.length == 0 ? null :
       (React.createElement(SlotManager, {toggleModal: this.props.toggleModal, 
                     timetables: this.state.timetables[this.state.current_index], 
                     courses_to_sections: this.state.courses_to_sections}));
      var loader = !this.state.loading ? null :
      (  React.createElement("div", {className: "spinner"}, 
            React.createElement("div", {className: "rect1"}), 
            React.createElement("div", {className: "rect2"}), 
            React.createElement("div", {className: "rect3"}), 
            React.createElement("div", {className: "rect4"}), 
            React.createElement("div", {className: "rect5"})
        ))
      return (

          React.createElement("div", {id: "calendar", className: "fc fc-ltr fc-unthemed"}, 
              loader, 
              React.createElement("div", {className: "fc-toolbar"}, 
                React.createElement("div", {className: "fc-center"}, 
                  React.createElement("h2", {className: "light semester-display"}, "Fall 2016")
                ), 
                React.createElement("div", {className: "fc-clear"})
              ), 
              React.createElement(Pagination, {
                count: this.state.timetables.length, 
                next: this.nextTimetable, 
                prev: this.prevTimetable, 
                setIndex: this.setIndex, 
                current_index: this.state.current_index}), 

              React.createElement("div", {className: "fc-view-container"}, 
                React.createElement("div", {className: "fc-view fc-agendaWeek-view fc-agenda-view"}, 
                  React.createElement("table", null, 
                    React.createElement("thead", null, 
                      React.createElement("tr", null, 
                        React.createElement("td", {className: "fc-widget-header"}, 
                          React.createElement("div", {className: "fc-row fc-widget-header", id: "custom-widget-header"}, 
                            React.createElement("table", null, 
                              React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                  React.createElement("th", {className: "fc-axis fc-widget-header"}), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-mon"}, "Mon "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-tue"}, "Tue "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-wed"}, "Wed "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-thu"}, "Thu "), 
                                  React.createElement("th", {className: "fc-day-header fc-widget-header fc-fri"}, "Fri ")
                                )
                              )
                            )
                          )
                        )
                      )
                    ), 

                    React.createElement("tbody", null, 
                      React.createElement("tr", null, 
                        React.createElement("td", {className: "fc-widget-content"}, 
                          React.createElement("div", {className: "fc-day-grid"}, 
                            
                              React.createElement("div", {className: "fc-content-skeleton"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis"}), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null), 
                                      React.createElement("td", null)
                                    )
                                  )
                                )
                              )
                            ), 
                          React.createElement("div", {className: "fc-time-grid-container fc-scroller", id: "calendar-inner"}, 
                            React.createElement("div", {className: "fc-time-grid"}, 
                              React.createElement("div", {className: "fc-bg"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-mon"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-tue"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-wed"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-thu"}), 
                                      React.createElement("td", {className: "fc-day fc-widget-content fc-fri"})
                                    )
                                  )
                                )
                              ), 
                              React.createElement("div", {className: "fc-slats"}, 
                                React.createElement("table", null, 
                                  React.createElement("tbody", null, 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "8am")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "9am")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "10am")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "11am")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "12pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "1pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "2pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "3pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "4pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "5pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "6pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "7pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "8pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "9pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "10pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", null, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, "11pm")), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    ), 
                                    React.createElement("tr", {className: "fc-minor"}, 
                                      React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
                                      React.createElement("td", {className: "fc-widget-content"})
                                    )
                                  )
                                )
                              ), 
                              React.createElement("hr", {className: "fc-widget-header", id: "widget-hr"}), 
                              React.createElement("div", {className: "fc-content-skeleton", id: "slot-manager"}, 
                                slot_manager
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
      );
  },


});

},{"./pagination":"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}]},{},["/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FwcC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvY29udHJvbF9iYXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2xvYWRlci5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kYWxfY29udGVudC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcm9vdC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VhcmNoX2Jhci5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2xvdF9tYW5hZ2VyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvY291cnNlX2luZm8uanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RpbWV0YWJsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxrQkFBa0IsQ0FBQztDQUNyQixDQUFDOzs7QUNGRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRTdCLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDYixPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2hCLFNBQVMsR0FBRyxHQUFHLENBQUM7O0FBRWhCLFFBQVEsQ0FBQyxNQUFNO0VBQ2Isb0JBQUMsSUFBSSxFQUFBLElBQUEsQ0FBRyxDQUFBO0VBQ1IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Q0FDaEMsQ0FBQzs7O0FDVEYsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUV4QyxvQ0FBb0MsdUJBQUE7O0VBRWxDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFjLENBQUEsRUFBQTtRQUNwQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLHNCQUF1QixDQUFBLEVBQUE7VUFDN0Isb0JBQUMsU0FBUyxFQUFBLENBQUEsQ0FBQyxXQUFBLEVBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVksQ0FBQSxD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QUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUE7a0NBQ0MsQ0FBQTtnQ0FDRixDQUFBOzhCQUNKLENBQUEsRUFBQTs4QkFDTixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFBLEVBQWtCLENBQUMsRUFBQSxFQUFFLENBQUMsV0FBVyxDQUFBLENBQUcsQ0FBQSxFQUFBOzhCQUNsRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHFCQUFBLEVBQXFCLENBQUMsRUFBQSxFQUFFLENBQUMsY0FBZSxDQUFBLEVBQUE7Z0NBQ3BELFlBQWE7OEJBQ1YsQ0FBQTs0QkFDRixDQUFBOzBCQUNGLENBQUE7d0JBQ0gsQ0FBQTtzQkFDRixDQUFBO29CQUNDLENBQUE7a0JBQ0YsQ0FBQTtnQkFDSixDQUFBO2NBQ0YsQ0FBQTtZQUNGLENBQUE7UUFDVjtBQUNSLEdBQUc7QUFDSDs7Q0FFQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcInVwZGF0ZVRpbWV0YWJsZXNcIl1cbik7XG4iLCJ2YXIgUm9vdCA9IHJlcXVpcmUoJy4vcm9vdCcpO1xuXG5jb3Vyc2VzID0gW107XG5fU0NIT09MID0gXCJqaHVcIjtcbl9TRU1FU1RFUiA9IFwiU1wiO1xuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZScpXG4pO1xuIiwidmFyIFNlYXJjaEJhciA9IHJlcXVpcmUoJy4vc2VhcmNoX2JhcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXJcIj5cbiAgICAgICAgPGRpdiBpZD1cInNlYXJjaC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPFNlYXJjaEJhciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItY29sbGFwc2VcIiA+XG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXZcIiBpZD1cIm1lbnVcIj5cbiAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIjZmFrZWxpbmtcIj5QcmVmZXJlbmNlczwvYT5cbiAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtaXRlbVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdGV4dFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxsaT4gQXZvaWQgZWFybHkgY2xhc3NlcyA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJjbW4tdG9nZ2xlLTFcIiBkZWZhdWx0Q2hlY2tlZCBjbGFzc05hbWU9XCJjbW4tdG9nZ2xlIGNtbi10b2dnbGUtcm91bmRcIiB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJjbW4tdG9nZ2xlLTFcIj48L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8bGk+IEF2b2lkIGxhdGUgY2xhc3NlcyA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJjbW4tdG9nZ2xlLTJcIiBkZWZhdWx0Q2hlY2tlZCBjbGFzc05hbWU9XCJjbW4tdG9nZ2xlIGNtbi10b2dnbGUtcm91bmRcIiB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJjbW4tdG9nZ2xlLTJcIj48L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8bGk+IEFsbG93IGNvbmZsaWN0cyA8L2xpPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJjbW4tdG9nZ2xlLTNcIiBkZWZhdWx0Q2hlY2tlZCBjbGFzc05hbWU9XCJjbW4tdG9nZ2xlIGNtbi10b2dnbGUtcm91bmRcIiB0eXBlPVwiY2hlY2tib3hcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJjbW4tdG9nZ2xlLTNcIj48L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI2Zha2VsaW5rXCI+UHJvZmlsZTwvYT48L2xpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9maWxlLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgIDxsaT5GYXZvcml0ZXM8L2xpPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9maWxlLXRleHRcIj5cbiAgICAgICAgICAgICAgICAgIDxsaT5GcmllbmRzPC9saT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZmlsZS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgICA8bGk+U2lnbiBPdXQ8L2xpPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblx0XHRyZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBpZD1cImxvYWRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUtZ3JpZFwiPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUxXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTJcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlM1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU0XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTVcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNlwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU3XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZThcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlOVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcbn0pO1xuXG4iLCJ2YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbnZhciBjb3Vyc2VfaW5mb19zdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL2NvdXJzZV9pbmZvJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtSZWZsdXguY29ubmVjdChjb3Vyc2VfaW5mb19zdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRlciA9IHRoaXMuc3RhdGUubG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRIZWFkZXIoKVxuXHRcdHZhciBkZXNjcmlwdGlvbiA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKClcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRFdmFsdWF0aW9ucygpXG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0UmVjb21lbmRhdGlvbnMoKVxuXHRcdHZhciB0ZXh0Ym9va3MgPXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFRleHRib29rcygpXG5cdFx0dmFyIHNlY3Rpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPVwibW9kYWwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgICAge2hlYWRlcn1cbiAgICAgICAgICAgICAgICB7ZGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAge2V2YWx1YXRpb25zfVxuICAgICAgICAgICAgICAgIHtzZWN0aW9uc31cbiAgICAgICAgICAgICAgICB7dGV4dGJvb2tzfVxuICAgICAgICAgICAgICAgIHtyZWNvbWVuZGF0aW9uc31cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG5cblx0Z2V0SGVhZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHQ8ZGl2IGlkPVwibmFtZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLm5hbWV9PC9kaXY+XG5cdFx0XHQ8ZGl2IGlkPVwiY29kZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGV9PC9kaXY+XG5cdFx0PC9kaXY+KVxuXHRcdHJldHVybiBoZWFkZXJcblx0fSxcblxuXHRnZXREZXNjcmlwdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLWRlc2NyaXB0aW9uXCI+XG5cdFx0XHRcdDxoNj5EZXNjcmlwdGlvbjo8L2g2PlxuXHRcdFx0XHR7dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5kZXNjcmlwdGlvbn1cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gZGVzY3JpcHRpb25cblx0fSxcblxuXHRnZXRFdmFsdWF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGV2YWxfaXRlbXMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmV2YWxfaW5mby5tYXAoZnVuY3Rpb24oZSkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJldmFsLWl0ZW1cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57ZS55ZWFyfTwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPjxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCplLnNjb3JlLzUgKyBcIiVcIn19IGNsYXNzTmFtZT1cInJhdGluZ1wiPjwvc3Bhbj48L2Rpdj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibnVtZXJpYy1yYXRpbmdcIj57XCIoXCIgKyBlLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQpXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRldmFscyA9IChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsX2l0ZW1zfVxuXHRcdFx0PC9kaXY+KVxuXHRcdHZhciBjbGlja19ub3RpY2UgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmV2YWxfaW5mby5sZW5ndGggPT0gMCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZXZhbC1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pilcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBFdmFsdWF0aW9uczo8L2g2PlxuXHRcdFx0XHR7ZXZhbHN9XG5cdFx0XHRcdHtjbGlja19ub3RpY2V9XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGV2YWx1YXRpb25zXG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgaWQ9XCJyZWNvbWVuZGF0aW9uXCI+XG4gICAgICAgICAgICBcdFx0PGRpdiBpZD1cInJlYy13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgIFx0XHQ8ZGl2IGlkPVwibmFtZVwiPntyYy5uYW1lfTwvZGl2PlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBpZD1cImNvZGVcIj57cmMuY29kZX08L2Rpdj5cblx0ICAgICAgICAgICAgXHQ8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIj5cblx0XHRcdFx0PGg2PkNvdXJzZXMgWW91IE1pZ2h0IExpa2U6PC9oNj5cblx0XHRcdFx0PGRpdiBpZD1cImNvdXJzZS1yZWNvbWVuZGF0aW9uc1wiPlxuXHRcdFx0XHRcdHtyZWxhdGVkfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gcmVjb21lbmRhdGlvbnNcblx0fSxcblxuXHRnZXRUZXh0Ym9va3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZXh0Ym9va19lbGVtZW50cyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rXCI+XG4gICAgICAgICAgICBcdFx0PGltZyBoZWlnaHQ9XCIxMjVcIiBzcmM9e3RiLmltYWdlX3VybH0vPlxuICAgICAgICAgICAgXHRcdDxoNj57dGIudGl0bGV9PC9oNj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2Pnt0Yi5hdXRob3J9PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGRpdj5JU0JOOnt0Yi5pc2JufTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxhIGhyZWY9e3RiLmRldGFpbF91cmx9IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgXHRcdFx0PGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgIFx0XHQ8L2E+XG4gICAgICAgICAgICBcdDwvZGl2PilcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLXRleHRib29rc1wiPlxuXHRcdFx0XHQ8aDY+VGV4dGJvb2tzOjwvaDY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiB0ZXh0Ym9va3Ncblx0fSxcblxuXHRnZXRTZWN0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdmFyIEYgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1MubWFwKGZ1bmN0aW9uKGYpe1xuXHRcdC8vIFx0cmV0dXJuICg8ZGl2PlxuXHRcdC8vIFx0XHR7Zn1cblx0XHQvLyBcdDwvZGl2Pilcblx0XHQvLyB9LmJpbmQodGhpcykpO1xuXHRcdC8vIHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLm1hcChmdW5jdGlvbihzKXtcblx0XHQvLyBcdHJldHVybiAoPGRpdj5cblx0XHQvLyBcdFx0e3N9XG5cdFx0Ly8gXHQ8L2Rpdj4pXG5cdFx0Ly8gfS5iaW5kKHRoaXMpKTtcblx0XHQvLyB2YXIgc2VjdGlvbnMgPSBcblx0XHQvLyBcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHQvLyBcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdC8vIFx0XHR7Rn1cblx0XHQvLyBcdFx0e1N9XG5cdFx0Ly8gXHQ8L2Rpdj4pXG5cdFx0Ly8gcmV0dXJuIHNlY3Rpb25zXG5cdFx0cmV0dXJuIG51bGxcblx0fSxcblxuXG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDB9O1xuICB9LFxuXG4gIGNoYW5nZVBhZ2U6IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIChmdW5jdGlvbihldmVudCkge1xuICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4LFxuICAgICAgICAgICBjb3VudCA9IHRoaXMucHJvcHMuY291bnQ7XG4gICAgICAgLy8gY2FsY3VsYXRlIHRoZSBuZXcgZmlyc3RfZGlzcGxheWVkIGJ1dHRvbiAodGltZXRhYmxlKVxuICAgICAgIHZhciBuZXdfZmlyc3QgPSBjdXJyZW50ICsgKDkqZGlyZWN0aW9uKSAtIChjdXJyZW50ICUgOSk7XG4gICAgICAgaWYgKG5ld19maXJzdCA+PSAwICYmIG5ld19maXJzdCA8IGNvdW50KSB7XG4gICAgICAgIHRoaXMucHJvcHMuc2V0SW5kZXgobmV3X2ZpcnN0KSgpO1xuICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBbXSwgY291bnQgPSB0aGlzLnByb3BzLmNvdW50LCBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4O1xuICAgIGlmIChjb3VudCA8PSAxKSB7IHJldHVybiBudWxsOyB9IC8vIGRvbid0IGRpc3BsYXkgaWYgdGhlcmUgYXJlbid0IGVub3VnaCBzY2hlZHVsZXNcbiAgICB2YXIgZmlyc3QgPSBjdXJyZW50IC0gKGN1cnJlbnQgJSA5KTsgLy8gcm91bmQgZG93biB0byBuZWFyZXN0IG11bHRpcGxlIG9mIDlcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIG9wdGlvbnMucHVzaChcbiAgICAgICAgPGxpIGtleT17aX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9PlxuICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT57aSArIDF9PC9hPlxuICAgICAgICA8L2xpPik7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJwYWdpbmF0aW9uLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24gcGFnaW5hdGlvbi1taW5pbWFsXCI+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXYtZG91YmxlXCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKC0xKX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtbGVmdFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwicHJldmlvdXNcIj5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiZnVpLWFycm93LWxlZnQgcGFnaW5hdGlvbi1idG5cIiBcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnByZXZ9PjwvYT5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICB7b3B0aW9uc31cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm5leHRcIj5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiZnVpLWFycm93LXJpZ2h0IHBhZ2luYXRpb24tYnRuXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLm5leHR9PjwvYT5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dC1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG4gIFxuXG59KTsiLCJ2YXIgQ29udHJvbEJhciA9IHJlcXVpcmUoJy4vY29udHJvbF9iYXInKTtcbnZhciBUaW1ldGFibGUgPSByZXF1aXJlKCcuL3RpbWV0YWJsZScpO1xudmFyIE1vZGFsQ29udGVudCA9IHJlcXVpcmUoJy4vbW9kYWxfY29udGVudCcpO1xudmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zJyk7XG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZ2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0Q291cnNlcygpO1xuXG4gICAgcmV0dXJuIHt9O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBNb2RhbCA9IEJvcm9uWydPdXRsaW5lTW9kYWwnXTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwicm9vdFwiPlxuICAgICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPENvbnRyb2xCYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IC8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJjYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgPFRpbWV0YWJsZSB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZUNvdXJzZU1vZGFsOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVmc1snT3V0bGluZU1vZGFsJ10udG9nZ2xlKCk7XG4gICAgICAgIGNvdXJzZV9hY3Rpb25zLmdldENvdXJzZUluZm8oY291cnNlX2lkKTtcbiAgICB9LmJpbmQodGhpcyk7IFxuICB9LFxuXG4gIGdldENvdXJzZXM6IGZ1bmN0aW9uKCkge1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIgKyBfU0NIT09MICsgXCIvXCIgKyBfU0VNRVNURVIsIFxuICAgICAgICB7fSwgXG4gICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY291cnNlcyA9IHJlc3BvbnNlO1xuICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuICB9LFxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgU2VhcmNoUmVzdWx0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaV9jbGFzcyA9IFwic2VhcmNoLXJlc3VsdFwiLCBpY29uX2NsYXNzID0gXCJmdWktcGx1c1wiO1xuICAgIGlmICh0aGlzLnByb3BzLmluX3Jvc3Rlcikge1xuICAgICAgbGlfY2xhc3MgKz0gXCIgdG9kby1kb25lXCI7XG4gICAgICBpY29uX2NsYXNzID0gXCJmdWktY2hlY2tcIjtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxsaSBjbGFzc05hbWU9e2xpX2NsYXNzfSBvbk1vdXNlRG93bj17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmlkKX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kby1jb250ZW50XCI+XG4gICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRvZG8tbmFtZVwiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMuY29kZX1cbiAgICAgICAgICA8L2g0PlxuICAgICAgICAgIHt0aGlzLnByb3BzLm5hbWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9e1wic2VhcmNoLXJlc3VsdC1hY3Rpb24gXCIgKyBpY29uX2NsYXNzfSBcbiAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy50b2dnbGVDb3Vyc2V9PlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2xpPlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHJlbW92aW5nID0gdGhpcy5wcm9wcy5pbl9yb3N0ZXI7XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVUaW1ldGFibGVzKHtpZDogdGhpcy5wcm9wcy5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuICAgIGUucHJldmVudERlZmF1bHQoKTsgIC8vIHN0b3AgaW5wdXQgZnJvbSB0cmlnZ2VyaW5nIG9uQmx1ciBhbmQgdGh1cyBoaWRpbmcgcmVzdWx0c1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIHN0b3AgcGFyZW50IGZyb20gb3BlbmluZyBtb2RhbFxuICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdWx0czogW10sXG4gICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzX2RpdiA9IHRoaXMuZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudCgpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LWNvbWJpbmVcIj5cbiAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgY29kZSwgdGl0bGUsIGRlc2NyaXB0aW9uLCBwcm9mZXNzb3IsIGRlZ3JlZVwiIFxuICAgICAgICAgICAgaWQ9XCJzZWFyY2gtaW5wdXRcIiBcbiAgICAgICAgICAgIHJlZj1cImlucHV0XCIgXG4gICAgICAgICAgICBvbkZvY3VzPXt0aGlzLmZvY3VzfSBvbkJsdXI9e3RoaXMuYmx1cn0gXG4gICAgICAgICAgICBvbklucHV0PXt0aGlzLnF1ZXJ5Q2hhbmdlZH0vPlxuICAgICAgICAgIDxidXR0b24gZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI21lbnUtY29udGFpbmVyXCIgaWQ9XCJtZW51LWJ0blwiPlxuICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtYmFycyBmYS0yeFwiPjwvaT5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHNfZGl2fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmZvY3VzZWQgfHwgdGhpcy5zdGF0ZS5yZXN1bHRzLmxlbmd0aCA9PSAwKSB7cmV0dXJuIG51bGw7fVxuICAgIHZhciBpID0gMDtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHMgPSB0aGlzLnN0YXRlLnJlc3VsdHMubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGkrKztcbiAgICAgIHZhciBpbl9yb3N0ZXIgPSB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbci5pZF0gIT0gbnVsbDtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxTZWFyY2hSZXN1bHQgey4uLnJ9IGtleT17aX0gaW5fcm9zdGVyPXtpbl9yb3N0ZXJ9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfS8+XG4gICAgICApO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtcmVzdWx0cy1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvIG1ybVwiPlxuICAgICAgICAgICAgPHVsIGlkPVwic2VhcmNoLXJlc3VsdHNcIj5cbiAgICAgICAgICAgICAge3NlYXJjaF9yZXN1bHRzfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IHRydWV9KTtcbiAgfSxcblxuICBibHVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiBmYWxzZX0pO1xuICB9LFxuXG4gIHF1ZXJ5Q2hhbmdlZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgcXVlcnkgPSBldmVudC50YXJnZXQudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgZmlsdGVyZWQgPSBxdWVyeS5sZW5ndGggPD0gMSA/IFtdIDogdGhpcy5maWx0ZXJDb3Vyc2VzKHF1ZXJ5KTtcbiAgICB0aGlzLnNldFN0YXRlKHtyZXN1bHRzOiBmaWx0ZXJlZH0pO1xuICB9LFxuXG4gIGZpbHRlckNvdXJzZXM6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBjb3Vyc2VzLmZpbHRlcihmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gKGMuY29kZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEgfHxcbiAgICAgICAgICAgICBjLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5KSA+IC0xKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfSxcblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG52YXIgY29sb3VyX3RvX2hpZ2hsaWdodCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuXG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIFNsb3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtzaG93X2J1dHRvbnM6IGZhbHNlfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBpbiA9IG51bGwsIHJlbW92ZV9idXR0b24gPSBudWxsO1xuICAgICAgICB2YXIgc2xvdF9zdHlsZSA9IHRoaXMuZ2V0U2xvdFN0eWxlKCk7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dfYnV0dG9ucykge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMudW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmNvdXJzZSl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17dGhpcy51bmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZX0gXG4gICAgICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAgICAgIHtyZW1vdmVfYnV0dG9ufVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPnt0aGlzLnByb3BzLnRpbWVfc3RhcnR9IOKAkyB7dGhpcy5wcm9wcy50aW1lX2VuZH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMubmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIGdldFNsb3RTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydF9ob3VyICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIHN0YXJ0X21pbnV0ZSA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMV0pLFxuICAgICAgICAgICAgZW5kX2hvdXIgICAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgZW5kX21pbnV0ZSAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMV0pO1xuXG4gICAgICAgIHZhciB0b3AgPSAoc3RhcnRfaG91ciAtIDgpKjUyICsgKHN0YXJ0X21pbnV0ZSkqKDI2LzMwKTtcbiAgICAgICAgdmFyIGJvdHRvbSA9IChlbmRfaG91ciAtIDgpKjUyICsgKGVuZF9taW51dGUpKigyNi8zMCkgLSAxO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wIC0gMjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogdG9wLCBcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnByb3BzLmNvbG91cixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIgKyB0aGlzLnByb3BzLmNvbG91clxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBoaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogdHJ1ZX0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG91cnMoY29sb3VyX3RvX2hpZ2hsaWdodFt0aGlzLnByb3BzLmNvbG91cl0pO1xuICAgIH0sXG4gICAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogZmFsc2V9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKHRoaXMucHJvcHMuY29sb3VyKTtcbiAgICB9LFxuICAgIHBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZVRpbWV0YWJsZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiB0aGlzLnByb3BzLm1lZXRpbmdfc2VjdGlvbiwgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHVucGluQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlVGltZXRhYmxlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiBmYWxzZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgcmVtb3ZlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlVGltZXRhYmxlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbG91cnM6IGZ1bmN0aW9uKGNvbG91cikge1xuICAgICAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZSlcbiAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3VyKVxuICAgICAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSBbXCJNXCIsIFwiVFwiLCBcIldcIiwgXCJSXCIsIFwiRlwiXTtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHRoaXMuZ2V0U2xvdHNCeURheSgpO1xuICAgICAgICB2YXIgYWxsX3Nsb3RzID0gZGF5cy5tYXAoZnVuY3Rpb24oZGF5KSB7XG4gICAgICAgICAgICB2YXIgZGF5X3Nsb3RzID0gc2xvdHNfYnlfZGF5W2RheV0ubWFwKGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMuaXNQaW5uZWQoc2xvdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxTbG90IHsuLi5zbG90fSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtzbG90LmlkfSBwaW5uZWQ9e3B9Lz5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtkYXl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1ldmVudC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF5X3Nsb3RzfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICApO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAge2FsbF9zbG90c31cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICApO1xuICAgIH0sXG4gICBcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gezE6ICdtb24nLCAyOiAndHVlJywgMzogJ3dlZCcsIDQ6ICd0aHUnLCA1OiAnZnJpJ307XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gXCIuZmMtXCIgKyBkYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgICAvLyAkKHNlbGVjdG9yKS5hZGRDbGFzcyhcImZjLXRvZGF5XCIpO1xuICAgIH0sXG5cbiAgICBpc1Bpbm5lZDogZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICB2YXIgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bJ0MnXTtcbiAgICAgICAgaWYgKF9TQ0hPT0wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdW3Nsb3QubWVldGluZ19zZWN0aW9uWzBdXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGFyYXRvciA9PSBzbG90Lm1lZXRpbmdfc2VjdGlvbjtcblxuICAgIH0sXG5cbiAgICBnZXRTbG90c0J5RGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHtcbiAgICAgICAgICAgICdNJzogW10sXG4gICAgICAgICAgICAnVCc6IFtdLFxuICAgICAgICAgICAgJ1cnOiBbXSxcbiAgICAgICAgICAgICdSJzogW10sXG4gICAgICAgICAgICAnRic6IFtdXG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGNvdXJzZSBpbiB0aGlzLnByb3BzLnRpbWV0YWJsZXMuY291cnNlcykge1xuICAgICAgICAgICAgdmFyIGNycyA9IHRoaXMucHJvcHMudGltZXRhYmxlcy5jb3Vyc2VzW2NvdXJzZV07XG4gICAgICAgICAgICBmb3IgKHZhciBzbG90X2lkIGluIGNycy5zbG90cykge1xuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gY3JzLnNsb3RzW3Nsb3RfaWRdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2xvdXJcIl0gPSBPYmplY3Qua2V5cyhjb2xvdXJfdG9faGlnaGxpZ2h0KVtjb3Vyc2VdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2RlXCJdID0gY3JzLmNvZGUudHJpbSgpO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJuYW1lXCJdID0gY3JzLm5hbWU7XG4gICAgICAgICAgICAgICAgc2xvdHNfYnlfZGF5W3Nsb3QuZGF5XS5wdXNoKHNsb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbG90c19ieV9kYXk7XG4gICAgfSxcblxufSk7XG4iLCJ2YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtjb3Vyc2VfYWN0aW9uc10sXG5cbiAgZ2V0Q291cnNlSW5mbzogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgX1NDSE9PTCArIFwiL2lkL1wiICsgY291cnNlX2lkLCBcbiAgICAgICAgIHt9LCBcbiAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IGZhbHNlLCBjb3Vyc2VfaW5mbzogcmVzcG9uc2V9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcblxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtjb3Vyc2VfaW5mbzogbnVsbCwgbG9hZGluZzogdHJ1ZX07XG4gIH1cbn0pO1xuIiwidmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cblxudmFyIG9iaiA9IHtcbiAgc2Nob29sOiBcImpodVwiLFxuICBzZW1lc3RlcjogXCJTXCIsXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBwcmVmZXJlbmNlczoge1xuICAgICdub19jbGFzc2VzX2JlZm9yZSc6IGZhbHNlLFxuICAgICdub19jbGFzc2VzX2FmdGVyJzogZmFsc2UsXG4gICAgJ2xvbmdfd2Vla2VuZCc6IGZhbHNlLFxuICAgICdncm91cGVkJzogZmFsc2UsXG4gICAgJ2RvX3JhbmtpbmcnOiBmYWxzZSxcbiAgICAndHJ5X3dpdGhfY29uZmxpY3RzJzogZmFsc2VcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuXG4gIHVwZGF0ZVRpbWV0YWJsZXM6IGZ1bmN0aW9uKG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOnRydWV9KTtcblxuICAgIHZhciByZW1vdmluZyA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnJlbW92aW5nO1xuICAgIHZhciBuZXdfY291cnNlX2lkID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uaWQ7XG4gICAgdmFyIHNlY3Rpb24gPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9uO1xuICAgIHZhciBjX3RvX3MgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5jb3Vyc2VzX3RvX3NlY3Rpb25zKTsgLy8gZGVlcCBjb3B5IG9mIHRoaXMuY291cnNlc190b19zZWN0aW9uc1xuICAgIFxuICAgIGlmICghcmVtb3ZpbmcpIHsgLy8gYWRkaW5nIGNvdXJzZVxuICAgICAgaWYgKG9iai5zY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9ufTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9iai5zY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgdmFyIGxvY2tlZF9zZWN0aW9ucyA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfSAvLyB0aGlzIGlzIHdoYXQgd2Ugd2FudCB0byBzZW5kIGlmIG5vdCBsb2NraW5nXG4gICAgICAgIGlmIChzZWN0aW9uKSB7IC8vIGxvY2tpbmdcbiAgICAgICAgICBpZiAoY190b19zW25ld19jb3Vyc2VfaWRdICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxvY2tlZF9zZWN0aW9ucyA9IGNfdG9fc1tuZXdfY291cnNlX2lkXTsgLy8gY29weSB0aGUgb2xkIG1hcHBpbmdcbiAgICAgICAgICAgIC8vIGluIGNhc2Ugc29tZSBzZWN0aW9ucyB3ZXJlIGFscmVhZHkgbG9ja2VkIGZvciB0aGlzIGNvdXJzZSxcbiAgICAgICAgICAgIC8vIGFuZCBub3cgd2UncmUgYWJvdXQgdG8gbG9jayBhIG5ldyBvbmUuXG4gICAgICAgICAgfVxuICAgICAgICAgIGxvY2tlZF9zZWN0aW9uc1tzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdID0gbG9ja2VkX3NlY3Rpb25zO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHsgLy8gcmVtb3ZpbmcgY291cnNlXG4gICAgICBkZWxldGUgY190b19zW25ld19jb3Vyc2VfaWRdO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGNfdG9fcykubGVuZ3RoID09IDApIHsgLy8gcmVtb3ZlZCBsYXN0IGNvdXJzZVxuICAgICAgICAgIHRoaXMuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLmdldEluaXRpYWxTdGF0ZSgpKTtcbiAgICAgICAgICByZXR1cm47ICBcbiAgICAgIH1cbiAgICB9XG4gICAgb2JqLmNvdXJzZXNfdG9fc2VjdGlvbnMgPSBjX3RvX3M7IC8vIHRvIG1ha2UgdGhlIFBPU1QgcmVxdWVzdFxuICAgICQucG9zdCgnL3RpbWV0YWJsZS8nLCBKU09OLnN0cmluZ2lmeShvYmopLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZiAocmVzcG9uc2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb3Vyc2VzX3RvX3NlY3Rpb25zID0gY190b19zO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgICB0aW1ldGFibGVzOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB0aGlzLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgICAgY3VycmVudF9pbmRleDogMCxcbiAgICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBsb2FkaW5nOiBmYWxzZX07XG4gIH1cbn0pO1xuIiwidmFyIFNsb3RNYW5hZ2VyID0gcmVxdWlyZSgnLi9zbG90X21hbmFnZXInKTtcbnZhciBQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9wYWdpbmF0aW9uJyk7XG52YXIgVXBkYXRlVGltZXRhYmxlc1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSldLFxuXG4gIG5leHRUaW1ldGFibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ICsgMX0pO1xuICAgIH1cbiAgfSxcblxuICBwcmV2VGltZXRhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMX0pO1xuICAgIH0gICAgXG4gIH0sXG5cbiAgc2V0SW5kZXg6IGZ1bmN0aW9uKG5ld19pbmRleCkge1xuICAgIHJldHVybihmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGVzPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc30vPik7XG4gICAgICB2YXIgbG9hZGVyID0gIXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PilcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIj5cbiAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJsaWdodCBzZW1lc3Rlci1kaXNwbGF5XCI+RmFsbCAyMDE2PC9oMj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNsZWFyXCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8UGFnaW5hdGlvbiBcbiAgICAgICAgICAgICAgICBjb3VudD17dGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aH0gXG4gICAgICAgICAgICAgICAgbmV4dD17dGhpcy5uZXh0VGltZXRhYmxlfSBcbiAgICAgICAgICAgICAgICBwcmV2PXt0aGlzLnByZXZUaW1ldGFibGV9XG4gICAgICAgICAgICAgICAgc2V0SW5kZXg9e3RoaXMuc2V0SW5kZXh9XG4gICAgICAgICAgICAgICAgY3VycmVudF9pbmRleD17dGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4fS8+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZS1ncmlkLWNvbnRhaW5lciBmYy1zY3JvbGxlclwiIGlkPVwiY2FsZW5kYXItaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1iZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtbW9uXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10dWVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXdlZFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdGh1XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1mcmlcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXNsYXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj44YW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OWFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjEwYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTFhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjFwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4ycG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+M3BtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjRwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj41cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjdwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj44cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjEwcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTFwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIiBpZD1cIndpZGdldC1oclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIiBpZD1cInNsb3QtbWFuYWdlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2xvdF9tYW5hZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gIH0sXG5cblxufSk7XG4iXX0=
