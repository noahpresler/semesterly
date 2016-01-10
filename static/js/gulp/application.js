(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  [
  "updateCourses",
  "updatePreferences",
  "getTimetableLink",
  "loadPresetTimetable",
  ]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
courses = [];
_SCHOOL = "jhu";
_SEMESTER = "S";

ReactDOM.render(
  React.createElement(Root, null),
  document.getElementById('page')
);

var data = window.location.pathname.substring(1); // loading timetable data from url
if (data) {
	TimetableActions.loadPresetTimetable(data);
}

},{"./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/root.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
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

},{"./preference_menu":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
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

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
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
		var F = this.state.course_info.sections_F.map(function(s){
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

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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
    );
  },
  

});

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],

  getInitialState:function() {
    this.getCourses();

    return {};
  },
  render: function() {
    var Modal = Boron['OutlineModal'];

    return (
      React.createElement("div", {id: "root"}, 
        React.createElement("div", {id: "toast-container"}), 
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

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modal_content.jsx","./stores/toast_store.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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

   /**
    * Return an object containing style of a specific slot. Should specify at
    * least the top y-coordinate and height of the slot, as well as backgroundColor
    * while taking into account if there's an overlapping conflict
    */
    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.time_start.split(":")[0]),
            start_minute = parseInt(this.props.time_start.split(":")[1]),
            end_hour     = parseInt(this.props.time_end.split(":")[0]),
            end_minute   = parseInt(this.props.time_end.split(":")[1]);

        var top = (start_hour - 8)*52 + (start_minute)*(26/30);
        var bottom = (end_hour - 8)*52 + (end_minute)*(26/30) - 1;
        var height = bottom - top - 2;

        // the cumulative width of this slot and all of the slots it is conflicting with
        var total_slot_widths = 98 - (5 * this.props.depth_level);
        // the width of this particular slot
        var slot_width_percentage = total_slot_widths / this.props.num_conflicts;
        // the amount of left margin of this particular slot, in percentage
        var push_left = (this.props.shift_index * slot_width_percentage) + 5 * this.props.depth_level;
        return {
            width: slot_width_percentage + "%",
            top: top,
            height: height,
            backgroundColor: this.props.colour,
            border: "1px solid " + this.props.colour,
            left: push_left + "%",
            zIndex: 100 * this.props.depth_level
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
        for (var course in this.props.timetable.courses) {
            var crs = this.props.timetable.courses[course];
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
var course_actions = require('../actions/course_actions.js');

module.exports = Reflux.createStore({
  listenables: [course_actions],

  getCourseInfo: function(course_id) {
    this.trigger({loading: true});
    $.get("/courses/"+ _SCHOOL + "/id/" + course_id, 
         {}, 
         function(response) {
            this.trigger({loading: false, course_info: response});
         }.bind(this)
    );

  },

  getInitialState: function() {
    return {course_info: null, loading: true};
  }
});

},{"../actions/course_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
var Toast = require('../toast');
var ToastActions = require('../actions/toast_actions.js');

module.exports = Reflux.createStore({
  listenables: [ToastActions],

  createToast: function(content) {
    var container = document.getElementById('toast-container');
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(
      React.createElement(Toast, {content: content}),
      container
    );
  },


});

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
var actions = require('../actions/update_timetables.js');
var ToastActions = require('../actions/toast_actions.js');


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
    var new_state = $.extend(true, {}, tt_state); // deep copy of tt_state
    var c_to_s = new_state.courses_to_sections;
    
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
    this.makeRequest(new_state);
  },

 /**
  * Update tt_state with new preferences
  * @param {string} preference: the preference that is being updated
  * @param new_value: the new value of the specified preference
  * @return {void} doesn't return anything, just updates tt_state
  */
  updatePreferences: function(preference, new_value) {
    var new_state = $.extend(true, {}, tt_state); // deep copy of tt_state
    new_state.preferences[preference] = new_value;
    this.makeRequest(new_state);
  },

  // Makes a POST request to the backend with tt_state
  makeRequest: function(new_state) {
    $.post('/timetable/', JSON.stringify(new_state), function(response) {
        if (response.length > 0) {
          tt_state = new_state; //only update state if successful
          var index = 0;
          if (new_state.index) {
            index = new_state.index;
            delete new_state['index'];
          }
          this.trigger({
              timetables: response,
              courses_to_sections: tt_state.courses_to_sections,
              current_index: index,
              loading: false
          });
        } else if (tt_state.courses_to_sections != {}) { // conflict
          this.trigger({
            loading: false,
            conflict_error: true
          });
          ToastActions.createToast("That course caused a conflict! Try again with the Allow Conflicts preference turned on.");

        } else {
          this.trigger({loading: false});
        }
    }.bind(this));
  },


  loadPresetTimetable: function(url_data) {
    this.trigger({loading: true});
    var courses = url_data.split("&");
    tt_state.index = parseInt(courses.shift());
    var school = tt_state.school;
    for (var i = 0; i < courses.length; i++) {
      var c = parseInt(courses[i]);
      var course_info = courses[i].split("+");
      course_info.shift(); // removes first element
      tt_state.courses_to_sections[c] = {'L': '', 'T': '', 'P': '', 'C': ''};
      if (course_info.length > 0) {
        for (var j = 0; j < course_info.length; j++) {
          var section = course_info[j];
          if (school == "uoft") {
            tt_state.courses_to_sections[c][section[0]] = section;
          }
          else if (school == "jhu") {
            tt_state.courses_to_sections[c]['C'] = section;
          }
        }
      }
    }
    this.makeRequest(tt_state);
  },

  getInitialState: function() {
    return {
      timetables: [], 
      courses_to_sections: {}, 
      current_index: -1, 
      conflict_error: false,
      loading: false};
  }
});

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');

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

  getShareLink: function() {
    var link = window.location.host + "/" + this.state.current_index + "&";
    var c_to_s = this.state.courses_to_sections;
    for (var course_id in c_to_s) {
      link += course_id;
      var mapping = c_to_s[course_id];
      for (var section_heading in mapping) { // i.e 'L', 'T', 'P', 'S'
        if (mapping[section_heading] != "") {
          link += "+" + mapping[section_heading]; // delimiter for sections locked
        }
      }
      link += "&"; // delimiter for courses
    }
    link = link.slice(0, -1);
    return link;
  },


  render: function() {
      var slot_manager = this.state.timetables.length == 0 ? null :
       (React.createElement(SlotManager, {toggleModal: this.props.toggleModal, 
                     timetable: this.state.timetables[this.state.current_index], 
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
                React.createElement("a", {className: "btn btn-primary right calendar-function", 
                   "data-clipboard-text": this.getShareLink()}, 
                  React.createElement("span", {className: "fui-clip"})
                ), 
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

  componentDidMount: function() {
    var clip = new Clipboard('.calendar-function');
    clip.on('success', function(e) {
      ToastActions.createToast("Link copied to clipboard!");
    });
  },




});

},{"./actions/toast_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	getInitialState: function() {
		return {visible: true};
	},		
	render: function() {
		var toast = this.state.visible ? 
				(React.createElement("div", {className: "sem-toast-wrapper toasting"}, 
					React.createElement("div", {className: "sem-toast"}, this.props.content)
				)) : null;
		return toast;
	},
	componentDidMount: function() {
		setTimeout(function() {
			if (this._reactInternalInstance) { // if mounted still
				this.setState({visible: false});
			}
		}.bind(this), 3000);
	},

});

},{}]},{},["/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FjdGlvbnMvY291cnNlX2FjdGlvbnMuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYXBwLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvY29udHJvbF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9ldmFsdWF0aW9ucy5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2xvYWRlci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL21vZGFsX2NvbnRlbnQuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9wYWdpbmF0aW9uLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcHJlZmVyZW5jZV9tZW51LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcm9vdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NlYXJjaF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvY291cnNlX2luZm8uanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy90b2FzdF9zdG9yZS5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90aW1ldGFibGUuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90b2FzdC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxhQUFhLENBQUM7Q0FDaEI7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkM7RUFDQSxlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLGtCQUFrQjtFQUNsQixxQkFBcUI7R0FDcEI7Q0FDRixDQUFDOzs7QUNQRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUM5RCxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2IsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNoQixTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUVoQixRQUFRLENBQUMsTUFBTTtFQUNiLG9CQUFDLElBQUksRUFBQSxJQUFBLENBQUcsQ0FBQTtFQUNSLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO0FBQ2pDLENBQUMsQ0FBQzs7QUFFRixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7QUFDcEYsSUFBSSxJQUFJLEVBQUU7Q0FDVCxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUMzQzs7O0FDZEQsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3hDLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztBQUVsRCxvQ0FBb0MsdUJBQUE7O0VBRWxDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFjLENBQUEsRUFBQTtRQUNwQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLHNCQUF1QixDQUFBLEVBQUE7VUFDN0Isb0JBQUMsU0FBUyxFQUFBLENBQUEsQ0FBQyxXQUFBLEVBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVksQ0FBQSxDQUFHLENBQUE7UUFDOUMsQ0FBQSxFQUFBO1FBQ04sb0JBQUMsY0FBYyxFQUFBLElBQUEsQ0FBRyxDQUFBO0FBQzFCLE1BQVksQ0FBQTs7TUFFTjtHQUNIO0NBQ0YsQ0FBQyxDQUFDOzs7QUNoQkgsSUFBSSxnQ0FBZ0MsMEJBQUE7Q0FDbkMsTUFBTSxFQUFFLFdBQVc7RUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsb0JBQW9CLEdBQUcsV0FBVztFQUN0RSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUk7R0FDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxTQUFVLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQVEsQ0FBQTtJQUM3RTtFQUNGLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSTtHQUNyQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLE1BQU8sQ0FBQSxFQUFBLGFBQUEsRUFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFnQixDQUFBO0lBQy9EO0VBQ0Y7RUFDQSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLE9BQU8sRUFBQyxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWtCLENBQUUsQ0FBQSxFQUFBO0dBQ2hFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsY0FBZSxDQUFBLEVBQUE7SUFDdEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxNQUFPLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFXLENBQUEsRUFBQTtJQUN0RCxJQUFJLEVBQUM7SUFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7S0FDL0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBO01BQ3BDLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsS0FBQSxFQUFLLENBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUMsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxRQUFTLENBQU8sQ0FBQTtLQUNuRixDQUFBLEVBQUE7S0FDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxHQUFVLENBQUE7SUFDekUsQ0FBQTtHQUNELENBQUEsRUFBQTtHQUNMLE9BQVE7RUFDSixDQUFBLEVBQUU7RUFDUjtBQUNGLENBQUMsQ0FBQyxDQUFDOztBQUVILG9DQUFvQyx1QkFBQTs7Q0FFbkMsZUFBZSxFQUFFLFdBQVc7RUFDM0IsT0FBTztHQUNOLGFBQWEsRUFBRSxJQUFJO0dBQ25CO0FBQ0gsRUFBRTs7Q0FFRCxNQUFNLEVBQUUsV0FBVztFQUNsQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDVixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7R0FDaEQsQ0FBQyxFQUFFLENBQUM7R0FDSixJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7R0FDN0MsUUFBUSxvQkFBQyxVQUFVLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLENBQUMsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxpQkFBQSxFQUFpQixDQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxRQUFBLEVBQVEsQ0FBRSxRQUFTLENBQUEsQ0FBRyxDQUFBLEVBQUU7R0FDaEgsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFjLENBQUEsRUFBQSwyQ0FBK0MsQ0FBQSxLQUFLLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsYUFBYyxDQUFBLEVBQUEscURBQXlELENBQUEsQ0FBQyxDQUFDO0VBQ2xOO0VBQ0Esb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxhQUFBLEVBQWEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxvQkFBcUIsQ0FBQSxFQUFBO0dBQ3BELG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEscUJBQXdCLENBQUEsRUFBQTtHQUM1QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO0lBQzVCLEtBQU07R0FDRixDQUFBLEVBQUE7R0FDTCxZQUFhO0VBQ1QsQ0FBQSxFQUFFO0FBQ1YsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsU0FBUyxPQUFPLEVBQUU7RUFDakMsUUFBUSxXQUFXO0dBQ2xCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksT0FBTztBQUMxQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0dBQ3pDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQ2Q7Q0FDRCxDQUFDOzs7QUM1REYsb0NBQW9DLHVCQUFBOztDQUVuQyxNQUFNLEVBQUUsV0FBVztFQUNsQjtZQUNVLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUE7Z0JBQ1gsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtpQkFDN0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUEsRUFBQTtpQkFDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUEsRUFBQTtpQkFDeEMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBTSxDQUFBLEVBQUE7aUJBQ3hDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU0sQ0FBQSxFQUFBO2lCQUN4QyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFNLENBQUE7Z0JBQ25DLENBQUE7WUFDSixDQUFBLEVBQUU7RUFDbEI7QUFDRixDQUFDLENBQUMsQ0FBQzs7O0FDbEJILElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqQyxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3hELElBQUksaUJBQWlCLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDckQsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNqRSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN6RCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUM7O0FBRS9DLG9DQUFvQyx1QkFBQTtBQUNwQyxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7Q0FFM0MsTUFBTSxFQUFFLFdBQVc7RUFDbEIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsb0JBQUMsTUFBTSxFQUFBLElBQUEsQ0FBRyxDQUFBLEdBQUcsSUFBSSxDQUFDO0VBQ3BELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO0VBQ3pELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFO0VBQ25FLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFO0VBQ25FLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7RUFDekUsSUFBSSxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUU7RUFDOUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUU7RUFDN0Q7R0FDQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGVBQWdCLENBQUEsRUFBQTtnQkFDVixNQUFNLEVBQUM7Z0JBQ1AsTUFBTSxFQUFDO2dCQUNQLFdBQVcsRUFBQztnQkFDWixXQUFXLEVBQUM7Z0JBQ1osUUFBUSxFQUFDO2dCQUNULFNBQVMsRUFBQztnQkFDVixjQUFlO1lBQ2QsQ0FBQSxFQUFFO0FBQ3BCLEVBQUU7O0NBRUQsU0FBUyxFQUFFLFdBQVc7RUFDckIsSUFBSSxNQUFNLElBQUksb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtHQUMzQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLHFCQUFzQixDQUFBLEVBQUE7SUFDN0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxNQUFPLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFXLENBQUEsRUFBQTtJQUNsRCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLE1BQU8sQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQVcsQ0FBQTtHQUM3QyxDQUFBLEVBQUE7R0FDTixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUFBLEVBQXdCLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRyxDQUFFLENBQUE7RUFDaEUsQ0FBQSxDQUFDO0VBQ1AsT0FBTyxNQUFNO0FBQ2YsRUFBRTs7Q0FFRCxTQUFTLEVBQUUsV0FBVztFQUNyQixRQUFRLFdBQVc7R0FDbEIsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDakcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEIsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxTQUFTLFNBQVMsRUFBRTtFQUN0QyxRQUFRLFdBQVc7R0FDbEIsY0FBYyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUM7R0FDdkMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEIsRUFBRTs7Q0FFRCxjQUFjLEVBQUUsV0FBVztFQUMxQixJQUFJLFdBQVc7SUFDYixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLG9CQUFxQixDQUFBLEVBQUE7SUFDckQsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxjQUFpQixDQUFBLEVBQUE7SUFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBWTtHQUMvQixDQUFBLENBQUM7RUFDUixPQUFPLFdBQVcsQ0FBQztBQUNyQixFQUFFOztDQUVELGNBQWMsRUFBRSxXQUFXO0VBQzFCLE9BQU8sb0JBQUMsaUJBQWlCLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVUsQ0FBQSxDQUFHLENBQUE7QUFDM0UsRUFBRTs7Q0FFRCxpQkFBaUIsRUFBRSxXQUFXO0VBQzdCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUN2RTthQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsZUFBQSxFQUFlLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEdBQUEsRUFBRyxDQUFFLEVBQUUsQ0FBQyxFQUFJLENBQUEsRUFBQTtjQUMzRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGdCQUFpQixDQUFBLEVBQUE7ZUFDeEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxhQUFjLENBQUEsRUFBQTtnQkFDckIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxNQUFPLENBQUEsRUFBQyxFQUFFLENBQUMsSUFBVyxDQUFBLEVBQUE7Z0JBQzlCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUMsRUFBRSxDQUFDLElBQVcsQ0FBQTtlQUN6QixDQUFBO2NBQ0QsQ0FBQTthQUNELENBQUEsQ0FBQztTQUNYLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7RUFDcEIsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSTtJQUM1RSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQWMsQ0FBQSxFQUFBO0lBQzdCLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEseUJBQTRCLENBQUEsRUFBQTtJQUNoQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLHVCQUF3QixDQUFBLEVBQUE7S0FDOUIsT0FBUTtJQUNKLENBQUE7R0FDRCxDQUFBLENBQUM7RUFDUixPQUFPLGNBQWM7QUFDdkIsRUFBRTs7QUFFRixDQUFDLG9CQUFvQixFQUFFLFdBQVc7O0FBRWxDLEVBQUU7O0NBRUQsWUFBWSxFQUFFLFdBQVc7RUFDeEIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNqRjthQUNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7Y0FDekIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxNQUFBLEVBQU0sQ0FBQyxLQUFBLEVBQUssQ0FBQyxHQUFBLEVBQUcsQ0FBRSxFQUFFLENBQUMsU0FBVSxDQUFFLENBQUEsRUFBQTtjQUN0QyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFDLEVBQUUsQ0FBQyxLQUFXLENBQUEsRUFBQTtjQUNuQixvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFDLEVBQUUsQ0FBQyxNQUFhLENBQUEsRUFBQTtjQUN0QixvQkFBQSxLQUFJLEVBQUEsSUFBQyxFQUFBLE9BQUEsRUFBTSxFQUFFLENBQUMsSUFBVyxDQUFBLEVBQUE7Y0FDekIsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBRSxFQUFFLENBQUMsVUFBVSxFQUFDLENBQUMsTUFBQSxFQUFNLENBQUMsUUFBUyxDQUFBLEVBQUE7ZUFDdkMsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBQyxxR0FBQSxFQUFxRyxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQUEsRUFBSyxDQUFDLE1BQUEsRUFBTSxDQUFDLElBQUEsRUFBSSxDQUFDLE1BQUEsRUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFBO2NBQ2hKLENBQUE7YUFDQyxDQUFBLENBQUM7U0FDWCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ3BCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGFBQWMsQ0FBQSxFQUFBLGtDQUFzQyxDQUFBO0tBQzFJLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsV0FBWSxDQUFBLEVBQUE7Y0FDVixpQkFBa0I7YUFDZCxDQUFBLENBQUM7RUFDbEIsSUFBSSxHQUFHO0lBQ0wsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxhQUFBLEVBQWEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxrQkFBbUIsQ0FBQSxFQUFBO0lBQ25ELG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsWUFBZSxDQUFBLEVBQUE7SUFDbEIsU0FBVTtHQUNOLENBQUEsQ0FBQztFQUNSLE9BQU8sR0FBRztBQUNaLEVBQUU7O0NBRUQsV0FBVyxFQUFFLFdBQVc7RUFDdkIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUN4RCxRQUFRLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLFlBQUEsRUFBWSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBQyxDQUFDLE9BQUEsRUFBTyxDQUFFLENBQUUsQ0FBRSxDQUFBLENBQUM7R0FDcEcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNkLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7R0FDeEQsUUFBUSxvQkFBQyxXQUFXLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxZQUFBLEVBQVksQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUMsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxDQUFFLENBQUUsQ0FBQSxDQUFDO0dBQ3BHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7RUFDZCxJQUFJLFFBQVE7SUFDVixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFBLEVBQUE7SUFDbEQsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxrQkFBcUIsQ0FBQSxFQUFBO0lBQ3pCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsc0JBQXVCLENBQUEsRUFBQTtLQUM3QixDQUFDLEVBQUM7S0FDRixDQUFFO0lBQ0UsQ0FBQTtHQUNELENBQUEsQ0FBQztFQUNSLE9BQU8sUUFBUTtBQUNqQixFQUFFO0FBQ0Y7O0FBRUEsQ0FBQyxDQUFDLENBQUM7OztBQ3hJSCxvQ0FBb0MsdUJBQUE7RUFDbEMsZUFBZSxFQUFFLFdBQVc7SUFDMUIsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoQyxHQUFHOztFQUVELFVBQVUsRUFBRSxTQUFTLFNBQVMsRUFBRTtNQUM1QixRQUFRLFNBQVMsS0FBSyxFQUFFO09BQ3ZCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYTtBQUM3QyxXQUFXLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQzs7T0FFN0IsSUFBSSxTQUFTLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7T0FDeEQsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLFNBQVMsR0FBRyxLQUFLLEVBQUU7UUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUNqQztLQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xCLEdBQUc7O0VBRUQsTUFBTSxFQUFFLFdBQVc7SUFDakIsSUFBSSxPQUFPLEdBQUcsRUFBRSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7SUFDL0UsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtJQUNoQyxJQUFJLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO01BQ2xDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsR0FBRyxRQUFRLEdBQUcsRUFBRSxDQUFDO01BQzlELE9BQU8sQ0FBQyxJQUFJO1FBQ1Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxDQUFDLEVBQUMsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxTQUFXLENBQUEsRUFBQTtjQUM1QixvQkFBQSxHQUFFLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBRyxDQUFBLEVBQUMsQ0FBQyxHQUFHLENBQU0sQ0FBQTtRQUNoRCxDQUFBLENBQUMsQ0FBQztBQUNmLEtBQUs7O0lBRUQ7UUFDSSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLCtCQUFnQyxDQUFBLEVBQUE7VUFDN0Msb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtZQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsYUFBQSxFQUFhLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBRyxDQUFBLEVBQUE7Y0FDeEQsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO2dCQUM5QixvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHlCQUEwQixDQUFPLENBQU0sQ0FBQTtZQUN0RCxDQUFBLEVBQUE7WUFDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO2NBQ3ZCLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsK0JBQUEsRUFBK0I7Z0JBQzFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBTSxDQUFJLENBQUE7WUFDN0IsQ0FBQSxFQUFBO0FBQ2pCLFlBQWEsT0FBTyxFQUFDOztZQUVULG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsTUFBTyxDQUFBLEVBQUE7Y0FDbkIsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxnQ0FBQSxFQUFnQztnQkFDM0MsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFNLENBQUksQ0FBQTtZQUM3QixDQUFBLEVBQUE7WUFDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGFBQUEsRUFBYSxDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFHLENBQUEsRUFBQTtjQUN2RCxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGdCQUFpQixDQUFBLEVBQUE7Z0JBQzlCLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMEJBQTJCLENBQU8sQ0FBTSxDQUFBO1lBQ3ZELENBQUE7VUFDRixDQUFBO1FBQ0QsQ0FBQTtNQUNSO0FBQ04sR0FBRztBQUNIOztDQUVDLENBQUM7OztBQ3pERixJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ2pFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDOztBQUU5RCxJQUFJLHNDQUFzQyxnQ0FBQTtBQUMxQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7O0VBRXhDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksWUFBWSxHQUFHLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztJQUN4RDtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQWtCLENBQUEsRUFBQTtRQUMvQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlCQUFrQixDQUFBLEVBQUE7VUFDL0Isb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxHQUFBLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUMsR0FBTSxDQUFBO1FBQ3hCLENBQUEsRUFBQTtRQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtVQUNqQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFFBQVMsQ0FBQSxFQUFBO1lBQ3RCLG9CQUFBLE9BQU0sRUFBQSxDQUFBLENBQUMsR0FBQSxFQUFHLENBQUMsZUFBQSxFQUFlLENBQUMsRUFBQSxFQUFFLENBQUUsWUFBWSxFQUFDO21CQUNyQyxTQUFBLEVBQVMsQ0FBQyw2QkFBQSxFQUE2QixDQUFDLElBQUEsRUFBSSxDQUFDLFVBQUEsRUFBVTttQkFDdkQsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLGdCQUFpQixDQUFFLENBQUEsRUFBQTtZQUN4QyxvQkFBQSxPQUFNLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLFlBQWMsQ0FBUSxDQUFBO1VBQ2xDLENBQUE7UUFDRixDQUFBO01BQ0YsQ0FBQTtNQUNOO0FBQ04sR0FBRzs7RUFFRCxnQkFBZ0IsRUFBRSxXQUFXO0lBQzNCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztJQUNoRCxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztHQUNoRTtBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILG9DQUFvQyx1QkFBQTtBQUNwQyxFQUFFLGlCQUFpQixFQUFFLENBQUM7O0VBRXBCLE1BQU0sRUFBRSxXQUFXO0lBQ2pCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxnQkFBQSxFQUFnQixDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO1FBQzVDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQWlCLENBQUUsQ0FBQSxFQUFBO1VBQ2hDLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsZ0JBQUEsRUFBZ0IsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxNQUFPLENBQUEsRUFBQTtZQUN2QyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO2NBQ0Ysb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxXQUFZLENBQUEsRUFBQSxhQUFlLENBQUEsRUFBQTtjQUNuQyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO2dCQUNGLG9CQUFDLGdCQUFnQixFQUFBLENBQUEsQ0FBQyxJQUFBLEVBQUksQ0FBQyxxQkFBQSxFQUFxQjtrQ0FDMUIsSUFBQSxFQUFJLENBQUMsbUJBQUEsRUFBbUI7a0NBQ3hCLFNBQUEsRUFBUyxDQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRyxDQUFBLENBQUcsQ0FBQSxFQUFBO2dCQUMxRCxvQkFBQyxnQkFBZ0IsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsb0JBQUEsRUFBb0I7a0NBQ3pCLElBQUEsRUFBSSxDQUFDLGtCQUFBLEVBQWtCO2tDQUN2QixTQUFBLEVBQVMsQ0FBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUcsQ0FBQSxDQUFHLENBQUEsRUFBQTtnQkFDMUQsb0JBQUMsZ0JBQWdCLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFDLGlCQUFBLEVBQWlCO2tDQUN0QixJQUFBLEVBQUksQ0FBQyxvQkFBQSxFQUFvQjtrQ0FDekIsU0FBQSxFQUFTLENBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFHLENBQUEsQ0FBRyxDQUFBO2NBQ3ZELENBQUE7WUFDRixDQUFBLEVBQUE7WUFDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUMsV0FBWSxDQUFBLEVBQUEsU0FBVyxDQUFLLENBQUEsRUFBQTtZQUN4QyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO2NBQ0Ysb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTtnQkFDNUIsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxXQUFjLENBQUE7Y0FDZCxDQUFBO1lBQ0gsQ0FBQSxFQUFBO1lBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtjQUNGLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsY0FBZSxDQUFBLEVBQUE7Z0JBQzVCLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsU0FBWSxDQUFBO2NBQ1osQ0FBQTtZQUNILENBQUEsRUFBQTtZQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7Y0FDRixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO2dCQUM1QixvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBLFVBQWEsQ0FBQTtjQUNiLENBQUE7WUFDSCxDQUFBO1VBQ0YsQ0FBQTtRQUNELENBQUE7TUFDRixDQUFBO01BQ047QUFDTixHQUFHOztFQUVELGtCQUFrQixFQUFFLFdBQVc7SUFDN0IsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUM7SUFDM0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDbEMsR0FBRzs7Q0FFRixDQUFDOzs7QUNoRkYsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzFDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN2QyxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUM5QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUNwRCxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUM5RCxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFFekQsb0NBQW9DLHVCQUFBO0FBQ3BDLEVBQUUsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztFQUVwRSxlQUFlLENBQUMsV0FBVztBQUM3QixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7SUFFbEIsT0FBTyxFQUFFLENBQUM7R0FDWDtFQUNELE1BQU0sRUFBRSxXQUFXO0FBQ3JCLElBQUksSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztJQUVsQztNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsTUFBTyxDQUFBLEVBQUE7UUFDYixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFNLENBQUEsRUFBQTtRQUNoQyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFBLEVBQUEsYUFBaUIsQ0FBQSxFQUFBO1FBQzNDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsdUJBQXdCLENBQUEsRUFBQTtVQUM5QixvQkFBQyxVQUFVLEVBQUEsQ0FBQSxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxpQkFBa0IsQ0FBRSxDQUFBO1FBQzlDLENBQUEsRUFBQTtRQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsaUJBQWtCLENBQUEsRUFBQTtVQUN4QixvQkFBQyxLQUFLLEVBQUEsQ0FBQSxDQUFDLEdBQUEsRUFBRyxDQUFDLGNBQUEsRUFBYyxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO2NBQy9DLG9CQUFDLFlBQVksRUFBQSxJQUFBLENBQUcsQ0FBQTtVQUNaLENBQUE7UUFDSixDQUFBLEVBQUE7UUFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLG9CQUFxQixDQUFBLEVBQUE7VUFDM0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBLFVBQWMsQ0FBQSxFQUFBO1lBQ3JDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsZUFBZ0IsQ0FBQSxFQUFBO2NBQ3RCLG9CQUFDLFNBQVMsRUFBQSxDQUFBLENBQUMsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLGlCQUFrQixDQUFBLENBQUcsQ0FBQTtZQUM5QyxDQUFBO1FBQ0osQ0FBQTtNQUNGLENBQUE7TUFDTjtBQUNOLEdBQUc7O0VBRUQsaUJBQWlCLEVBQUUsU0FBUyxTQUFTLEVBQUU7SUFDckMsT0FBTyxXQUFXO1FBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQyxjQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzNDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pCLEdBQUc7O0VBRUQsVUFBVSxFQUFFLFdBQVc7SUFDckIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxHQUFHLEdBQUcsR0FBRyxTQUFTO1FBQ3pDLEVBQUU7UUFDRixTQUFTLFFBQVEsRUFBRTtVQUNqQixPQUFPLEdBQUcsUUFBUSxDQUFDO1NBQ3BCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztLQUNmLENBQUM7QUFDTixHQUFHOztDQUVGLENBQUMsQ0FBQzs7O0FDeERILElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDakUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7O0FBRTlELElBQUksa0NBQWtDLDRCQUFBO0VBQ3BDLE1BQU0sRUFBRSxXQUFXO0lBQ2pCLElBQUksUUFBUSxHQUFHLGVBQWUsRUFBRSxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBQ3hELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7TUFDeEIsUUFBUSxJQUFJLFlBQVksQ0FBQztNQUN6QixVQUFVLEdBQUcsV0FBVyxDQUFDO0tBQzFCO0lBQ0Q7TUFDRSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFFLFFBQVEsRUFBQyxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFHLENBQUEsRUFBQTtRQUMzRSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBO1VBQzVCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsV0FBWSxDQUFBLEVBQUE7WUFDdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFLO1VBQ2QsQ0FBQSxFQUFBO1VBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFLO1FBQ2IsQ0FBQSxFQUFBO1FBQ04sb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSx1QkFBdUIsR0FBRyxVQUFVLEVBQUM7VUFDcEQsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLFlBQWMsQ0FBQTtRQUMzQixDQUFBO01BQ0osQ0FBQTtNQUNMO0FBQ04sR0FBRzs7RUFFRCxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUU7SUFDeEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDcEMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixHQUFHOztBQUVILENBQUMsQ0FBQyxDQUFDOztBQUVILG9DQUFvQyx1QkFBQTtBQUNwQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7O0VBRXhDLGVBQWUsRUFBRSxXQUFXO0lBQzFCLE9BQU87TUFDTCxPQUFPLEVBQUUsRUFBRTtNQUNYLE9BQU8sRUFBRSxLQUFLO0tBQ2YsQ0FBQztBQUNOLEdBQUc7O0VBRUQsTUFBTSxFQUFFLFdBQVc7SUFDakIsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztJQUMxRDtNQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsWUFBYSxDQUFBLEVBQUE7UUFDbkIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxlQUFnQixDQUFBLEVBQUE7VUFDN0Isb0JBQUEsT0FBTSxFQUFBLENBQUE7WUFDSixJQUFBLEVBQUksQ0FBQyxNQUFBLEVBQU07WUFDWCxXQUFBLEVBQVcsQ0FBQyx1REFBQSxFQUF1RDtZQUNuRSxFQUFBLEVBQUUsQ0FBQyxjQUFBLEVBQWM7WUFDakIsR0FBQSxFQUFHLENBQUMsT0FBQSxFQUFPO1lBQ1gsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssRUFBQyxDQUFDLE1BQUEsRUFBTSxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUM7WUFDdkMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFlBQWEsQ0FBRSxDQUFBLEVBQUE7VUFDL0Isb0JBQUEsUUFBTyxFQUFBLENBQUEsQ0FBQyxhQUFBLEVBQVcsQ0FBQyxVQUFBLEVBQVUsQ0FBQyxhQUFBLEVBQVcsQ0FBQyxpQkFBQSxFQUFpQixDQUFDLEVBQUEsRUFBRSxDQUFDLFVBQVcsQ0FBQSxFQUFBO1lBQ3pFLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQUksQ0FBQTtVQUM3QixDQUFBLEVBQUE7VUFDUixrQkFBbUI7UUFDaEIsQ0FBQTtNQUNGLENBQUE7TUFDTjtBQUNOLEdBQUc7O0VBRUQseUJBQXlCLEVBQUUsV0FBVztJQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDekUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO01BQ3RELENBQUMsRUFBRSxDQUFDO01BQ0osSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDO01BQzdEO1FBQ0Usb0JBQUMsWUFBWSxFQUFBLGdCQUFBLEdBQUEsQ0FBRSxHQUFHLENBQUMsRUFBQyxDQUFDLENBQUEsR0FBQSxFQUFHLENBQUUsQ0FBQyxFQUFDLENBQUMsU0FBQSxFQUFTLENBQUUsU0FBUyxFQUFDLENBQUMsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFZLENBQUEsQ0FBRSxDQUFBO1FBQ3pGO0tBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNkO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQywwQkFBMkIsQ0FBQSxFQUFBO1FBQ2pDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7WUFDdEIsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxnQkFBaUIsQ0FBQSxFQUFBO2NBQ3JCLGNBQWU7WUFDYixDQUFBO1VBQ0QsQ0FBQTtNQUNKLENBQUE7TUFDTjtBQUNOLEdBQUc7O0VBRUQsS0FBSyxFQUFFLFdBQVc7SUFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ25DLEdBQUc7O0VBRUQsSUFBSSxFQUFFLFdBQVc7SUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDcEMsR0FBRzs7RUFFRCxZQUFZLEVBQUUsU0FBUyxLQUFLLEVBQUU7SUFDNUIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDN0MsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLEdBQUc7O0VBRUQsYUFBYSxFQUFFLFNBQVMsS0FBSyxFQUFFO0lBQzdCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDdkMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDekMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7S0FDbEQsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxPQUFPLENBQUM7QUFDbkIsR0FBRztBQUNIOztDQUVDLENBQUMsQ0FBQzs7O0FDN0dILElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDakUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7O0FBRTlELGtEQUFrRDtBQUNsRCxJQUFJLG1CQUFtQixHQUFHO0lBQ3RCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0FBQ3pCLENBQUMsQ0FBQyw0QkFBNEI7O0FBRTlCLHFEQUFxRDtBQUNyRCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQzs7QUFFMUIsSUFBSSxhQUFhLEdBQUc7SUFDaEIsR0FBRyxHQUFHLEdBQUc7SUFDVCxHQUFHLEdBQUcsR0FBRztJQUNULEdBQUcsR0FBRyxHQUFHO0lBQ1QsR0FBRyxFQUFFLElBQUk7SUFDVCxHQUFHLEdBQUcsR0FBRztJQUNULEdBQUcsRUFBRSxJQUFJO0lBQ1QsR0FBRyxFQUFFLEdBQUc7QUFDWixDQUFDOztBQUVELG9DQUFvQyx1QkFBQTtJQUNoQyxNQUFNLEVBQUUsV0FBVztRQUNmLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtRQUMxQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLElBQUksSUFBSSxHQUFHLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsRUFBQSxFQUFFLENBQUMsYUFBYyxDQUFBLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQXNCLENBQUE7UUFDL0QsSUFBSSxJQUFJLEdBQUcsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxPQUFRLENBQUEsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBa0IsQ0FBQTtRQUNyRCxJQUFJLFNBQVMsR0FBRyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLFdBQVksQ0FBQSxFQUFDLElBQUksRUFBRSxJQUFXLENBQUE7UUFDdEQsT0FBTyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGlCQUFrQixDQUFBLEVBQUMsU0FBUyxFQUFFLFdBQWtCLENBQUE7QUFDdkUsS0FBSzs7SUFFRCx5QkFBeUIsRUFBRSxXQUFXO1FBQ2xDLFVBQVUsR0FBRyxFQUFFO1FBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7Z0JBQ3pDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEI7U0FDSjtRQUNELE9BQU8sVUFBVSxDQUFDO0FBQzFCLEtBQUs7O0lBRUQsZUFBZSxFQUFFLFNBQVMsR0FBRyxFQUFFO1FBQzNCLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLFVBQVcsQ0FBQSxFQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFlLENBQUEsRUFBRTtTQUNwRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2QsU0FBUyxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLGNBQWUsQ0FBQSxFQUFBO2dCQUN2QixXQUFZO1lBQ1gsQ0FBQSxFQUFFO0tBQ2Y7Q0FDSixDQUFDLENBQUM7OztBQzFESCxJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ2pFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBQzlEOztBQUVBLGtEQUFrRDtBQUNsRCxJQUFJLG1CQUFtQixHQUFHO0lBQ3RCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0lBQ3JCLFNBQVMsR0FBRyxTQUFTO0FBQ3pCLENBQUMsQ0FBQyw0QkFBNEI7O0FBRTlCLHFEQUFxRDtBQUNyRCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQzs7QUFFMUIsSUFBSSwwQkFBMEIsb0JBQUE7SUFDMUIsZUFBZSxFQUFFLFdBQVc7UUFDeEIsT0FBTyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyQyxLQUFLOztJQUVELE1BQU0sRUFBRSxXQUFXO1FBQ2YsSUFBSSxHQUFHLEdBQUcsSUFBSSxFQUFFLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDN0MsUUFBUSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7O1FBRXJDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUU7WUFDekIsR0FBRztZQUNILG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtnQkFDL0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQkFBQSxFQUFpQixDQUFDLE9BQUEsRUFBTyxDQUFFLElBQUksQ0FBQyxTQUFVLENBQUUsQ0FBQSxFQUFBO29CQUN2RCxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGtCQUFtQixDQUFPLENBQUE7ZUFDekMsQ0FBQTtZQUNILENBQUEsQ0FBQyxDQUFDO1lBQ1IsYUFBYSxLQUFLLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7Z0JBQzFDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUJBQUEsRUFBaUIsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxJQUFJLENBQUMsWUFBYSxDQUFFLENBQUEsRUFBQTtvQkFDMUQsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxvQkFBcUIsQ0FBTyxDQUFBO2VBQzNDLENBQUE7WUFDSCxDQUFBLENBQUMsQ0FBQztTQUNYO1FBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNuQixHQUFHO1lBQ0gsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBQSxFQUFBO2dCQUMvQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHdCQUFBLEVBQXdCLENBQUMsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLFdBQVksQ0FBRSxDQUFBLEVBQUE7b0JBQ2hFLG9CQUFBLE1BQUssRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsa0JBQW1CLENBQU8sQ0FBQTtlQUN6QyxDQUFBO1lBQ0gsQ0FBQSxDQUFDLENBQUM7QUFDcEIsU0FBUzs7SUFFTDtRQUNJLG9CQUFBLEtBQUksRUFBQSxDQUFBO1lBQ0EsT0FBQSxFQUFPLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBQztZQUNuRCxZQUFBLEVBQVksQ0FBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUM7WUFDckMsWUFBQSxFQUFZLENBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDO1lBQ3ZDLFNBQUEsRUFBUyxDQUFFLG1EQUFtRCxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDO1lBQ25GLEtBQUEsRUFBSyxDQUFFLFVBQVksQ0FBQSxFQUFBO1lBQ2xCLGFBQWEsRUFBQztZQUNmLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsWUFBYSxDQUFBLEVBQUE7Y0FDMUIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxTQUFVLENBQUEsRUFBQTtnQkFDdkIsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBQyxLQUFBLEVBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFnQixDQUFBO2NBQ3hELENBQUEsRUFBQTtjQUNOLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsd0JBQXlCLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFzQixDQUFBLEVBQUE7Y0FDbEcsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx3QkFBeUIsQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBVyxDQUFBO1lBQzNELENBQUEsRUFBQTtZQUNMLEdBQUk7UUFDSCxDQUFBO1VBQ0o7QUFDVixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFSSxZQUFZLEVBQUUsV0FBVztRQUNyQixJQUFJLFVBQVUsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELFlBQVksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELFFBQVEsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLFlBQVksVUFBVSxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7UUFFL0QsSUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xFLFFBQVEsSUFBSSxNQUFNLEdBQUcsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDdEM7O0FBRUEsUUFBUSxJQUFJLGlCQUFpQixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFbEUsUUFBUSxJQUFJLHFCQUFxQixHQUFHLGlCQUFpQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDOztRQUV6RSxJQUFJLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLHFCQUFxQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUM5RixPQUFPO1lBQ0gsS0FBSyxFQUFFLHFCQUFxQixHQUFHLEdBQUc7WUFDbEMsR0FBRyxFQUFFLEdBQUc7WUFDUixNQUFNLEVBQUUsTUFBTTtZQUNkLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDbEMsTUFBTSxFQUFFLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDeEMsSUFBSSxFQUFFLFNBQVMsR0FBRyxHQUFHO1lBQ3JCLE1BQU0sRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXO1NBQ3ZDLENBQUM7QUFDVixLQUFLOztJQUVELGlCQUFpQixFQUFFLFdBQVc7UUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQzlEO0lBQ0QsbUJBQW1CLEVBQUUsV0FBVztRQUM1QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3pDO0lBQ0QsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1FBQ25CLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDakQsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZTtZQUNuQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7S0FDdkI7SUFDRCxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUU7UUFDckIsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUNqRCxPQUFPLEVBQUUsRUFBRTtZQUNYLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUN2QjtJQUNELFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRTtRQUN0QixnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQ2pELE9BQU8sRUFBRSxFQUFFO1lBQ1gsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQzVCLEtBQUs7O0lBRUQsYUFBYSxFQUFFLFNBQVMsTUFBTSxFQUFFO1FBQzVCLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7V0FDNUIsR0FBRyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQztXQUMvQixHQUFHLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZDLEtBQUs7O0FBRUwsQ0FBQyxDQUFDLENBQUM7O0FBRUgsb0NBQW9DLHVCQUFBOztJQUVoQyxNQUFNLEVBQUUsV0FBVztRQUNmLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN4QyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFO1lBQ25DLElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sb0JBQUMsSUFBSSxFQUFBLGdCQUFBLEdBQUEsQ0FBRSxHQUFHLElBQUksRUFBQyxDQUFDLENBQUEsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUMsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFDLENBQUMsTUFBQSxFQUFNLENBQUUsQ0FBRSxDQUFBLENBQUUsQ0FBQTthQUN6RixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2Q7b0JBQ1Esb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxHQUFBLEVBQUcsQ0FBRSxHQUFLLENBQUEsRUFBQTt3QkFDVixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG9CQUFxQixDQUFBLEVBQUE7NEJBQy9CLFNBQVU7d0JBQ1QsQ0FBQTtvQkFDTCxDQUFBO2NBQ1g7U0FDTCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2Q7WUFDSSxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO2NBQ0wsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtnQkFDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO2tCQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsU0FBVSxDQUFLLENBQUEsRUFBQTtrQkFDNUIsU0FBVTtnQkFDUixDQUFBO2NBQ0MsQ0FBQTtBQUN0QixZQUFvQixDQUFBOztVQUVWO0FBQ1YsS0FBSzs7SUFFRCxpQkFBaUIsRUFBRSxXQUFXO1FBQzFCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUMzQixRQUFRLElBQUksUUFBUSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7O0FBRWpELEtBQUs7O0lBRUQsUUFBUSxFQUFFLFNBQVMsSUFBSSxFQUFFO1FBQ3JCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xFLElBQUksT0FBTyxJQUFJLE1BQU0sRUFBRTtZQUNuQixVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JGO1FBQ0QsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQztBQUNsRCxLQUFLOztJQUVELGFBQWEsRUFBRSxXQUFXO1FBQ3RCLElBQUksWUFBWSxHQUFHO1lBQ2YsR0FBRyxFQUFFLEVBQUU7WUFDUCxHQUFHLEVBQUUsRUFBRTtZQUNQLEdBQUcsRUFBRSxFQUFFO1lBQ1AsR0FBRyxFQUFFLEVBQUU7WUFDUCxHQUFHLEVBQUUsRUFBRTtTQUNWLENBQUM7UUFDRixLQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUM3QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MsS0FBSyxJQUFJLE9BQU8sSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO2dCQUMzQixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3JDO1NBQ0o7UUFDRCxPQUFPLFlBQVksQ0FBQztBQUM1QixLQUFLOztDQUVKLENBQUMsQ0FBQzs7O0FDN01ILElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDOztBQUU3RCxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDcEMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxjQUFjLENBQUM7O0VBRTdCLGFBQWEsRUFBRSxTQUFTLFNBQVMsRUFBRTtJQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsT0FBTyxHQUFHLE1BQU0sR0FBRyxTQUFTO1NBQzFDLEVBQUU7U0FDRixTQUFTLFFBQVEsRUFBRTtZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztVQUN4RCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDckIsS0FBSyxDQUFDOztBQUVOLEdBQUc7O0VBRUQsZUFBZSxFQUFFLFdBQVc7SUFDMUIsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzNDO0NBQ0YsQ0FBQyxDQUFDOzs7QUNuQkgsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2hDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDOztBQUUxRCxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDcEMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUM7O0VBRTNCLFdBQVcsRUFBRSxTQUFTLE9BQU8sRUFBRTtJQUM3QixJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDM0QsUUFBUSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLFFBQVEsQ0FBQyxNQUFNO01BQ2Isb0JBQUMsS0FBSyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxPQUFRLENBQUEsQ0FBRyxDQUFBO01BQzNCLFNBQVM7S0FDVixDQUFDO0FBQ04sR0FBRztBQUNIOztDQUVDLENBQUMsQ0FBQzs7O0FDaEJILElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ3pELElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQzFEOztBQUVBLElBQUksUUFBUSxHQUFHO0VBQ2IsTUFBTSxFQUFFLEtBQUs7RUFDYixRQUFRLEVBQUUsR0FBRztFQUNiLG1CQUFtQixFQUFFLEVBQUU7RUFDdkIsV0FBVyxFQUFFO0lBQ1gsbUJBQW1CLEVBQUUsS0FBSztJQUMxQixrQkFBa0IsRUFBRSxLQUFLO0lBQ3pCLGNBQWMsRUFBRSxLQUFLO0lBQ3JCLFNBQVMsRUFBRSxLQUFLO0lBQ2hCLFlBQVksRUFBRSxLQUFLO0lBQ25CLG9CQUFvQixFQUFFLEtBQUs7R0FDNUI7QUFDSCxDQUFDOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztFQUNsQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUM7QUFDeEIsRUFBRSxtQkFBbUIsRUFBRSxFQUFFO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0VBRUUsYUFBYSxFQUFFLFNBQVMsdUJBQXVCLEVBQUU7QUFDbkQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRTdCLElBQUksUUFBUSxHQUFHLHVCQUF1QixDQUFDLFFBQVEsQ0FBQztJQUNoRCxJQUFJLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDO0lBQzlDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNqRCxJQUFJLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQzs7SUFFM0MsSUFBSSxDQUFDLFFBQVEsRUFBRTtNQUNiLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDNUIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO09BQzNGO1dBQ0ksSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRTtRQUNsQyxJQUFJLGVBQWUsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDMUQsSUFBSSxPQUFPLEVBQUU7VUFDWCxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDN0MsWUFBWSxlQUFlLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3BEOztXQUVXO1VBQ0QsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUN2QztRQUNELE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxlQUFlLENBQUM7T0FDekM7S0FDRjtTQUNJO01BQ0gsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7TUFDN0IsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7VUFDakMsUUFBUSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztVQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1VBQ3JDLE9BQU87T0FDVjtLQUNGO0lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztFQUVFLGlCQUFpQixFQUFFLFNBQVMsVUFBVSxFQUFFLFNBQVMsRUFBRTtJQUNqRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0MsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDOUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxHQUFHO0FBQ0g7O0VBRUUsV0FBVyxFQUFFLFNBQVMsU0FBUyxFQUFFO0lBQy9CLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxRQUFRLEVBQUU7UUFDaEUsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtVQUN2QixRQUFRLEdBQUcsU0FBUyxDQUFDO1VBQ3JCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztVQUNkLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRTtZQUNuQixLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUN4QixPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUMzQjtVQUNELElBQUksQ0FBQyxPQUFPLENBQUM7Y0FDVCxVQUFVLEVBQUUsUUFBUTtjQUNwQixtQkFBbUIsRUFBRSxRQUFRLENBQUMsbUJBQW1CO2NBQ2pELGFBQWEsRUFBRSxLQUFLO2NBQ3BCLE9BQU8sRUFBRSxLQUFLO1dBQ2pCLENBQUMsQ0FBQztTQUNKLE1BQU0sSUFBSSxRQUFRLENBQUMsbUJBQW1CLElBQUksRUFBRSxFQUFFO1VBQzdDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDWCxPQUFPLEVBQUUsS0FBSztZQUNkLGNBQWMsRUFBRSxJQUFJO1dBQ3JCLENBQUMsQ0FBQztBQUNiLFVBQVUsWUFBWSxDQUFDLFdBQVcsQ0FBQyx5RkFBeUYsQ0FBQyxDQUFDOztTQUVySCxNQUFNO1VBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2hDO0tBQ0osQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNsQixHQUFHO0FBQ0g7O0VBRUUsbUJBQW1CLEVBQUUsU0FBUyxRQUFRLEVBQUU7SUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzlCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEMsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDM0MsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUN2QyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDN0IsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUN4QyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7TUFDcEIsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO01BQ3ZFLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7VUFDM0MsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQzdCLElBQUksTUFBTSxJQUFJLE1BQU0sRUFBRTtZQUNwQixRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO1dBQ3ZEO2VBQ0ksSUFBSSxNQUFNLElBQUksS0FBSyxFQUFFO1lBQ3hCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7V0FDaEQ7U0FDRjtPQUNGO0tBQ0Y7SUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQy9CLEdBQUc7O0VBRUQsZUFBZSxFQUFFLFdBQVc7SUFDMUIsT0FBTztNQUNMLFVBQVUsRUFBRSxFQUFFO01BQ2QsbUJBQW1CLEVBQUUsRUFBRTtNQUN2QixhQUFhLEVBQUUsQ0FBQyxDQUFDO01BQ2pCLGNBQWMsRUFBRSxLQUFLO01BQ3JCLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNuQjtDQUNGLENBQUMsQ0FBQzs7O0FDM0lILElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzVDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN6QyxJQUFJLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBQ2xFLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDOUQsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7O0FBRXRELG9DQUFvQyx1QkFBQTtBQUNwQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7RUFFL0MsYUFBYSxFQUFFLFdBQVc7SUFDeEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO01BQy9ELElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5RDtBQUNMLEdBQUc7O0VBRUQsYUFBYSxFQUFFLFdBQVc7SUFDeEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUU7TUFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzlEO0FBQ0wsR0FBRzs7RUFFRCxRQUFRLEVBQUUsU0FBUyxTQUFTLEVBQUU7SUFDNUIsT0FBTyxZQUFZO01BQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztLQUMzQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNsQixHQUFHOztFQUVELFlBQVksRUFBRSxXQUFXO0lBQ3ZCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUM7SUFDdkUsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztJQUM1QyxLQUFLLElBQUksU0FBUyxJQUFJLE1BQU0sRUFBRTtNQUM1QixJQUFJLElBQUksU0FBUyxDQUFDO01BQ2xCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztNQUNoQyxLQUFLLElBQUksZUFBZSxJQUFJLE9BQU8sRUFBRTtRQUNuQyxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEVBQUU7VUFDbEMsSUFBSSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDeEM7T0FDRjtNQUNELElBQUksSUFBSSxHQUFHLENBQUM7S0FDYjtJQUNELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLEdBQUc7QUFDSDs7RUFFRSxNQUFNLEVBQUUsV0FBVztNQUNmLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSTtRQUN6RCxvQkFBQyxXQUFXLEVBQUEsQ0FBQSxDQUFDLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDO3FCQUNwQyxTQUFBLEVBQVMsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFDO3FCQUMzRCxtQkFBQSxFQUFtQixDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW9CLENBQUUsQ0FBQSxDQUFDLENBQUM7TUFDdkUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJO1NBQ3BDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsU0FBVSxDQUFBLEVBQUE7WUFDdEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFRLENBQU0sQ0FBQSxFQUFBO1lBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBUSxDQUFNLENBQUEsRUFBQTtZQUM3QixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLE9BQVEsQ0FBTSxDQUFBLEVBQUE7WUFDN0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFRLENBQU0sQ0FBQSxFQUFBO1lBQzdCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsT0FBUSxDQUFNLENBQUE7UUFDM0IsQ0FBQSxDQUFDO0FBQ2YsTUFBTTs7VUFFSSxvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLEVBQUEsRUFBRSxDQUFDLFVBQUEsRUFBVSxDQUFDLFNBQUEsRUFBUyxDQUFDLHVCQUF3QixDQUFBLEVBQUE7Y0FDaEQsTUFBTSxFQUFDO2NBQ1Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxZQUFhLENBQUEsRUFBQTtnQkFDMUIsb0JBQUMsVUFBVSxFQUFBLENBQUE7a0JBQ1QsS0FBQSxFQUFLLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFDO2tCQUNwQyxJQUFBLEVBQUksQ0FBRSxJQUFJLENBQUMsYUFBYSxFQUFDO2tCQUN6QixJQUFBLEVBQUksQ0FBRSxJQUFJLENBQUMsYUFBYSxFQUFDO2tCQUN6QixRQUFBLEVBQVEsQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFDO2tCQUN4QixhQUFBLEVBQWEsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWMsQ0FBRSxDQUFBLEVBQUE7a0JBQ3pDLHlEQUEwRDtnQkFDN0Qsb0JBQUEsR0FBRSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx5Q0FBQSxFQUF5QzttQkFDbkQscUJBQUEsRUFBbUIsQ0FBRSxJQUFJLENBQUMsWUFBWSxFQUFJLENBQUEsRUFBQTtrQkFDM0Msb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxVQUFXLENBQU8sQ0FBQTtnQkFDaEMsQ0FBQSxFQUFBO0FBQ3BCLGdCQUFnQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBTSxDQUFBO0FBQ2hEOztBQUVBLGNBQW9CLENBQUEsRUFBQTs7Y0FFTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFBLEVBQUE7Z0JBQ2pDLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsMkNBQTRDLENBQUEsRUFBQTtrQkFDekQsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtvQkFDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO3NCQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7d0JBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxrQkFBbUIsQ0FBQSxFQUFBOzBCQUMvQixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHlCQUFBLEVBQXlCLENBQUMsRUFBQSxFQUFFLENBQUMsc0JBQXVCLENBQUEsRUFBQTs0QkFDakUsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTs4QkFDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO2dDQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7a0NBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywwQkFBMkIsQ0FBSyxDQUFBLEVBQUE7a0NBQzlDLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUNBQXdDLENBQUEsRUFBQSxNQUFTLENBQUEsRUFBQTtrQ0FDL0Qsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1Q0FBd0MsQ0FBQSxFQUFBLE1BQVMsQ0FBQSxFQUFBO2tDQUMvRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHVDQUF3QyxDQUFBLEVBQUEsTUFBUyxDQUFBLEVBQUE7a0NBQy9ELG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsdUNBQXdDLENBQUEsRUFBQSxNQUFTLENBQUEsRUFBQTtrQ0FDL0Qsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyx1Q0FBd0MsQ0FBQSxFQUFBLE1BQVMsQ0FBQTtnQ0FDNUQsQ0FBQTs4QkFDQyxDQUFBOzRCQUNGLENBQUE7MEJBQ0osQ0FBQTt3QkFDSCxDQUFBO3NCQUNGLENBQUE7QUFDM0Isb0JBQTRCLENBQUEsRUFBQTs7b0JBRVIsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtzQkFDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3dCQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUEsRUFBQTtBQUMxRCwwQkFBMEIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxhQUFjLENBQUEsRUFBQTs7OEJBRXpCLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQXNCLENBQUEsRUFBQTtnQ0FDbkMsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtrQ0FDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7c0NBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxTQUFVLENBQUssQ0FBQSxFQUFBO3NDQUM3QixvQkFBQSxJQUFHLEVBQUEsSUFBTSxDQUFBLEVBQUE7c0NBQ1Qsb0JBQUEsSUFBRyxFQUFBLElBQU0sQ0FBQSxFQUFBO3NDQUNULG9CQUFBLElBQUcsRUFBQSxJQUFNLENBQUEsRUFBQTtzQ0FDVCxvQkFBQSxJQUFHLEVBQUEsSUFBTSxDQUFBLEVBQUE7c0NBQ1Qsb0JBQUEsSUFBRyxFQUFBLElBQU0sQ0FBQTtvQ0FDTixDQUFBO2tDQUNDLENBQUE7Z0NBQ0YsQ0FBQTs4QkFDSixDQUFBOzRCQUNGLENBQUEsRUFBQTswQkFDUixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG9DQUFBLEVBQW9DLENBQUMsRUFBQSxFQUFFLENBQUMsZ0JBQWlCLENBQUEsRUFBQTs0QkFDdEUsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxjQUFlLENBQUEsRUFBQTs4QkFDNUIsb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxPQUFRLENBQUEsRUFBQTtnQ0FDckIsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtrQ0FDTCxvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7c0NBQ0Ysb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQywyQkFBNEIsQ0FBSyxDQUFBLEVBQUE7c0NBQy9DLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQWtDLENBQUssQ0FBQSxFQUFBO3NDQUNyRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlDQUFrQyxDQUFLLENBQUEsRUFBQTtzQ0FDckQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxpQ0FBa0MsQ0FBSyxDQUFBLEVBQUE7c0NBQ3JELG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsaUNBQWtDLENBQUssQ0FBQSxFQUFBO3NDQUNyRCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGlDQUFrQyxDQUFLLENBQUE7b0NBQ2xELENBQUE7a0NBQ0MsQ0FBQTtnQ0FDRixDQUFBOzhCQUNKLENBQUEsRUFBQTs4QkFDTixvQkFBQSxLQUFJLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO2dDQUN4QixvQkFBQSxPQUFNLEVBQUEsSUFBQyxFQUFBO2tDQUNMLG9CQUFBLE9BQU0sRUFBQSxJQUFDLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxNQUFXLENBQUssQ0FBQSxFQUFBO3NDQUN4RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxNQUFXLENBQUssQ0FBQSxFQUFBO3NDQUN4RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxNQUFXLENBQUssQ0FBQSxFQUFBO3NDQUN4RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFD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QUksQ0FBQyxDQUFDO0FBQ3RCLEVBQUU7O0NBRUQsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVBY3Rpb25zKFxuICBbXCJnZXRDb3Vyc2VJbmZvXCJdXG4pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiY3JlYXRlVG9hc3RcIl1cbik7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1xuICBcInVwZGF0ZUNvdXJzZXNcIixcbiAgXCJ1cGRhdGVQcmVmZXJlbmNlc1wiLFxuICBcImdldFRpbWV0YWJsZUxpbmtcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIF1cbik7XG4iLCJ2YXIgUm9vdCA9IHJlcXVpcmUoJy4vcm9vdCcpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbmNvdXJzZXMgPSBbXTtcbl9TQ0hPT0wgPSBcImpodVwiO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFJvb3QgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKGRhdGEpIHtcblx0VGltZXRhYmxlQWN0aW9ucy5sb2FkUHJlc2V0VGltZXRhYmxlKGRhdGEpO1xufVxuIiwidmFyIFNlYXJjaEJhciA9IHJlcXVpcmUoJy4vc2VhcmNoX2JhcicpO1xudmFyIFByZWZlcmVuY2VNZW51ID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlX21lbnUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cImNvbnRyb2wtYmFyXCI+XG4gICAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxTZWFyY2hCYXIgdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8UHJlZmVyZW5jZU1lbnUgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgKTtcbiAgfSxcbn0pO1xuIiwidmFyIEV2YWx1YXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLnNlbGVjdGVkID8gXCJldmFsLWl0ZW0gc2VsZWN0ZWRcIiA6IFwiZXZhbC1pdGVtXCJcblx0XHR2YXIgZGV0YWlscyA9ICF0aGlzLnByb3BzLnNlbGVjdGVkID8gbnVsbCA6IChcblx0XHRcdDxkaXYgaWQ9XCJkZXRhaWxzXCI+e3RoaXMucHJvcHMuZXZhbF9kYXRhLnN1bW1hcnkucmVwbGFjZSgvXFx1MDBhMC9nLCBcIiBcIil9PC9kaXY+XG5cdFx0XHQpXG5cdFx0dmFyIHByb2YgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwicHJvZlwiPlByb2Zlc3Nvcjoge3RoaXMucHJvcHMuZXZhbF9kYXRhLnByb2Zlc3Nvcn08L2Rpdj5cblx0XHRcdClcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNlbGVjdGlvbkNhbGxiYWNrfSA+XG5cdFx0XHQ8ZGl2IGlkPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwieWVhclwiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS55ZWFyfTwvZGl2PlxuXHRcdFx0XHR7cHJvZn1cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gc3R5bGU9e3t3aWR0aDogMTAwKnRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlLzUgKyBcIiVcIn19IGNsYXNzTmFtZT1cInJhdGluZ1wiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm51bWVyaWMtcmF0aW5nXCI+e1wiKFwiICsgdGhpcy5wcm9wcy5ldmFsX2RhdGEuc2NvcmUgKyBcIilcIn08L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdHtkZXRhaWxzfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbmRleFNlbGVjdGVkOiBudWxsXG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhTZWxlY3RlZDtcblx0XHRcdHJldHVybiAoPEV2YWx1YXRpb24gZXZhbF9kYXRhPXtlfSBrZXk9e2UuaWR9IHNlbGVjdGlvbkNhbGxiYWNrPXt0aGlzLmNoYW5nZVNlbGVjdGVkKGkpfSBzZWxlY3RlZD17c2VsZWN0ZWR9IC8+KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBjbGlja19ub3RpY2UgPSB0aGlzLnByb3BzLmV2YWxfaW5mby5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyBjb3Vyc2UgZXZhbHVhdGlvbnMgZm9yIHRoaXMgY291cnNlIHlldDwvZGl2PikgOiAoPGRpdiBpZD1cImNsaWNrLWludHJvXCI+Q2xpY2sgYW4gZXZhbHVhdGlvbiBpdGVtIGFib3ZlIHRvIHJlYWQgdGhlIGNvbW1lbnRzPC9kaXY+KTtcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1ldmFsdWF0aW9uc1wiPlxuXHRcdFx0PGg2PkNvdXJzZSBFdmFsdWF0aW9uczo8L2g2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJldmFsLXdyYXBwZXJcIj5cblx0XHRcdFx0e2V2YWxzfVxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Y2xpY2tfbm90aWNlfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0Y2hhbmdlU2VsZWN0ZWQ6IGZ1bmN0aW9uKGVfaW5kZXgpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuc3RhdGUuaW5kZXhTZWxlY3RlZCA9PSBlX2luZGV4KSBcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7aW5kZXhTZWxlY3RlZDogbnVsbH0pO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleFNlbGVjdGVkOiBlX2luZGV4fSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBpZD1cImxvYWRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUtZ3JpZFwiPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUxXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTJcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlM1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU0XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTVcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNlwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU3XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZThcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlOVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcbn0pO1xuXG4iLCJ2YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbnZhciBjb3Vyc2VfaW5mb19zdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL2NvdXJzZV9pbmZvJyk7XG52YXIgRXZhbHVhdGlvbk1hbmFnZXIgPSByZXF1aXJlKCcuL2V2YWx1YXRpb25zLmpzeCcpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4JylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW1JlZmx1eC5jb25uZWN0KGNvdXJzZV9pbmZvX3N0b3JlKV0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbG9hZGVyID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gPExvYWRlciAvPiA6IG51bGw7XG5cdFx0dmFyIGhlYWRlciA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldEhlYWRlcigpXG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0RGVzY3JpcHRpb24oKVxuXHRcdHZhciBldmFsdWF0aW9ucyA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldEV2YWx1YXRpb25zKClcblx0XHR2YXIgcmVjb21lbmRhdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRSZWNvbWVuZGF0aW9ucygpXG5cdFx0dmFyIHRleHRib29rcyA9dGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0VGV4dGJvb2tzKClcblx0XHR2YXIgc2VjdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRTZWN0aW9ucygpXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgaWQ9XCJtb2RhbC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgICB7aGVhZGVyfVxuICAgICAgICAgICAgICAgIHtkZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICB7ZXZhbHVhdGlvbnN9XG4gICAgICAgICAgICAgICAge3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgIHt0ZXh0Ym9va3N9XG4gICAgICAgICAgICAgICAge3JlY29tZW5kYXRpb25zfVxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcblxuXHRnZXRIZWFkZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBoZWFkZXIgPSAoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cblx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtaW5mby13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgaWQ9XCJuYW1lXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8ubmFtZX08L2Rpdj5cblx0XHRcdFx0PGRpdiBpZD1cImNvZGVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlfTwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1wbHVzXCIgb25DbGljaz17dGhpcy5hZGRDb3Vyc2UoKX0vPlxuXHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gaGVhZGVyXG5cdH0sXG5cblx0YWRkQ291cnNlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy51cGRhdGVUaW1ldGFibGVzKHtpZDogdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiBmYWxzZX0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0b3BlblJlY29tZW5kYXRpb246IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRjb3Vyc2VfYWN0aW9ucy5nZXRDb3Vyc2VJbmZvKGNvdXJzZV9pZClcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cdGdldERlc2NyaXB0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZGVzY3JpcHRpb24gPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZGVzY3JpcHRpb25cIj5cblx0XHRcdFx0PGg2PkRlc2NyaXB0aW9uOjwvaDY+XG5cdFx0XHRcdHt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmRlc2NyaXB0aW9ufVxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiBkZXNjcmlwdGlvbjtcblx0fSxcblxuXHRnZXRFdmFsdWF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIDxFdmFsdWF0aW9uTWFuYWdlciBldmFsX2luZm89e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZXZhbF9pbmZvfSAvPlxuXHR9LFxuXG5cdGdldFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVsYXRlZCA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLnNsaWNlKDAsMykubWFwKGZ1bmN0aW9uKHJjKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgXHQ8ZGl2IGlkPVwicmVjb21lbmRhdGlvblwiIG9uQ2xpY2s9e3RoaXMub3BlblJlY29tZW5kYXRpb24ocmMuaWQpfSBrZXk9e3JjLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8ZGl2IGlkPVwiY2VudGVyLXdyYXBwZXJcIj5cblx0ICAgICAgICAgICAgXHRcdDxkaXYgaWQ9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGlkPVwibmFtZVwiPntyYy5uYW1lfTwvZGl2PlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGlkPVwiY29kZVwiPntyYy5jb2RlfTwvZGl2PlxuXHRcdCAgICAgICAgICAgIFx0PC9kaXY+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcdDwvZGl2PilcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgcmVjb21lbmRhdGlvbnMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnJlbGF0ZWRfY291cnNlcy5sZW5ndGggPT0gMCA/IG51bGwgOlxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIj5cblx0XHRcdFx0PGg2PkNvdXJzZXMgWW91IE1pZ2h0IExpa2U6PC9oNj5cblx0XHRcdFx0PGRpdiBpZD1cImNvdXJzZS1yZWNvbWVuZGF0aW9uc1wiPlxuXHRcdFx0XHRcdHtyZWxhdGVkfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gcmVjb21lbmRhdGlvbnNcblx0fSxcblxuXHRleHBhbmRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cblx0fSxcblxuXHRnZXRUZXh0Ym9va3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZXh0Ym9va19lbGVtZW50cyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rXCI+XG4gICAgICAgICAgICBcdFx0PGltZyBoZWlnaHQ9XCIxMjVcIiBzcmM9e3RiLmltYWdlX3VybH0vPlxuICAgICAgICAgICAgXHRcdDxoNj57dGIudGl0bGV9PC9oNj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2Pnt0Yi5hdXRob3J9PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGRpdj5JU0JOOnt0Yi5pc2JufTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxhIGhyZWY9e3RiLmRldGFpbF91cmx9IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgXHRcdFx0PGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgIFx0XHQ8L2E+XG4gICAgICAgICAgICBcdDwvZGl2PilcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyB0ZXh0Ym9va3MgeWV0IGZvciB0aGlzIGNvdXJzZTwvZGl2PikgOlxuXHRcdFx0XHQoPGRpdiBpZD1cInRleHRib29rc1wiPlxuXHQgICAgICAgICAgICBcdHt0ZXh0Ym9va19lbGVtZW50c31cblx0ICAgICAgICAgICAgPC9kaXY+KVxuXHRcdHZhciByZXQgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtdGV4dGJvb2tzXCI+XG5cdFx0XHRcdDxoNj5UZXh0Ym9va3M6PC9oNj5cblx0XHRcdFx0e3RleHRib29rc31cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gcmV0XG5cdH0sXG5cblx0Z2V0U2VjdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBGID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0Zfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1Nfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBzZWN0aW9ucyA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1zZWN0aW9uc1wiPlxuXHRcdFx0XHQ8aDY+Q291cnNlIFNlY3Rpb25zOjwvaDY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJhbGwtc2VjdGlvbnMtd3JhcHBlclwiPlxuXHRcdFx0XHRcdHtGfVxuXHRcdFx0XHRcdHtTfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gc2VjdGlvbnNcblx0fSxcblxuXG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtmaXJzdF9kaXNwbGF5ZWQ6IDB9O1xuICB9LFxuXG4gIGNoYW5nZVBhZ2U6IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIChmdW5jdGlvbihldmVudCkge1xuICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4LFxuICAgICAgICAgICBjb3VudCA9IHRoaXMucHJvcHMuY291bnQ7XG4gICAgICAgLy8gY2FsY3VsYXRlIHRoZSBuZXcgZmlyc3RfZGlzcGxheWVkIGJ1dHRvbiAodGltZXRhYmxlKVxuICAgICAgIHZhciBuZXdfZmlyc3QgPSBjdXJyZW50ICsgKDkqZGlyZWN0aW9uKSAtIChjdXJyZW50ICUgOSk7XG4gICAgICAgaWYgKG5ld19maXJzdCA+PSAwICYmIG5ld19maXJzdCA8IGNvdW50KSB7XG4gICAgICAgIHRoaXMucHJvcHMuc2V0SW5kZXgobmV3X2ZpcnN0KSgpO1xuICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBbXSwgY291bnQgPSB0aGlzLnByb3BzLmNvdW50LCBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4O1xuICAgIGlmIChjb3VudCA8PSAxKSB7IHJldHVybiBudWxsOyB9IC8vIGRvbid0IGRpc3BsYXkgaWYgdGhlcmUgYXJlbid0IGVub3VnaCBzY2hlZHVsZXNcbiAgICB2YXIgZmlyc3QgPSBjdXJyZW50IC0gKGN1cnJlbnQgJSA5KTsgLy8gcm91bmQgZG93biB0byBuZWFyZXN0IG11bHRpcGxlIG9mIDlcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIG9wdGlvbnMucHVzaChcbiAgICAgICAgPGxpIGtleT17aX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9PlxuICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT57aSArIDF9PC9hPlxuICAgICAgICA8L2xpPik7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uIHBhZ2luYXRpb24tbWluaW1hbFwiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnRcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXZpb3VzXCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1sZWZ0IHBhZ2luYXRpb24tYnRuXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAge29wdGlvbnN9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0XCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1yaWdodCBwYWdpbmF0aW9uLWJ0blwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm5leHQtZG91YmxlXCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKDEpfT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcbiAgXG5cbn0pOyIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgQmluYXJ5UHJlZmVyZW5jZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0b2dnbGVfbGFiZWwgPSBcImNtbi10b2dnbGUtXCIgKyB0aGlzLnByb3BzLnRvZ2dsZV9pZDtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICA8bGk+IHt0aGlzLnByb3BzLnRleHR9IDwvbGk+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdG9nZ2xlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2l0Y2hcIj5cbiAgICAgICAgICAgIDxpbnB1dCByZWY9XCJjaGVja2JveF9lbGVtXCIgaWQ9e3RvZ2dsZV9sYWJlbH0gXG4gICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY21uLXRvZ2dsZSBjbW4tdG9nZ2xlLXJvdW5kXCIgdHlwZT1cImNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy50b2dnbGVQcmVmZXJlbmNlfS8+XG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17dG9nZ2xlX2xhYmVsfT48L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlUHJlZmVyZW5jZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld192YWx1ZSA9IHRoaXMucmVmcy5jaGVja2JveF9lbGVtLmNoZWNrZWQ7XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVQcmVmZXJlbmNlcyh0aGlzLnByb3BzLm5hbWUsIG5ld192YWx1ZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgY3VycmVudF90b2dnbGVfaWQ6IDAsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cIm1lbnUtY29udGFpbmVyXCIgY2xhc3NOYW1lPVwiY29sbGFwc2VcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXZiYXItY29sbGFwc2VcIiA+XG4gICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXZiYXItbmF2XCIgaWQ9XCJtZW51XCI+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIDxhIGhyZWY9XCIjZmFrZWxpbmtcIj5QcmVmZXJlbmNlczwvYT5cbiAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBdm9pZCBlYXJseSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYmVmb3JlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGxhdGUgY2xhc3Nlc1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJub19jbGFzc2VzX2FmdGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkFsbG93IGNvbmZsaWN0c1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJ0cnlfd2l0aF9jb25mbGljdHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNmYWtlbGlua1wiPlByb2ZpbGU8L2E+PC9saT5cbiAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9maWxlLXRleHRcIj5cbiAgICAgICAgICAgICAgICA8bGk+RmF2b3JpdGVzPC9saT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2ZpbGUtdGV4dFwiPlxuICAgICAgICAgICAgICAgIDxsaT5GcmllbmRzPC9saT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByb2ZpbGUtdGV4dFwiPlxuICAgICAgICAgICAgICAgIDxsaT5TaWduIE91dDwvbGk+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTsiLCJ2YXIgQ29udHJvbEJhciA9IHJlcXVpcmUoJy4vY29udHJvbF9iYXInKTtcbnZhciBUaW1ldGFibGUgPSByZXF1aXJlKCcuL3RpbWV0YWJsZScpO1xudmFyIE1vZGFsQ29udGVudCA9IHJlcXVpcmUoJy4vbW9kYWxfY29udGVudCcpO1xudmFyIFRvYXN0U3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy90b2FzdF9zdG9yZS5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpLCBSZWZsdXguY29ubmVjdChUb2FzdFN0b3JlKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0Q291cnNlcygpO1xuXG4gICAgcmV0dXJuIHt9O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBNb2RhbCA9IEJvcm9uWydPdXRsaW5lTW9kYWwnXTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwicm9vdFwiPlxuICAgICAgICA8ZGl2IGlkPVwidG9hc3QtY29udGFpbmVyXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJzZW1lc3Rlcmx5LW5hbWVcIj5TZW1lc3Rlci5seTwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiY29udHJvbC1iYXItY29udGFpbmVyXCI+XG4gICAgICAgICAgPENvbnRyb2xCYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IC8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJhbGwtY29scy1jb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwic2lkZS1jb250YWluZXJcIj5TaWRlIGRpdjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBpZD1cImNhbC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgPFRpbWV0YWJsZSB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlTW9kYWw6IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS50b2dnbGUoKTtcbiAgICAgICAgY291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyhjb3Vyc2VfaWQpO1xuICAgIH0uYmluZCh0aGlzKTsgXG4gIH0sXG5cbiAgZ2V0Q291cnNlczogZnVuY3Rpb24oKSB7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIiArIF9TQ0hPT0wgKyBcIi9cIiArIF9TRU1FU1RFUiwgXG4gICAgICAgIHt9LCBcbiAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb3Vyc2VzID0gcmVzcG9uc2U7XG4gICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0sXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBTZWFyY2hSZXN1bHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpX2NsYXNzID0gXCJzZWFyY2gtcmVzdWx0XCIsIGljb25fY2xhc3MgPSBcImZ1aS1wbHVzXCI7XG4gICAgaWYgKHRoaXMucHJvcHMuaW5fcm9zdGVyKSB7XG4gICAgICBsaV9jbGFzcyArPSBcIiB0b2RvLWRvbmVcIjtcbiAgICAgIGljb25fY2xhc3MgPSBcImZ1aS1jaGVja1wiO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGxpIGNsYXNzTmFtZT17bGlfY2xhc3N9IG9uTW91c2VEb3duPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuaWQpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvLWNvbnRlbnRcIj5cbiAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidG9kby1uYW1lXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb2RlfVxuICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17XCJzZWFyY2gtcmVzdWx0LWFjdGlvbiBcIiArIGljb25fY2xhc3N9IFxuICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLnRvZ2dsZUNvdXJzZX0+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVtb3ZpbmcgPSB0aGlzLnByb3BzLmluX3Jvc3RlcjtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgLy8gc3RvcCBpbnB1dCBmcm9tIHRyaWdnZXJpbmcgb25CbHVyIGFuZCB0aHVzIGhpZGluZyByZXN1bHRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gc3RvcCBwYXJlbnQgZnJvbSBvcGVuaW5nIG1vZGFsXG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN1bHRzOiBbXSxcbiAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHNfZGl2ID0gdGhpcy5nZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50KCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5wdXQtY29tYmluZVwiPlxuICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSBjb2RlLCB0aXRsZSwgZGVzY3JpcHRpb24sIHByb2Zlc3NvciwgZGVncmVlXCIgXG4gICAgICAgICAgICBpZD1cInNlYXJjaC1pbnB1dFwiIFxuICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMuZm9jdXN9IG9uQmx1cj17dGhpcy5ibHVyfSBcbiAgICAgICAgICAgIG9uSW5wdXQ9e3RoaXMucXVlcnlDaGFuZ2VkfS8+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1iYXJzIGZhLTJ4XCI+PC9pPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c19kaXZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZm9jdXNlZCB8fCB0aGlzLnN0YXRlLnJlc3VsdHMubGVuZ3RoID09IDApIHtyZXR1cm4gbnVsbDt9XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzZWFyY2hfcmVzdWx0cyA9IHRoaXMuc3RhdGUucmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgaSsrO1xuICAgICAgdmFyIGluX3Jvc3RlciA9IHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tyLmlkXSAhPSBudWxsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlYXJjaFJlc3VsdCB7Li4ucn0ga2V5PXtpfSBpbl9yb3N0ZXI9e2luX3Jvc3Rlcn0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9Lz5cbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8gbXJtXCI+XG4gICAgICAgICAgICA8dWwgaWQ9XCJzZWFyY2gtcmVzdWx0c1wiPlxuICAgICAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHN9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogdHJ1ZX0pO1xuICB9LFxuXG4gIGJsdXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IGZhbHNlfSk7XG4gIH0sXG5cbiAgcXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBxdWVyeSA9IGV2ZW50LnRhcmdldC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBmaWx0ZXJlZCA9IHF1ZXJ5Lmxlbmd0aCA8PSAxID8gW10gOiB0aGlzLmZpbHRlckNvdXJzZXMocXVlcnkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHM6IGZpbHRlcmVkfSk7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgcmVzdWx0cyA9IGNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAoYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG52YXIgY29sb3VyX3RvX2hpZ2hsaWdodCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuXG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIGRheV90b19sZXR0ZXIgPSB7XG4gICAgJ00nOiAgJ00nLCBcbiAgICAnVCc6ICAnVCcsIFxuICAgICdXJzogICdXJyxcbiAgICAnUic6ICdUaCcsXG4gICAgJ0YnOiAgJ0YnLFxuICAgICdTJzogJ1NhJyxcbiAgICAnVSc6ICdTJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29zID0gdGhpcy5nZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzKClcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3QgPSA8ZGl2IGlkPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj5cbiAgICAgICAgdmFyIHByb2YgPSA8ZGl2IGlkPVwicHJvZnNcIj57Y29zWzBdLmluc3RydWN0b3JzfTwvZGl2PlxuICAgICAgICB2YXIgc2VjdF9wcm9mID0gPGRpdiBpZD1cInNlY3QtcHJvZlwiPntzZWN0fXtwcm9mfTwvZGl2PlxuICAgICAgICByZXR1cm4gPGRpdiBpZD1cInNlY3Rpb24td3JhcHBlclwiPntzZWN0X3Byb2Z9e2RheUFuZFRpbWVzfTwvZGl2PlxuICAgIH0sXG5cbiAgICBnZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29fb2JqZWN0cyA9IFtdXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcm9wcy5hbGxfc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5wcm9wcy5hbGxfc2VjdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAoby5tZWV0aW5nX3NlY3Rpb24gPT0gdGhpcy5wcm9wcy5zZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29fb2JqZWN0cy5wdXNoKG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb19vYmplY3RzO1xuICAgIH0sXG5cbiAgICBnZXREYXlzQW5kVGltZXM6IGZ1bmN0aW9uKGNvcykge1xuICAgICAgICB2YXIgZGF5QW5kVGltZXMgPSBjb3MubWFwKGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgICAgIHJldHVybiAoPGRpdiBpZD1cImRheS10aW1lXCI+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBpZD1cImR0LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIHtkYXlBbmRUaW1lc31cbiAgICAgICAgICAgIDwvZGl2PiApXG4gICAgfVxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG4vLyBtYXBzIGJhc2UgY29sb3VyIG9mIHNsb3QgdG8gY29sb3VyIG9uIGhpZ2hsaWdodFxudmFyIGNvbG91cl90b19oaWdobGlnaHQgPSB7XG4gICAgXCIjRkQ3NDczXCIgOiBcIiNFMjZBNkFcIixcbiAgICBcIiM0NEJCRkZcIiA6IFwiIzI4QTRFQVwiLFxuICAgIFwiIzRDRDRCMFwiIDogXCIjM0RCQjlBXCIsXG4gICAgXCIjODg3MEZGXCIgOiBcIiM3MDU5RTZcIixcbiAgICBcIiNGOUFFNzRcIiA6IFwiI0Y3OTU0QVwiLFxuICAgIFwiI0Q0REJDOFwiIDogXCIjQjVCRkEzXCIsXG4gICAgXCIjRTdGNzZEXCIgOiBcIiNDNEQ0NERcIixcbiAgICBcIiNGMTgyQjRcIiA6IFwiI0RFNjk5RFwiLFxuICAgIFwiIzc0OTlBMlwiIDogXCIjNjY4Qjk0XCIsXG59IC8vIGNvbnNpZGVyICNDRjAwMEYsICNlOGZhYzNcblxuLy8gaG93IGJpZyBhIHNsb3Qgb2YgaGFsZiBhbiBob3VyIHdvdWxkIGJlLCBpbiBwaXhlbHNcbnZhciBIQUxGX0hPVVJfSEVJR0hUID0gMzA7XG5cbnZhciBTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7c2hvd19idXR0b25zOiBmYWxzZX07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwaW4gPSBudWxsLCByZW1vdmVfYnV0dG9uID0gbnVsbDtcbiAgICAgICAgdmFyIHNsb3Rfc3R5bGUgPSB0aGlzLmdldFNsb3RTdHlsZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dfYnV0dG9ucykge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMudW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5jb3Vyc2UpfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9e1wic2xvdC1vdXRlciBmYy10aW1lLWdyaWQtZXZlbnQgZmMtZXZlbnQgc2xvdCBzbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2V9IFxuICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBzdHlsZSBvZiBhIHNwZWNpZmljIHNsb3QuIFNob3VsZCBzcGVjaWZ5IGF0XG4gICAgKiBsZWFzdCB0aGUgdG9wIHktY29vcmRpbmF0ZSBhbmQgaGVpZ2h0IG9mIHRoZSBzbG90LCBhcyB3ZWxsIGFzIGJhY2tncm91bmRDb2xvclxuICAgICogd2hpbGUgdGFraW5nIGludG8gYWNjb3VudCBpZiB0aGVyZSdzIGFuIG92ZXJsYXBwaW5nIGNvbmZsaWN0XG4gICAgKi9cbiAgICBnZXRTbG90U3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhcnRfaG91ciAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBzdGFydF9taW51dGUgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzFdKSxcbiAgICAgICAgICAgIGVuZF9ob3VyICAgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIGVuZF9taW51dGUgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzFdKTtcblxuICAgICAgICB2YXIgdG9wID0gKHN0YXJ0X2hvdXIgLSA4KSo1MiArIChzdGFydF9taW51dGUpKigyNi8zMCk7XG4gICAgICAgIHZhciBib3R0b20gPSAoZW5kX2hvdXIgLSA4KSo1MiArIChlbmRfbWludXRlKSooMjYvMzApIC0gMTtcbiAgICAgICAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcCAtIDI7XG5cbiAgICAgICAgLy8gdGhlIGN1bXVsYXRpdmUgd2lkdGggb2YgdGhpcyBzbG90IGFuZCBhbGwgb2YgdGhlIHNsb3RzIGl0IGlzIGNvbmZsaWN0aW5nIHdpdGhcbiAgICAgICAgdmFyIHRvdGFsX3Nsb3Rfd2lkdGhzID0gOTggLSAoNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWwpO1xuICAgICAgICAvLyB0aGUgd2lkdGggb2YgdGhpcyBwYXJ0aWN1bGFyIHNsb3RcbiAgICAgICAgdmFyIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSA9IHRvdGFsX3Nsb3Rfd2lkdGhzIC8gdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzO1xuICAgICAgICAvLyB0aGUgYW1vdW50IG9mIGxlZnQgbWFyZ2luIG9mIHRoaXMgcGFydGljdWxhciBzbG90LCBpbiBwZXJjZW50YWdlXG4gICAgICAgIHZhciBwdXNoX2xlZnQgPSAodGhpcy5wcm9wcy5zaGlmdF9pbmRleCAqIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSkgKyA1ICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKGNvbG91cl90b19oaWdobGlnaHRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb24sIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICB1bnBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogdHJ1ZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAgICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2UpXG4gICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gW1wiTVwiLCBcIlRcIiwgXCJXXCIsIFwiUlwiLCBcIkZcIl07XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB0aGlzLmdldFNsb3RzQnlEYXkoKTtcbiAgICAgICAgdmFyIGFsbF9zbG90cyA9IGRheXMubWFwKGZ1bmN0aW9uKGRheSkge1xuICAgICAgICAgICAgdmFyIGRheV9zbG90cyA9IHNsb3RzX2J5X2RheVtkYXldLm1hcChmdW5jdGlvbihzbG90KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmlzUGlubmVkKHNsb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2xvdCB7Li4uc2xvdH0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IGtleT17c2xvdC5pZH0gcGlubmVkPXtwfS8+XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17ZGF5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZXZlbnQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheV9zbG90c31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgIHthbGxfc2xvdHN9XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IHsxOiAnbW9uJywgMjogJ3R1ZScsIDM6ICd3ZWQnLCA0OiAndGh1JywgNTogJ2ZyaSd9O1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IFwiLmZjLVwiICsgZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgLy8gJChzZWxlY3RvcikuYWRkQ2xhc3MoXCJmYy10b2RheVwiKTtcbiAgICB9LFxuXG4gICAgaXNQaW5uZWQ6IGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgdmFyIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdWydDJ107XG4gICAgICAgIGlmIChfU0NIT09MID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVtzbG90Lm1lZXRpbmdfc2VjdGlvblswXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IgPT0gc2xvdC5tZWV0aW5nX3NlY3Rpb247XG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgY291cnNlIGluIHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXMpIHtcbiAgICAgICAgICAgIHZhciBjcnMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzW2NvdXJzZV07XG4gICAgICAgICAgICBmb3IgKHZhciBzbG90X2lkIGluIGNycy5zbG90cykge1xuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gY3JzLnNsb3RzW3Nsb3RfaWRdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2xvdXJcIl0gPSBPYmplY3Qua2V5cyhjb2xvdXJfdG9faGlnaGxpZ2h0KVtjb3Vyc2VdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2RlXCJdID0gY3JzLmNvZGUudHJpbSgpO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJuYW1lXCJdID0gY3JzLm5hbWU7XG4gICAgICAgICAgICAgICAgc2xvdHNfYnlfZGF5W3Nsb3QuZGF5XS5wdXNoKHNsb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbG90c19ieV9kYXk7XG4gICAgfSxcblxufSk7XG4iLCJ2YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtjb3Vyc2VfYWN0aW9uc10sXG5cbiAgZ2V0Q291cnNlSW5mbzogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgX1NDSE9PTCArIFwiL2lkL1wiICsgY291cnNlX2lkLCBcbiAgICAgICAgIHt9LCBcbiAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IGZhbHNlLCBjb3Vyc2VfaW5mbzogcmVzcG9uc2V9KTtcbiAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG5cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y291cnNlX2luZm86IG51bGwsIGxvYWRpbmc6IHRydWV9O1xuICB9XG59KTtcbiIsInZhciBUb2FzdCA9IHJlcXVpcmUoJy4uL3RvYXN0Jyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtUb2FzdEFjdGlvbnNdLFxuXG4gIGNyZWF0ZVRvYXN0OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC1jb250YWluZXInKTtcbiAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPFRvYXN0IGNvbnRlbnQ9e2NvbnRlbnR9IC8+LFxuICAgICAgY29udGFpbmVyXG4gICAgKTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xuXG5cbnZhciB0dF9zdGF0ZSA9IHtcbiAgc2Nob29sOiBcImpodVwiLFxuICBzZW1lc3RlcjogXCJTXCIsXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBwcmVmZXJlbmNlczoge1xuICAgICdub19jbGFzc2VzX2JlZm9yZSc6IGZhbHNlLFxuICAgICdub19jbGFzc2VzX2FmdGVyJzogZmFsc2UsXG4gICAgJ2xvbmdfd2Vla2VuZCc6IGZhbHNlLFxuICAgICdncm91cGVkJzogZmFsc2UsXG4gICAgJ2RvX3JhbmtpbmcnOiBmYWxzZSxcbiAgICAndHJ5X3dpdGhfY29uZmxpY3RzJzogZmFsc2VcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuXG4gLyoqXG4gICogVXBkYXRlIHR0X3N0YXRlIHdpdGggbmV3IGNvdXJzZSByb3N0ZXJcbiAgKiBAcGFyYW0ge29iamVjdH0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24gY29udGFpbnMgYXR0cmlidXRlZCBpZCwgc2VjdGlvbiwgcmVtb3ZpbmdcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyB0dF9zdGF0ZVxuICAqL1xuICB1cGRhdGVDb3Vyc2VzOiBmdW5jdGlvbihuZXdfY291cnNlX3dpdGhfc2VjdGlvbikge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzp0cnVlfSk7XG5cbiAgICB2YXIgcmVtb3ZpbmcgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5yZW1vdmluZztcbiAgICB2YXIgbmV3X2NvdXJzZV9pZCA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLmlkO1xuICAgIHZhciBzZWN0aW9uID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uc2VjdGlvbjtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIHR0X3N0YXRlKTsgLy8gZGVlcCBjb3B5IG9mIHR0X3N0YXRlXG4gICAgdmFyIGNfdG9fcyA9IG5ld19zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zO1xuICAgIFxuICAgIGlmICghcmVtb3ZpbmcpIHsgLy8gYWRkaW5nIGNvdXJzZVxuICAgICAgaWYgKHR0X3N0YXRlLnNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb259O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHRfc3RhdGUuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgIHZhciBsb2NrZWRfc2VjdGlvbnMgPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiAnJ30gLy8gdGhpcyBpcyB3aGF0IHdlIHdhbnQgdG8gc2VuZCBpZiBub3QgbG9ja2luZ1xuICAgICAgICBpZiAoc2VjdGlvbikgeyAvLyBsb2NraW5nXG4gICAgICAgICAgaWYgKGNfdG9fc1tuZXdfY291cnNlX2lkXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBsb2NrZWRfc2VjdGlvbnMgPSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07IC8vIGNvcHkgdGhlIG9sZCBtYXBwaW5nXG4gICAgICAgICAgICAvLyBpbiBjYXNlIHNvbWUgc2VjdGlvbnMgd2VyZSBhbHJlYWR5IGxvY2tlZCBmb3IgdGhpcyBjb3Vyc2UsXG4gICAgICAgICAgICAvLyBhbmQgbm93IHdlJ3JlIGFib3V0IHRvIGxvY2sgYSBuZXcgb25lLlxuICAgICAgICAgIH1cbiAgICAgICAgICBsb2NrZWRfc2VjdGlvbnNbc2VjdGlvblswXV0gPSBzZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IGxvY2tlZF9zZWN0aW9ucztcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7IC8vIHJlbW92aW5nIGNvdXJzZVxuICAgICAgZGVsZXRlIGNfdG9fc1tuZXdfY291cnNlX2lkXTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhjX3RvX3MpLmxlbmd0aCA9PSAwKSB7IC8vIHJlbW92ZWQgbGFzdCBjb3Vyc2VcbiAgICAgICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCkpO1xuICAgICAgICAgIHJldHVybjsgIFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAvKipcbiAgKiBVcGRhdGUgdHRfc3RhdGUgd2l0aCBuZXcgcHJlZmVyZW5jZXNcbiAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZmVyZW5jZTogdGhlIHByZWZlcmVuY2UgdGhhdCBpcyBiZWluZyB1cGRhdGVkXG4gICogQHBhcmFtIG5ld192YWx1ZTogdGhlIG5ldyB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHByZWZlcmVuY2VcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2Vzbid0IHJldHVybiBhbnl0aGluZywganVzdCB1cGRhdGVzIHR0X3N0YXRlXG4gICovXG4gIHVwZGF0ZVByZWZlcmVuY2VzOiBmdW5jdGlvbihwcmVmZXJlbmNlLCBuZXdfdmFsdWUpIHtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIHR0X3N0YXRlKTsgLy8gZGVlcCBjb3B5IG9mIHR0X3N0YXRlXG4gICAgbmV3X3N0YXRlLnByZWZlcmVuY2VzW3ByZWZlcmVuY2VdID0gbmV3X3ZhbHVlO1xuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuICAvLyBNYWtlcyBhIFBPU1QgcmVxdWVzdCB0byB0aGUgYmFja2VuZCB3aXRoIHR0X3N0YXRlXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbihuZXdfc3RhdGUpIHtcbiAgICAkLnBvc3QoJy90aW1ldGFibGUvJywgSlNPTi5zdHJpbmdpZnkobmV3X3N0YXRlKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0dF9zdGF0ZSA9IG5ld19zdGF0ZTsgLy9vbmx5IHVwZGF0ZSBzdGF0ZSBpZiBzdWNjZXNzZnVsXG4gICAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgICBpZiAobmV3X3N0YXRlLmluZGV4KSB7XG4gICAgICAgICAgICBpbmRleCA9IG5ld19zdGF0ZS5pbmRleDtcbiAgICAgICAgICAgIGRlbGV0ZSBuZXdfc3RhdGVbJ2luZGV4J107XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICAgIHRpbWV0YWJsZXM6IHJlc3BvbnNlLFxuICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zLFxuICAgICAgICAgICAgICBjdXJyZW50X2luZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zICE9IHt9KSB7IC8vIGNvbmZsaWN0XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmxpY3RfZXJyb3I6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJUaGF0IGNvdXJzZSBjYXVzZWQgYSBjb25mbGljdCEgVHJ5IGFnYWluIHdpdGggdGhlIEFsbG93IENvbmZsaWN0cyBwcmVmZXJlbmNlIHR1cm5lZCBvbi5cIik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG5cbiAgbG9hZFByZXNldFRpbWV0YWJsZTogZnVuY3Rpb24odXJsX2RhdGEpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWV9KTtcbiAgICB2YXIgY291cnNlcyA9IHVybF9kYXRhLnNwbGl0KFwiJlwiKTtcbiAgICB0dF9zdGF0ZS5pbmRleCA9IHBhcnNlSW50KGNvdXJzZXMuc2hpZnQoKSk7XG4gICAgdmFyIHNjaG9vbCA9IHR0X3N0YXRlLnNjaG9vbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdXJzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjID0gcGFyc2VJbnQoY291cnNlc1tpXSk7XG4gICAgICB2YXIgY291cnNlX2luZm8gPSBjb3Vyc2VzW2ldLnNwbGl0KFwiK1wiKTtcbiAgICAgIGNvdXJzZV9pbmZvLnNoaWZ0KCk7IC8vIHJlbW92ZXMgZmlyc3QgZWxlbWVudFxuICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tjXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfTtcbiAgICAgIGlmIChjb3Vyc2VfaW5mby5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY291cnNlX2luZm8ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgc2VjdGlvbiA9IGNvdXJzZV9pbmZvW2pdO1xuICAgICAgICAgIGlmIChzY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbY11bc2VjdGlvblswXV0gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tjXVsnQyddID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlUmVxdWVzdCh0dF9zdGF0ZSk7XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGltZXRhYmxlczogW10sIFxuICAgICAgY291cnNlc190b19zZWN0aW9uczoge30sIFxuICAgICAgY3VycmVudF9pbmRleDogLTEsIFxuICAgICAgY29uZmxpY3RfZXJyb3I6IGZhbHNlLFxuICAgICAgbG9hZGluZzogZmFsc2V9O1xuICB9XG59KTtcbiIsInZhciBTbG90TWFuYWdlciA9IHJlcXVpcmUoJy4vc2xvdF9tYW5hZ2VyJyk7XG52YXIgUGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vcGFnaW5hdGlvbicpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy90b2FzdF9hY3Rpb25zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBuZXh0VGltZXRhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ICsgMSA8IHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2N1cnJlbnRfaW5kZXg6IHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCArIDF9KTtcbiAgICB9XG4gIH0sXG5cbiAgcHJldlRpbWV0YWJsZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCA+IDApIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2N1cnJlbnRfaW5kZXg6IHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCAtIDF9KTtcbiAgICB9ICAgIFxuICB9LFxuXG4gIHNldEluZGV4OiBmdW5jdGlvbihuZXdfaW5kZXgpIHtcbiAgICByZXR1cm4oZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogbmV3X2luZGV4fSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRTaGFyZUxpbms6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIiArIHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCArIFwiJlwiO1xuICAgIHZhciBjX3RvX3MgPSB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG4gICAgZm9yICh2YXIgY291cnNlX2lkIGluIGNfdG9fcykge1xuICAgICAgbGluayArPSBjb3Vyc2VfaWQ7XG4gICAgICB2YXIgbWFwcGluZyA9IGNfdG9fc1tjb3Vyc2VfaWRdO1xuICAgICAgZm9yICh2YXIgc2VjdGlvbl9oZWFkaW5nIGluIG1hcHBpbmcpIHsgLy8gaS5lICdMJywgJ1QnLCAnUCcsICdTJ1xuICAgICAgICBpZiAobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddICE9IFwiXCIpIHtcbiAgICAgICAgICBsaW5rICs9IFwiK1wiICsgbWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddOyAvLyBkZWxpbWl0ZXIgZm9yIHNlY3Rpb25zIGxvY2tlZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaW5rICs9IFwiJlwiOyAvLyBkZWxpbWl0ZXIgZm9yIGNvdXJzZXNcbiAgICB9XG4gICAgbGluayA9IGxpbmsuc2xpY2UoMCwgLTEpO1xuICAgIHJldHVybiBsaW5rO1xuICB9LFxuXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzbG90X21hbmFnZXIgPSB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID09IDAgPyBudWxsIDpcbiAgICAgICAoPFNsb3RNYW5hZ2VyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBcbiAgICAgICAgICAgICAgICAgICAgIHRpbWV0YWJsZT17dGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF19XG4gICAgICAgICAgICAgICAgICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnN9Lz4pO1xuICAgICAgdmFyIGxvYWRlciA9ICF0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDpcbiAgICAgICggIDxkaXYgY2xhc3NOYW1lPVwic3Bpbm5lclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWN0MVwiPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWN0MlwiPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWN0M1wiPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWN0NFwiPjwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWN0NVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj4pXG4gICAgICByZXR1cm4gKFxuXG4gICAgICAgICAgPGRpdiBpZD1cImNhbGVuZGFyXCIgY2xhc3NOYW1lPVwiZmMgZmMtbHRyIGZjLXVudGhlbWVkXCI+XG4gICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdG9vbGJhclwiPlxuICAgICAgICAgICAgICAgIDxQYWdpbmF0aW9uIFxuICAgICAgICAgICAgICAgICAgY291bnQ9e3RoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGh9IFxuICAgICAgICAgICAgICAgICAgbmV4dD17dGhpcy5uZXh0VGltZXRhYmxlfSBcbiAgICAgICAgICAgICAgICAgIHByZXY9e3RoaXMucHJldlRpbWV0YWJsZX1cbiAgICAgICAgICAgICAgICAgIHNldEluZGV4PXt0aGlzLnNldEluZGV4fVxuICAgICAgICAgICAgICAgICAgY3VycmVudF9pbmRleD17dGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4fS8+XG4gICAgICAgICAgICAgICAgICB7Lyo8aDIgY2xhc3NOYW1lPVwibGlnaHQgc2VtZXN0ZXItZGlzcGxheVwiPkZhbGwgMjAxNjwvaDI+Ki99XG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IHJpZ2h0IGNhbGVuZGFyLWZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICBkYXRhLWNsaXBib2FyZC10ZXh0PXt0aGlzLmdldFNoYXJlTGluaygpfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZ1aS1jbGlwXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNsZWFyXCI+PC9kaXY+XG5cblxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXZpZXctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3IGZjLWFnZW5kYVdlZWstdmlldyBmYy1hZ2VuZGEtdmlld1wiPlxuICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1yb3cgZmMtd2lkZ2V0LWhlYWRlclwiIGlkPVwiY3VzdG9tLXdpZGdldC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtaGVhZGVyXCI+PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLW1vblwiPk1vbiA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtdHVlXCI+VHVlIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy13ZWRcIj5XZWQgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXRodVwiPlRodSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtZnJpXCI+RnJpIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1kYXktZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZS1ncmlkLWNvbnRhaW5lciBmYy1zY3JvbGxlclwiIGlkPVwiY2FsZW5kYXItaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1iZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtbW9uXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy10dWVcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXdlZFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdGh1XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy1mcmlcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXNsYXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj44YW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OWFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjEwYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTFhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjFwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4ycG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+M3BtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjRwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj41cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjdwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj44cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjEwcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTFwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGhyIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIiBpZD1cIndpZGdldC1oclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnQtc2tlbGV0b25cIiBpZD1cInNsb3QtbWFuYWdlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2xvdF9tYW5hZ2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbGlwID0gbmV3IENsaXBib2FyZCgnLmNhbGVuZGFyLWZ1bmN0aW9uJyk7XG4gICAgY2xpcC5vbignc3VjY2VzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIkxpbmsgY29waWVkIHRvIGNsaXBib2FyZCFcIik7XG4gICAgfSk7XG4gIH0sXG5cblxuXG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt2aXNpYmxlOiB0cnVlfTtcblx0fSxcdFx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRvYXN0ID0gdGhpcy5zdGF0ZS52aXNpYmxlID8gXG5cdFx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdC13cmFwcGVyIHRvYXN0aW5nXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3RcIj57dGhpcy5wcm9wcy5jb250ZW50fTwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj4pIDogbnVsbDtcblx0XHRyZXR1cm4gdG9hc3Q7XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuX3JlYWN0SW50ZXJuYWxJbnN0YW5jZSkgeyAvLyBpZiBtb3VudGVkIHN0aWxsXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3Zpc2libGU6IGZhbHNlfSk7XG5cdFx0XHR9XG5cdFx0fS5iaW5kKHRoaXMpLCAzMDAwKTtcblx0fSxcblxufSk7Il19
