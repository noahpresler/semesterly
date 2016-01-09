(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["updateCourses",
  "updatePreferences"]
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
var PreferenceMenu = require('./preference_menu');

module.exports = React.createClass({displayName: "exports",

  render: function() {
    return (
      React.createElement("div", {id: "control-bar"}, 
        React.createElement("div", {id: "search-bar-container"}, 
          React.createElement(SearchBar, {toggleModal: this.props.toggleModal})
        ), 
        React.createElement(PreferenceMenu, null)
      )

    );
  },
});

},{"./preference_menu":"/home/linoah/Documents/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
var Evaluation = React.createClass({displayName: "Evaluation",
	render: function() {
		var classes = this.props.selected ? "eval-item selected" : "eval-item"
		var details = !this.props.selected ? null : (
			React.createElement("div", {id: "details"}, this.props.eval_data.summary.replace(/\u00a0/g, " "))
			)
		var prof = !this.props.selected ? null : (
			React.createElement("div", {id: "prof"}, "Professor: ", this.props.eval_data.professor)
			)
		return (
		React.createElement("div", {className: classes, onClick: this.props.selectionCallback}, 
			React.createElement("div", {id: "eval-wrapper"}, 
				React.createElement("div", {className: "year"}, this.props.eval_data.year), 
				prof, 
				React.createElement("div", {className: "rating-wrapper"}, 
					React.createElement("div", {className: "star-ratings-sprite"}, 
						React.createElement("span", {style: {width: 100*this.props.eval_data.score/5 + "%"}, className: "rating"})
					), 
					React.createElement("div", {className: "numeric-rating"}, "(" + this.props.eval_data.score + ")")
				)
			), 
			details
		));
	},
});

module.exports = React.createClass({displayName: "exports",
	
	getInitialState: function() {
		return {
			indexSelected: null
		}
	},

	render: function() {
		var i = 0;
		var evals = this.props.eval_info.map(function(e) {
			i++;
			var selected = i == this.state.indexSelected;
			return (React.createElement(Evaluation, {eval_data: e, key: e.id, selectionCallback: this.changeSelected(i), selected: selected}));
		}.bind(this));
		var click_notice = this.props.eval_info.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No course evaluations for this course yet")) : (React.createElement("div", {id: "click-intro"}, "Click an evaluation item above to read the comments"));
		return (
		React.createElement("div", {className: "modal-entry", id: "course-evaluations"}, 
			React.createElement("h6", null, "Course Evaluations:"), 
			React.createElement("div", {className: "eval-wrapper"}, 
				evals
			), 
			click_notice
		));
	},

	changeSelected: function(e_index) {
		return (function() {
			if (this.state.indexSelected == e_index) 
				this.setState({indexSelected: null});
			else
				this.setState({indexSelected: e_index});
		}.bind(this));
	}
});

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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
var EvaluationManager = require('./evaluations.jsx');
var TimetableActions = require('./actions/update_timetables.js');
var course_actions = require('./actions/course_actions');
var SectionSlot = require('./section_slot.jsx')

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
			React.createElement("div", {id: "course-info-wrapper"}, 
				React.createElement("div", {id: "name"}, this.state.course_info.name), 
				React.createElement("div", {id: "code"}, this.state.course_info.code)
			), 
			React.createElement("span", {className: "course-action fui-plus", onClick: this.addCourse()})
		))
		return header
	},

	addCourse: function() {
		return (function() {
			TimetableActions.updateTimetables({id: this.state.course_info.id, section: '', removing: false});
		}.bind(this));
	},

	openRecomendation: function(course_id) {
		return (function() {
			course_actions.getCourseInfo(course_id)
		}.bind(this));
	},

	getDescription: function() {
		var description = 
			(React.createElement("div", {className: "modal-entry", id: "course-description"}, 
				React.createElement("h6", null, "Description:"), 
				this.state.course_info.description
			))
		return description;
	},

	getEvaluations: function() {
		return React.createElement(EvaluationManager, {eval_info: this.state.course_info.eval_info})
	},

	getRecomendations: function() {
		var related = this.state.course_info.related_courses.slice(0,3).map(function(rc) {
            return (
            	React.createElement("div", {id: "recomendation", onClick: this.openRecomendation(rc.id), key: rc.id}, 
            		React.createElement("div", {id: "center-wrapper"}, 
	            		React.createElement("div", {id: "rec-wrapper"}, 
		            		React.createElement("div", {id: "name"}, rc.name), 
		            		React.createElement("div", {id: "code"}, rc.code)
		            	)
		            )
            	))
        }.bind(this));
		var recomendations = this.state.course_info.related_courses.length == 0 ? null :
			(React.createElement("div", {className: "modal-entry"}, 
				React.createElement("h6", null, "Courses You Might Like:"), 
				React.createElement("div", {id: "course-recomendations"}, 
					related
				)
			))
		return recomendations
	},

	expandRecomendations: function() {

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
		var textbooks = this.state.course_info.textbook_info[0].textbooks.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No textbooks yet for this course")) :
				(React.createElement("div", {id: "textbooks"}, 
	            	textbook_elements
	            ))
		var ret = 
			(React.createElement("div", {className: "modal-entry", id: "course-textbooks"}, 
				React.createElement("h6", null, "Textbooks:"), 
				textbooks
			))
		return ret
	},

	getSections: function() {
		var F = this.state.course_info.sections_F.map(function(f){
			return (React.createElement(SectionSlot, {key: s.id, all_sections: this.state.course_info.sections_F_objs, section: s}))
		}.bind(this));
		var S = this.state.course_info.sections_S.map(function(s){
			return (React.createElement(SectionSlot, {key: s.id, all_sections: this.state.course_info.sections_S_objs, section: s}))
		}.bind(this));
		var sections = 
			(React.createElement("div", {className: "modal-entry", id: "course-sections"}, 
				React.createElement("h6", null, "Course Sections:"), 
				React.createElement("div", {id: "all-sections-wrapper"}, 
					F, 
					S
				)
			))
		return sections
	},


});

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var BinaryPreference = React.createClass({displayName: "BinaryPreference",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    var toggle_label = "cmn-toggle-" + this.props.toggle_id;
    return (
      React.createElement("div", {className: "preference-item"}, 
        React.createElement("div", {className: "preference-text"}, 
          React.createElement("li", null, " ", this.props.text, " ")
        ), 
        React.createElement("div", {className: "preference-toggle"}, 
          React.createElement("div", {className: "switch"}, 
            React.createElement("input", {ref: "checkbox_elem", id: toggle_label, 
                   className: "cmn-toggle cmn-toggle-round", type: "checkbox", 
                   onClick: this.togglePreference}), 
            React.createElement("label", {htmlFor: toggle_label})
          )
        )
      )
    );
  },

  togglePreference: function() {
    var new_value = this.refs.checkbox_elem.checked;
    TimetableActions.updatePreferences(this.props.name, new_value);
  }
});

module.exports = React.createClass({displayName: "exports",
  current_toggle_id: 0,

  render: function() {
    return (
      React.createElement("div", {id: "menu-container", className: "collapse"}, 
        React.createElement("div", {className: "navbar-collapse"}, 
          React.createElement("ul", {className: "nav navbar-nav", id: "menu"}, 
            React.createElement("li", null, 
              React.createElement("a", {href: "#fakelink"}, "Preferences"), 
              React.createElement("ul", null, 
                React.createElement(BinaryPreference, {text: "Avoid early classes", 
                                  name: "no_classes_before", 
                                  toggle_id: this.get_next_toggle_id()}), 
                React.createElement(BinaryPreference, {text: "Avoid late classes", 
                                  name: "no_classes_after", 
                                  toggle_id: this.get_next_toggle_id()}), 
                React.createElement(BinaryPreference, {text: "Allow conflicts", 
                                  name: "try_with_conflicts", 
                                  toggle_id: this.get_next_toggle_id()})
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
    );
  },

  get_next_toggle_id: function() {
    this.current_toggle_id += 1
    return this.current_toggle_id;
  }

});

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
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
        React.createElement("div", {id: "semesterly-name"}, "Semester.ly"), 
        React.createElement("div", {id: "control-bar-container"}, 
          React.createElement(ControlBar, {toggleModal: this.toggleCourseModal})
        ), 
        React.createElement("div", {id: "modal-container"}, 
          React.createElement(Modal, {ref: "OutlineModal", className: "course-modal"}, 
              React.createElement(ModalContent, null)
          )
        ), 
        React.createElement("div", {id: "all-cols-container"}, 
          React.createElement("div", {id: "side-container"}, "Side div"), 
          React.createElement("div", {id: "cal-container"}, 
            React.createElement(Timetable, {toggleModal: this.toggleCourseModal})
          )
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
    TimetableActions.updateCourses({id: this.props.id, section: '', removing: removing});
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

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
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

module.exports = React.createClass({displayName: "exports",
    render: function() {
        var cos = this.getRelatedCourseOfferings()
        var dayAndTimes = this.getDaysAndTimes(cos);
        var sect = React.createElement("div", {id: "section-num"}, cos[0].meeting_section)
        var prof = React.createElement("div", {id: "profs"}, cos[0].instructors)
        var sect_prof = React.createElement("div", {id: "sect-prof"}, sect, prof)
        return React.createElement("div", {id: "section-wrapper"}, sect_prof, dayAndTimes)
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
            return (React.createElement("div", {id: "day-time"}, day_to_letter[o.day] + " " + o.time_start + "-" + o.time_end));
        }.bind(this));
        return ( React.createElement("div", {id: "dt-container"}, 
                dayAndTimes
            ) )
    }
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
        TimetableActions.updateCourses({id: this.props.course, 
            section: this.props.meeting_section, 
            removing: false});
        e.stopPropagation();
    },
    unpinCourse: function(e) {
        TimetableActions.updateCourses({id: this.props.course, 
            section: '', 
            removing: false});
        e.stopPropagation();
    },
    removeCourse: function(e) {
        TimetableActions.updateCourses({id: this.props.course, 
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
    this.trigger({loading: true});
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


var tt_state = {
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

 /**
  * Update tt_state with new course roster
  * @param {object} new_course_with_section contains attributed id, section, removing
  * @return {void} does not return anything, just updates tt_state
  */
  updateCourses: function(new_course_with_section) {
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var section = new_course_with_section.section;
    var c_to_s = $.extend(true, {}, tt_state.courses_to_sections); // deep copy of tt_state.courses_to_sections
    
    if (!removing) { // adding course
      if (tt_state.school == "jhu") {
        c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': new_course_with_section.section};
      }
      else if (tt_state.school == "uoft") {
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
          tt_state.courses_to_sections = {};
          this.trigger(this.getInitialState());
          return;  
      }
    }
    tt_state.courses_to_sections = c_to_s; // to make the POST request
    this.makeRequest(c_to_s);
  },

 /**
  * Update tt_state with new preferences
  * @param {string} preference: the preference that is being updated
  * @param new_value: the new value of the specified preference
  * @return {void} doesn't return anything, just updates tt_state
  */
  updatePreferences: function(preference, new_value) {
    tt_state.preferences[preference] = new_value;
    this.makeRequest();
  },

  // Makes a POST request to the backend with tt_state
  makeRequest: function() {
    $.post('/timetable/', JSON.stringify(tt_state), function(response) {
        if (response.length > 0) {
          console.log('hello');
          this.trigger({
              timetables: response,
              courses_to_sections: tt_state.courses_to_sections,
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
                React.createElement(Pagination, {
                  count: this.state.timetables.length, 
                  next: this.nextTimetable, 
                  prev: this.prevTimetable, 
                  setIndex: this.setIndex, 
                  current_index: this.state.current_index}), 
                  /*<h2 className="light semester-display">Fall 2016</h2>*/
                React.createElement("div", {className: "fc-clear"})
              ), 

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FwcC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvY29udHJvbF9iYXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2V2YWx1YXRpb25zLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9sb2FkZXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL21vZGFsX2NvbnRlbnQuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3BhZ2luYXRpb24uanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3ByZWZlcmVuY2VfbWVudS5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcm9vdC5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VhcmNoX2Jhci5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VjdGlvbl9zbG90LmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy9jb3Vyc2VfaW5mby5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdGltZXRhYmxlLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxlQUFlLENBQUM7Q0FDbEIsQ0FBQzs7O0FDRkYsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsYUFBYTtFQUNuQyxDQUFDLGVBQWU7RUFDaEIsbUJBQW1CLENBQUM7Q0FDckIsQ0FBQzs7O0FDSEYsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUU3QixPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2IsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNoQixTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUVoQixRQUFRLENBQUMsTUFBTTtFQUNiLG9CQUFDLElBQUksRUFBQSxJQUFBLENBQUcsQ0FBQTtFQUNSLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO0NBQ2hDLENBQUM7OztBQ1RGLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN4QyxJ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QUFBLG9CQUFBLE1BQUssRUFBQSxJQUFDLEVBQUEsTUFBVyxDQUFLLENBQUEsRUFBQTtzQ0FDeEUsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQUEsRUFBQTtzQ0FDdkIsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQ0FBb0MsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZELG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQTtrQ0FDQyxDQUFBO2dDQUNGLENBQUE7OEJBQ0osQ0FBQSxFQUFBOzhCQUNOLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQUEsRUFBa0IsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxXQUFXLENBQUEsQ0FBRyxDQUFBLEVBQUE7OEJBQ2xELG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQUEsRUFBcUIsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxjQUFlLENBQUEsRUFBQTtnQ0FDcEQsWUFBYTs4QkFDVixDQUFBOzRCQUNGLENBQUE7MEJBQ0YsQ0FBQTt3QkFDSCxDQUFBO3NCQUNGLENBQUE7b0JBQ0MsQ0FBQTtrQkFDRixDQUFBO2dCQUNKLENBQUE7Y0FDRixDQUFBO1lBQ0YsQ0FBQTtRQUNWO0FBQ1IsR0FBRztBQUNIOztDQUVDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVBY3Rpb25zKFxuICBbXCJnZXRDb3Vyc2VJbmZvXCJdXG4pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1widXBkYXRlQ291cnNlc1wiLFxuICBcInVwZGF0ZVByZWZlcmVuY2VzXCJdXG4pO1xuIiwidmFyIFJvb3QgPSByZXF1aXJlKCcuL3Jvb3QnKTtcblxuY291cnNlcyA9IFtdO1xuX1NDSE9PTCA9IFwiamh1XCI7XG5fU0VNRVNURVIgPSBcIlNcIjtcblxuUmVhY3RET00ucmVuZGVyKFxuICA8Um9vdCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2UnKVxuKTtcbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhTZWxlY3RlZDogbnVsbFxuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR2YXIgZXZhbHMgPSB0aGlzLnByb3BzLmV2YWxfaW5mby5tYXAoZnVuY3Rpb24oZSkge1xuXHRcdFx0aSsrO1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gaSA9PSB0aGlzLnN0YXRlLmluZGV4U2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQ8L2Rpdj4pIDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsc31cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2NsaWNrX25vdGljZX1cblx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdGNoYW5nZVNlbGVjdGVkOiBmdW5jdGlvbihlX2luZGV4KSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluZGV4U2VsZWN0ZWQgPT0gZV9pbmRleCkgXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4U2VsZWN0ZWQ6IG51bGx9KTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7aW5kZXhTZWxlY3RlZDogZV9pbmRleH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH1cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgY291cnNlX2luZm9fc3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9jb3Vyc2VfaW5mbycpO1xudmFyIEV2YWx1YXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9ldmFsdWF0aW9ucy5qc3gnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTZWN0aW9uU2xvdCA9IHJlcXVpcmUoJy4vc2VjdGlvbl9zbG90LmpzeCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtSZWZsdXguY29ubmVjdChjb3Vyc2VfaW5mb19zdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRlciA9IHRoaXMuc3RhdGUubG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRIZWFkZXIoKVxuXHRcdHZhciBkZXNjcmlwdGlvbiA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKClcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRFdmFsdWF0aW9ucygpXG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0UmVjb21lbmRhdGlvbnMoKVxuXHRcdHZhciB0ZXh0Ym9va3MgPXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFRleHRib29rcygpXG5cdFx0dmFyIHNlY3Rpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPVwibW9kYWwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgICAge2hlYWRlcn1cbiAgICAgICAgICAgICAgICB7ZGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAge2V2YWx1YXRpb25zfVxuICAgICAgICAgICAgICAgIHtzZWN0aW9uc31cbiAgICAgICAgICAgICAgICB7dGV4dGJvb2tzfVxuICAgICAgICAgICAgICAgIHtyZWNvbWVuZGF0aW9uc31cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG5cblx0Z2V0SGVhZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHQ8ZGl2IGlkPVwiY291cnNlLWluZm8td3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGlkPVwibmFtZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLm5hbWV9PC9kaXY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJjb2RlXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZX08L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY291cnNlLWFjdGlvbiBmdWktcGx1c1wiIG9uQ2xpY2s9e3RoaXMuYWRkQ291cnNlKCl9Lz5cblx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGhlYWRlclxuXHR9LFxuXG5cdGFkZENvdXJzZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlVGltZXRhYmxlcyh7aWQ6IHRoaXMuc3RhdGUuY291cnNlX2luZm8uaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogZmFsc2V9KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Y291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyhjb3Vyc2VfaWQpXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXHRnZXREZXNjcmlwdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLWRlc2NyaXB0aW9uXCI+XG5cdFx0XHRcdDxoNj5EZXNjcmlwdGlvbjo8L2g2PlxuXHRcdFx0XHR7dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5kZXNjcmlwdGlvbn1cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gZGVzY3JpcHRpb247XG5cdH0sXG5cblx0Z2V0RXZhbHVhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiA8RXZhbHVhdGlvbk1hbmFnZXIgZXZhbF9pbmZvPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmV2YWxfaW5mb30gLz5cblx0fSxcblxuXHRnZXRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlbGF0ZWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnJlbGF0ZWRfY291cnNlcy5zbGljZSgwLDMpLm1hcChmdW5jdGlvbihyYykge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBpZD1cInJlY29tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBpZD1cImNlbnRlci13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgIFx0XHQ8ZGl2IGlkPVwicmVjLXdyYXBwZXJcIj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBpZD1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBpZD1cImNvZGVcIj57cmMuY29kZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdDwvZGl2PlxuXHRcdCAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXHQ8L2Rpdj4pXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMubGVuZ3RoID09IDAgPyBudWxsIDpcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCI+XG5cdFx0XHRcdDxoNj5Db3Vyc2VzIFlvdSBNaWdodCBMaWtlOjwvaDY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtcmVjb21lbmRhdGlvbnNcIj5cblx0XHRcdFx0XHR7cmVsYXRlZH1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHJlY29tZW5kYXRpb25zXG5cdH0sXG5cblx0ZXhwYW5kUmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXG5cdH0sXG5cblx0Z2V0VGV4dGJvb2tzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGV4dGJvb2tfZWxlbWVudHMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiPlxuICAgICAgICAgICAgXHRcdDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXt0Yi5pbWFnZV91cmx9Lz5cbiAgICAgICAgICAgIFx0XHQ8aDY+e3RiLnRpdGxlfTwvaDY+XG4gICAgICAgICAgICBcdFx0PGRpdj57dGIuYXV0aG9yfTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxkaXY+SVNCTjp7dGIuaXNibn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8YSBocmVmPXt0Yi5kZXRhaWxfdXJsfSB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICAgICAgICAgIFx0XHRcdDxpbWcgc3JjPVwiaHR0cHM6Ly9pbWFnZXMtbmEuc3NsLWltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9HLzAxL2Fzc29jaWF0ZXMvcmVtb3RlLWJ1eS1ib3gvYnV5NS5fVjE5MjIwNzczOV8uZ2lmXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIyOFwiIGJvcmRlcj1cIjBcIi8+XG4gICAgICAgICAgICBcdFx0PC9hPlxuICAgICAgICAgICAgXHQ8L2Rpdj4pXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHRleHRib29rcyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gdGV4dGJvb2tzIHlldCBmb3IgdGhpcyBjb3Vyc2U8L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pilcblx0XHR2YXIgcmV0ID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLXRleHRib29rc1wiPlxuXHRcdFx0XHQ8aDY+VGV4dGJvb2tzOjwvaDY+XG5cdFx0XHRcdHt0ZXh0Ym9va3N9XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHJldFxuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgRiA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRi5tYXAoZnVuY3Rpb24oZil7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3MuaWR9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgUyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3MuaWR9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiYWxsLXNlY3Rpb25zLXdyYXBwZXJcIj5cblx0XHRcdFx0XHR7Rn1cblx0XHRcdFx0XHR7U31cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHNlY3Rpb25zXG5cdH0sXG5cblxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyA5LCBjb3VudCk7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17Y2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgPGEgb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+e2kgKyAxfTwvYT5cbiAgICAgICAgPC9saT4pO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwicGFnaW5hdGlvbi1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uIHBhZ2luYXRpb24tbWluaW1hbFwiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnRcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXZpb3VzXCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1sZWZ0IHBhZ2luYXRpb24tYnRuXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAge29wdGlvbnN9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0XCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1yaWdodCBwYWdpbmF0aW9uLWJ0blwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm5leHQtZG91YmxlXCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKDEpfT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuICBcblxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBCaW5hcnlQcmVmZXJlbmNlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRvZ2dsZV9sYWJlbCA9IFwiY21uLXRvZ2dsZS1cIiArIHRoaXMucHJvcHMudG9nZ2xlX2lkO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtaXRlbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdGV4dFwiPlxuICAgICAgICAgIDxsaT4ge3RoaXMucHJvcHMudGV4dH0gPC9saT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10b2dnbGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXRjaFwiPlxuICAgICAgICAgICAgPGlucHV0IHJlZj1cImNoZWNrYm94X2VsZW1cIiBpZD17dG9nZ2xlX2xhYmVsfSBcbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJjbW4tdG9nZ2xlIGNtbi10b2dnbGUtcm91bmRcIiB0eXBlPVwiY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnRvZ2dsZVByZWZlcmVuY2V9Lz5cbiAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPXt0b2dnbGVfbGFiZWx9PjwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVQcmVmZXJlbmNlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3X3ZhbHVlID0gdGhpcy5yZWZzLmNoZWNrYm94X2VsZW0uY2hlY2tlZDtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZVByZWZlcmVuY2VzKHRoaXMucHJvcHMubmFtZSwgbmV3X3ZhbHVlKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBjdXJyZW50X3RvZ2dsZV9pZDogMCxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwibWVudS1jb250YWluZXJcIiBjbGFzc05hbWU9XCJjb2xsYXBzZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdmJhci1jb2xsYXBzZVwiID5cbiAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXZcIiBpZD1cIm1lbnVcIj5cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIiNmYWtlbGlua1wiPlByZWZlcmVuY2VzPC9hPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI2Zha2VsaW5rXCI+UHJvZmlsZTwvYT48L2xpPlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2ZpbGUtdGV4dFwiPlxuICAgICAgICAgICAgICAgIDxsaT5GYXZvcml0ZXM8L2xpPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZmlsZS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgPGxpPkZyaWVuZHM8L2xpPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJvZmlsZS10ZXh0XCI+XG4gICAgICAgICAgICAgICAgPGxpPlNpZ24gT3V0PC9saT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRfbmV4dF90b2dnbGVfaWQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3VycmVudF90b2dnbGVfaWQgKz0gMVxuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkO1xuICB9XG5cbn0pOyIsInZhciBDb250cm9sQmFyID0gcmVxdWlyZSgnLi9jb250cm9sX2JhcicpO1xudmFyIFRpbWV0YWJsZSA9IHJlcXVpcmUoJy4vdGltZXRhYmxlJyk7XG52YXIgTW9kYWxDb250ZW50ID0gcmVxdWlyZSgnLi9tb2RhbF9jb250ZW50Jyk7XG52YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbiAgICBcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6ZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nZXRDb3Vyc2VzKCk7XG5cbiAgICByZXR1cm4ge307XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIE1vZGFsID0gQm9yb25bJ091dGxpbmVNb2RhbCddO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJyb290XCI+XG4gICAgICAgIDxkaXYgaWQ9XCJzZW1lc3Rlcmx5LW5hbWVcIj5TZW1lc3Rlci5seTwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPENvbnRyb2xCYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IC8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJhbGwtY29scy1jb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwic2lkZS1jb250YWluZXJcIj5TaWRlIGRpdjwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8VGltZXRhYmxlIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlTW9kYWw6IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS50b2dnbGUoKTtcbiAgICAgICAgY291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyhjb3Vyc2VfaWQpO1xuICAgIH0uYmluZCh0aGlzKTsgXG4gIH0sXG5cbiAgZ2V0Q291cnNlczogZnVuY3Rpb24oKSB7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIiArIF9TQ0hPT0wgKyBcIi9cIiArIF9TRU1FU1RFUiwgXG4gICAgICAgIHt9LCBcbiAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb3Vyc2VzID0gcmVzcG9uc2U7XG4gICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0sXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBTZWFyY2hSZXN1bHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpX2NsYXNzID0gXCJzZWFyY2gtcmVzdWx0XCIsIGljb25fY2xhc3MgPSBcImZ1aS1wbHVzXCI7XG4gICAgaWYgKHRoaXMucHJvcHMuaW5fcm9zdGVyKSB7XG4gICAgICBsaV9jbGFzcyArPSBcIiB0b2RvLWRvbmVcIjtcbiAgICAgIGljb25fY2xhc3MgPSBcImZ1aS1jaGVja1wiO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGxpIGNsYXNzTmFtZT17bGlfY2xhc3N9IG9uTW91c2VEb3duPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuaWQpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvLWNvbnRlbnRcIj5cbiAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidG9kby1uYW1lXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb2RlfVxuICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17XCJzZWFyY2gtcmVzdWx0LWFjdGlvbiBcIiArIGljb25fY2xhc3N9IFxuICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLnRvZ2dsZUNvdXJzZX0+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVtb3ZpbmcgPSB0aGlzLnByb3BzLmluX3Jvc3RlcjtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgLy8gc3RvcCBpbnB1dCBmcm9tIHRyaWdnZXJpbmcgb25CbHVyIGFuZCB0aHVzIGhpZGluZyByZXN1bHRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gc3RvcCBwYXJlbnQgZnJvbSBvcGVuaW5nIG1vZGFsXG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN1bHRzOiBbXSxcbiAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHNfZGl2ID0gdGhpcy5nZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50KCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5wdXQtY29tYmluZVwiPlxuICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSBjb2RlLCB0aXRsZSwgZGVzY3JpcHRpb24sIHByb2Zlc3NvciwgZGVncmVlXCIgXG4gICAgICAgICAgICBpZD1cInNlYXJjaC1pbnB1dFwiIFxuICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMuZm9jdXN9IG9uQmx1cj17dGhpcy5ibHVyfSBcbiAgICAgICAgICAgIG9uSW5wdXQ9e3RoaXMucXVlcnlDaGFuZ2VkfS8+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1iYXJzIGZhLTJ4XCI+PC9pPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c19kaXZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZm9jdXNlZCB8fCB0aGlzLnN0YXRlLnJlc3VsdHMubGVuZ3RoID09IDApIHtyZXR1cm4gbnVsbDt9XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzZWFyY2hfcmVzdWx0cyA9IHRoaXMuc3RhdGUucmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgaSsrO1xuICAgICAgdmFyIGluX3Jvc3RlciA9IHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tyLmlkXSAhPSBudWxsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlYXJjaFJlc3VsdCB7Li4ucn0ga2V5PXtpfSBpbl9yb3N0ZXI9e2luX3Jvc3Rlcn0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9Lz5cbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8gbXJtXCI+XG4gICAgICAgICAgICA8dWwgaWQ9XCJzZWFyY2gtcmVzdWx0c1wiPlxuICAgICAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHN9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogdHJ1ZX0pO1xuICB9LFxuXG4gIGJsdXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IGZhbHNlfSk7XG4gIH0sXG5cbiAgcXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBxdWVyeSA9IGV2ZW50LnRhcmdldC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBmaWx0ZXJlZCA9IHF1ZXJ5Lmxlbmd0aCA8PSAxID8gW10gOiB0aGlzLmZpbHRlckNvdXJzZXMocXVlcnkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHM6IGZpbHRlcmVkfSk7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgcmVzdWx0cyA9IGNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAoYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG52YXIgY29sb3VyX3RvX2hpZ2hsaWdodCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuXG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIGRheV90b19sZXR0ZXIgPSB7XG4gICAgJ00nOiAgJ00nLCBcbiAgICAnVCc6ICAnVCcsIFxuICAgICdXJzogICdXJyxcbiAgICAnUic6ICdUaCcsXG4gICAgJ0YnOiAgJ0YnLFxuICAgICdTJzogJ1NhJyxcbiAgICAnVSc6ICdTJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29zID0gdGhpcy5nZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzKClcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3QgPSA8ZGl2IGlkPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj5cbiAgICAgICAgdmFyIHByb2YgPSA8ZGl2IGlkPVwicHJvZnNcIj57Y29zWzBdLmluc3RydWN0b3JzfTwvZGl2PlxuICAgICAgICB2YXIgc2VjdF9wcm9mID0gPGRpdiBpZD1cInNlY3QtcHJvZlwiPntzZWN0fXtwcm9mfTwvZGl2PlxuICAgICAgICByZXR1cm4gPGRpdiBpZD1cInNlY3Rpb24td3JhcHBlclwiPntzZWN0X3Byb2Z9e2RheUFuZFRpbWVzfTwvZGl2PlxuICAgIH0sXG5cbiAgICBnZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29fb2JqZWN0cyA9IFtdXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcm9wcy5hbGxfc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5wcm9wcy5hbGxfc2VjdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAoby5tZWV0aW5nX3NlY3Rpb24gPT0gdGhpcy5wcm9wcy5zZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29fb2JqZWN0cy5wdXNoKG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb19vYmplY3RzO1xuICAgIH0sXG5cbiAgICBnZXREYXlzQW5kVGltZXM6IGZ1bmN0aW9uKGNvcykge1xuICAgICAgICB2YXIgZGF5QW5kVGltZXMgPSBjb3MubWFwKGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgICAgIHJldHVybiAoPGRpdiBpZD1cImRheS10aW1lXCI+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBpZD1cImR0LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIHtkYXlBbmRUaW1lc31cbiAgICAgICAgICAgIDwvZGl2PiApXG4gICAgfVxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cblxuLy8gbWFwcyBiYXNlIGNvbG91ciBvZiBzbG90IHRvIGNvbG91ciBvbiBoaWdobGlnaHRcbnZhciBjb2xvdXJfdG9faGlnaGxpZ2h0ID0ge1xuICAgIFwiI0ZENzQ3M1wiIDogXCIjRTI2QTZBXCIsXG4gICAgXCIjNDRCQkZGXCIgOiBcIiMyOEE0RUFcIixcbiAgICBcIiM0Q0Q0QjBcIiA6IFwiIzNEQkI5QVwiLFxuICAgIFwiIzg4NzBGRlwiIDogXCIjNzA1OUU2XCIsXG4gICAgXCIjRjlBRTc0XCIgOiBcIiNGNzk1NEFcIixcbiAgICBcIiNENERCQzhcIiA6IFwiI0I1QkZBM1wiLFxuICAgIFwiI0U3Rjc2RFwiIDogXCIjQzRENDREXCIsXG4gICAgXCIjRjE4MkI0XCIgOiBcIiNERTY5OURcIixcbiAgICBcIiM3NDk5QTJcIiA6IFwiIzY2OEI5NFwiLFxufSAvLyBjb25zaWRlciAjQ0YwMDBGLCAjZThmYWMzXG5cbi8vIGhvdyBiaWcgYSBzbG90IG9mIGhhbGYgYW4gaG91ciB3b3VsZCBiZSwgaW4gcGl4ZWxzXG52YXIgSEFMRl9IT1VSX0hFSUdIVCA9IDMwO1xuXG52YXIgU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge3Nob3dfYnV0dG9uczogZmFsc2V9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGluID0gbnVsbCwgcmVtb3ZlX2J1dHRvbiA9IG51bGw7XG4gICAgICAgIHZhciBzbG90X3N0eWxlID0gdGhpcy5nZXRTbG90U3R5bGUoKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2hvd19idXR0b25zKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS10aHVtYi10YWNrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICAgICAgcmVtb3ZlX2J1dHRvbiA9ICggPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnJlbW92ZUNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS10aW1lcyByZW1vdmVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvcHMucGlubmVkKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmQgcGlubmVkXCIgb25DbGljaz17dGhpcy51bnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS10aHVtYi10YWNrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuY291cnNlKX1cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcInNsb3Qtb3V0ZXIgZmMtdGltZS1ncmlkLWV2ZW50IGZjLWV2ZW50IHNsb3Qgc2xvdC1cIiArIHRoaXMucHJvcHMuY291cnNlfSBcbiAgICAgICAgICAgICAgICBzdHlsZT17c2xvdF9zdHlsZX0+XG4gICAgICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMuY29kZSArIFwiIFwiICsgdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb259PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHtwaW59ICAgICAgICAgICAgXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgZ2V0U2xvdFN0eWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0X2hvdXIgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgc3RhcnRfbWludXRlID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVsxXSksXG4gICAgICAgICAgICBlbmRfaG91ciAgICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBlbmRfbWludXRlICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVsxXSk7XG5cbiAgICAgICAgdmFyIHRvcCA9IChzdGFydF9ob3VyIC0gOCkqNTIgKyAoc3RhcnRfbWludXRlKSooMjYvMzApO1xuICAgICAgICB2YXIgYm90dG9tID0gKGVuZF9ob3VyIC0gOCkqNTIgKyAoZW5kX21pbnV0ZSkqKDI2LzMwKSAtIDE7XG4gICAgICAgIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3AgLSAyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiB0b3AsIFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd19idXR0b25zOiB0cnVlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyhjb2xvdXJfdG9faGlnaGxpZ2h0W3RoaXMucHJvcHMuY29sb3VyXSk7XG4gICAgfSxcbiAgICB1bmhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd19idXR0b25zOiBmYWxzZX0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG91cnModGhpcy5wcm9wcy5jb2xvdXIpO1xuICAgIH0sXG4gICAgcGluQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246IHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9uLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiBmYWxzZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgdW5waW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogJycsIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICByZW1vdmVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogJycsIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IHRydWV9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQ29sb3VyczogZnVuY3Rpb24oY29sb3VyKSB7XG4gICAgICAgICQoXCIuc2xvdC1cIiArIHRoaXMucHJvcHMuY291cnNlKVxuICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvdXIpXG4gICAgICAgICAgLmNzcygnYm9yZGVyLWNvbG9yJywgY29sb3VyKTtcbiAgICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IFtcIk1cIiwgXCJUXCIsIFwiV1wiLCBcIlJcIiwgXCJGXCJdO1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0gdGhpcy5nZXRTbG90c0J5RGF5KCk7XG4gICAgICAgIHZhciBhbGxfc2xvdHMgPSBkYXlzLm1hcChmdW5jdGlvbihkYXkpIHtcbiAgICAgICAgICAgIHZhciBkYXlfc2xvdHMgPSBzbG90c19ieV9kYXlbZGF5XS5tYXAoZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICAgICAgICAgIHZhciBwID0gdGhpcy5pc1Bpbm5lZChzbG90KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFNsb3Qgey4uLnNsb3R9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBrZXk9e3Nsb3QuaWR9IHBpbm5lZD17cH0vPlxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2RheX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWV2ZW50LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkYXlfc2xvdHN9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICB7YWxsX3Nsb3RzfVxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgICk7XG4gICAgfSxcbiAgIFxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSB7MTogJ21vbicsIDI6ICd0dWUnLCAzOiAnd2VkJywgNDogJ3RodScsIDU6ICdmcmknfTtcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSBcIi5mYy1cIiArIGRheXNbZC5nZXREYXkoKV07XG4gICAgICAgIC8vICQoc2VsZWN0b3IpLmFkZENsYXNzKFwiZmMtdG9kYXlcIik7XG4gICAgfSxcblxuICAgIGlzUGlubmVkOiBmdW5jdGlvbihzbG90KSB7XG4gICAgICAgIHZhciBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVsnQyddO1xuICAgICAgICBpZiAoX1NDSE9PTCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bc2xvdC5tZWV0aW5nX3NlY3Rpb25bMF1dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yID09IHNsb3QubWVldGluZ19zZWN0aW9uO1xuXG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgY291cnNlIGluIHRoaXMucHJvcHMudGltZXRhYmxlcy5jb3Vyc2VzKSB7XG4gICAgICAgICAgICB2YXIgY3JzID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmNvdXJzZXNbY291cnNlXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNsb3RfaWQgaW4gY3JzLnNsb3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNsb3QgPSBjcnMuc2xvdHNbc2xvdF9pZF07XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvbG91clwiXSA9IE9iamVjdC5rZXlzKGNvbG91cl90b19oaWdobGlnaHQpW2NvdXJzZV07XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvZGVcIl0gPSBjcnMuY29kZS50cmltKCk7XG4gICAgICAgICAgICAgICAgc2xvdFtcIm5hbWVcIl0gPSBjcnMubmFtZTtcbiAgICAgICAgICAgICAgICBzbG90c19ieV9kYXlbc2xvdC5kYXldLnB1c2goc2xvdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNsb3RzX2J5X2RheTtcbiAgICB9LFxuXG59KTtcbiIsInZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvY291cnNlX2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW2NvdXJzZV9hY3Rpb25zXSxcblxuICBnZXRDb3Vyc2VJbmZvOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWV9KTtcbiAgICAkLmdldChcIi9jb3Vyc2VzL1wiKyBfU0NIT09MICsgXCIvaWQvXCIgKyBjb3Vyc2VfaWQsIFxuICAgICAgICAge30sIFxuICAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2UsIGNvdXJzZV9pbmZvOiByZXNwb25zZX0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2NvdXJzZV9pbmZvOiBudWxsLCBsb2FkaW5nOiB0cnVlfTtcbiAgfVxufSk7XG4iLCJ2YXIgYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG52YXIgdHRfc3RhdGUgPSB7XG4gIHNjaG9vbDogXCJqaHVcIixcbiAgc2VtZXN0ZXI6IFwiU1wiLFxuICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSxcbiAgcHJlZmVyZW5jZXM6IHtcbiAgICAnbm9fY2xhc3Nlc19iZWZvcmUnOiBmYWxzZSxcbiAgICAnbm9fY2xhc3Nlc19hZnRlcic6IGZhbHNlLFxuICAgICdsb25nX3dlZWtlbmQnOiBmYWxzZSxcbiAgICAnZ3JvdXBlZCc6IGZhbHNlLFxuICAgICdkb19yYW5raW5nJzogZmFsc2UsXG4gICAgJ3RyeV93aXRoX2NvbmZsaWN0cyc6IGZhbHNlXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW2FjdGlvbnNdLFxuICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSxcblxuIC8qKlxuICAqIFVwZGF0ZSB0dF9zdGF0ZSB3aXRoIG5ldyBjb3Vyc2Ugcm9zdGVyXG4gICogQHBhcmFtIHtvYmplY3R9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uIGNvbnRhaW5zIGF0dHJpYnV0ZWQgaWQsIHNlY3Rpb24sIHJlbW92aW5nXG4gICogQHJldHVybiB7dm9pZH0gZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgdHRfc3RhdGVcbiAgKi9cbiAgdXBkYXRlQ291cnNlczogZnVuY3Rpb24obmV3X2NvdXJzZV93aXRoX3NlY3Rpb24pIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6dHJ1ZX0pO1xuXG4gICAgdmFyIHJlbW92aW5nID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24ucmVtb3Zpbmc7XG4gICAgdmFyIG5ld19jb3Vyc2VfaWQgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5pZDtcbiAgICB2YXIgc2VjdGlvbiA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb247XG4gICAgdmFyIGNfdG9fcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zKTsgLy8gZGVlcCBjb3B5IG9mIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNcbiAgICBcbiAgICBpZiAoIXJlbW92aW5nKSB7IC8vIGFkZGluZyBjb3Vyc2VcbiAgICAgIGlmICh0dF9zdGF0ZS5zY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9ufTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR0X3N0YXRlLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICB2YXIgbG9ja2VkX3NlY3Rpb25zID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9IC8vIHRoaXMgaXMgd2hhdCB3ZSB3YW50IHRvIHNlbmQgaWYgbm90IGxvY2tpbmdcbiAgICAgICAgaWYgKHNlY3Rpb24pIHsgLy8gbG9ja2luZ1xuICAgICAgICAgIGlmIChjX3RvX3NbbmV3X2NvdXJzZV9pZF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgbG9ja2VkX3NlY3Rpb25zID0gY190b19zW25ld19jb3Vyc2VfaWRdOyAvLyBjb3B5IHRoZSBvbGQgbWFwcGluZ1xuICAgICAgICAgICAgLy8gaW4gY2FzZSBzb21lIHNlY3Rpb25zIHdlcmUgYWxyZWFkeSBsb2NrZWQgZm9yIHRoaXMgY291cnNlLFxuICAgICAgICAgICAgLy8gYW5kIG5vdyB3ZSdyZSBhYm91dCB0byBsb2NrIGEgbmV3IG9uZS5cbiAgICAgICAgICB9XG4gICAgICAgICAgbG9ja2VkX3NlY3Rpb25zW3NlY3Rpb25bMF1dID0gc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSBsb2NrZWRfc2VjdGlvbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmluZyBjb3Vyc2VcbiAgICAgIGRlbGV0ZSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY190b19zKS5sZW5ndGggPT0gMCkgeyAvLyByZW1vdmVkIGxhc3QgY291cnNlXG4gICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLmdldEluaXRpYWxTdGF0ZSgpKTtcbiAgICAgICAgICByZXR1cm47ICBcbiAgICAgIH1cbiAgICB9XG4gICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IGNfdG9fczsgLy8gdG8gbWFrZSB0aGUgUE9TVCByZXF1ZXN0XG4gICAgdGhpcy5tYWtlUmVxdWVzdChjX3RvX3MpO1xuICB9LFxuXG4gLyoqXG4gICogVXBkYXRlIHR0X3N0YXRlIHdpdGggbmV3IHByZWZlcmVuY2VzXG4gICogQHBhcmFtIHtzdHJpbmd9IHByZWZlcmVuY2U6IHRoZSBwcmVmZXJlbmNlIHRoYXQgaXMgYmVpbmcgdXBkYXRlZFxuICAqIEBwYXJhbSBuZXdfdmFsdWU6IHRoZSBuZXcgdmFsdWUgb2YgdGhlIHNwZWNpZmllZCBwcmVmZXJlbmNlXG4gICogQHJldHVybiB7dm9pZH0gZG9lc24ndCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyB0dF9zdGF0ZVxuICAqL1xuICB1cGRhdGVQcmVmZXJlbmNlczogZnVuY3Rpb24ocHJlZmVyZW5jZSwgbmV3X3ZhbHVlKSB7XG4gICAgdHRfc3RhdGUucHJlZmVyZW5jZXNbcHJlZmVyZW5jZV0gPSBuZXdfdmFsdWU7XG4gICAgdGhpcy5tYWtlUmVxdWVzdCgpO1xuICB9LFxuXG4gIC8vIE1ha2VzIGEgUE9TVCByZXF1ZXN0IHRvIHRoZSBiYWNrZW5kIHdpdGggdHRfc3RhdGVcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICQucG9zdCgnL3RpbWV0YWJsZS8nLCBKU09OLnN0cmluZ2lmeSh0dF9zdGF0ZSksIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2hlbGxvJyk7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IDAsXG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBsb2FkaW5nOiBmYWxzZX07XG4gIH1cbn0pO1xuIiwidmFyIFNsb3RNYW5hZ2VyID0gcmVxdWlyZSgnLi9zbG90X21hbmFnZXInKTtcbnZhciBQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9wYWdpbmF0aW9uJyk7XG52YXIgVXBkYXRlVGltZXRhYmxlc1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSldLFxuXG4gIG5leHRUaW1ldGFibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ICsgMX0pO1xuICAgIH1cbiAgfSxcblxuICBwcmV2VGltZXRhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMX0pO1xuICAgIH0gICAgXG4gIH0sXG5cbiAgc2V0SW5kZXg6IGZ1bmN0aW9uKG5ld19pbmRleCkge1xuICAgIHJldHVybihmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGVzPXt0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc30vPik7XG4gICAgICB2YXIgbG9hZGVyID0gIXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PilcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIj5cbiAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgPFBhZ2luYXRpb24gXG4gICAgICAgICAgICAgICAgICBjb3VudD17dGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aH0gXG4gICAgICAgICAgICAgICAgICBuZXh0PXt0aGlzLm5leHRUaW1ldGFibGV9IFxuICAgICAgICAgICAgICAgICAgcHJldj17dGhpcy5wcmV2VGltZXRhYmxlfVxuICAgICAgICAgICAgICAgICAgc2V0SW5kZXg9e3RoaXMuc2V0SW5kZXh9XG4gICAgICAgICAgICAgICAgICBjdXJyZW50X2luZGV4PXt0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXh9Lz5cbiAgICAgICAgICAgICAgICAgIHsvKjxoMiBjbGFzc05hbWU9XCJsaWdodCBzZW1lc3Rlci1kaXNwbGF5XCI+RmFsbCAyMDE2PC9oMj4qL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNsZWFyXCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXZpZXcgZmMtYWdlbmRhV2Vlay12aWV3IGZjLWFnZW5kYS12aWV3XCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXJvdyBmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJjdXN0b20td2lkZ2V0LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXdpZGdldC1oZWFkZXJcIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtbW9uXCI+TW9uIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10dWVcIj5UdWUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXdlZFwiPldlZCA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtdGh1XCI+VGh1IDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1mcmlcIj5GcmkgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWRheS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtYmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLW1vblwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdHVlXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy13ZWRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXRodVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtZnJpXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1zbGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTJwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjNwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj40cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjZwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj43cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJ3aWRnZXQtaHJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCIgaWQ9XCJzbG90LW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nsb3RfbWFuYWdlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICB9LFxuXG5cbn0pO1xuIl19
