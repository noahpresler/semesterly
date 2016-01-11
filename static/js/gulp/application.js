(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  [
  "updateCourses",
  "updatePreferences",
  "getTimetableLink",
  "loadPresetTimetable",
  ]
);

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
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
if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
    data = localStorage.getItem('data');
} 
if (data) {
	TimetableActions.loadPresetTimetable(data);
}

},{"./actions/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/home/linoah/Documents/semesterly/static/js/new_timetable/root.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
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
			index_selected: null
		};
	},

	render: function() {
		var i = 0;
		var evals = this.props.eval_info.map(function(e) {
			i++;
			var selected = i == this.state.index_selected;
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
			if (this.state.index_selected == e_index) 
				this.setState({index_selected: null});
			else
				this.setState({index_selected: e_index});
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
var CourseInfoStore = require('./stores/course_info');
var EvaluationManager = require('./evaluations.jsx');
var TimetableActions = require('./actions/update_timetables.js');
var CourseActions = require('./actions/course_actions');
var SectionSlot = require('./section_slot.jsx')

module.exports = React.createClass({displayName: "exports",
	mixins: [Reflux.connect(CourseInfoStore)],

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
			TimetableActions.updateCourses({id: this.state.course_info.id, section: '', removing: false});
		}.bind(this));
	},

	openRecomendation: function(course_id) {
		return (function() {
			CourseActions.getCourseInfo(course_id)
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
            	React.createElement("div", {className: "recommendation", onClick: this.openRecomendation(rc.id), key: rc.id}, 
            		React.createElement("div", {className: "center-wrapper"}, 
	            		React.createElement("div", {className: "rec-wrapper"}, 
		            		React.createElement("div", {className: "name"}, rc.name), 
		            		React.createElement("div", {className: "code"}, rc.code)
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
            	React.createElement("div", {className: "textbook", key: tb.id}, 
            		React.createElement("img", {height: "125", src: tb.image_url}), 
            		React.createElement("h6", null, tb.title), 
            		React.createElement("div", null, tb.author), 
            		React.createElement("div", null, "ISBN:", tb.isbn), 
            		React.createElement("a", {href: tb.detail_url, target: "_blank"}, 
            			React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
            		)
            	));
        }.bind(this));
		var textbooks = this.state.course_info.textbook_info[0].textbooks.length == 0 ? (React.createElement("div", {id: "empty-intro"}, "No textbooks yet for this course")) :
				(React.createElement("div", {id: "textbooks"}, 
	            	textbook_elements
	            ));
		var ret = 
			(React.createElement("div", {className: "modal-entry", id: "course-textbooks"}, 
				React.createElement("h6", null, "Textbooks:"), 
				textbooks
			));
		return ret;
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

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/home/linoah/Documents/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/course_info.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
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
        		React.createElement("li", {key: i, className: "sem-page " + className, onClick: this.props.setIndex(i)}, 
             		 i + 1
       			));
  		}
		return (
			React.createElement("div", {className: "sem-pagination"}, 
				React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-prev", onClick: this.changePage(-1)}, 
					React.createElement("i", {className: "fa fa-angle-double-left sem-pagination-prev sem-pagination-icon"})
				), 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.prev}, 
					React.createElement("i", {className: "fa fa-angle-left sem-pagination-prev sem-pagination-icon"})
				), 
				React.createElement("ol", {className: "sem-pages"}, 
					options
				), 
				React.createElement("div", {className: "sem-pagination-nav", onClick: this.props.next}, 
					React.createElement("i", {className: "fa fa-angle-right sem-pagination-next sem-pagination-icon"})
				), 
				React.createElement("div", {className: "sem-pagination-nav nav-double nav-double-next", onClick: this.changePage(1)}, 
					React.createElement("i", {className: "fa fa-angle-double-right sem-pagination-next sem-pagination-icon"})
				)
			)
		);
	},
});

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');
var Sidebar = require('./side_bar.jsx');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],
  sidebar_collapsed: true,

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
        React.createElement("div", {id: "navicon", onClick: this.toggleSideModal}, React.createElement("span", null), React.createElement("span", null), React.createElement("span", null)), 
        React.createElement("div", {id: "modal-container"}, 
          React.createElement(Modal, {ref: "OutlineModal", className: "course-modal"}, 
              React.createElement(ModalContent, null)
          )
        ), 
        React.createElement("div", {className: "all-cols-container"}, 
          React.createElement(Sidebar, {toggleModal: this.toggleCourseModal}), 
          React.createElement("div", {className: "cal-container"}, 
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

  toggleSideModal: function(){
    if (this.sidebar_collapsed) {
      this.expandSideModal();
      this.sidebar_collapsed = false;
    } else {
      this.collapseSideModal();
      this.sidebar_collapsed = true;
    }
  },

  expandSideModal: function() {
    $('.cal-container').removeClass('squeeze-out full-cal');
    $('.side-container').removeClass('slide-out side-collapsed');
    $('.side-container').addClass('slide-in side-deployed');
    $('.cal-container').addClass('squeeze-in squeezed-cal');
  },

  collapseSideModal: function() {
    $('.side-container').removeClass('slide-in side-deployed');
    $('.cal-container').removeClass('squeeze-in squeezed-cal');
    $('.side-container').addClass('slide-out side-collapsed');
    $('.cal-container').addClass('squeeze-out full-cal');
  }


});

},{"./actions/course_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/home/linoah/Documents/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/home/linoah/Documents/semesterly/static/js/new_timetable/modal_content.jsx","./side_bar.jsx":"/home/linoah/Documents/semesterly/static/js/new_timetable/side_bar.jsx","./stores/toast_store.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
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
            React.createElement("i", {className: "fa fa-sliders fa-2x menu-icon"})
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


var day_to_letter = {
    'M':  'M', 
    'T':  'T', 
    'W':  'W',
    'R': 'Th',
    'F':  'F',
    'S': 'Sa',
    'U': 'S'
};

module.exports = React.createClass({displayName: "exports",
    render: function() {
        var cos = this.getRelatedCourseOfferings();
        var dayAndTimes = this.getDaysAndTimes(cos);
        var sect = React.createElement("div", {key: this.props.key, id: "section-num"}, cos[0].meeting_section);
        var prof = React.createElement("div", {key: this.props.key, id: "profs"}, cos[0].instructors);
        var sect_prof = React.createElement("div", {key: this.props.key, id: "sect-prof"}, sect, prof);
        return React.createElement("div", {key: this.props.key, id: "section-wrapper"}, sect_prof, dayAndTimes);
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
            return (React.createElement("div", {key: this.props.key, id: "day-time", key: o.id}, day_to_letter[o.day] + " " + o.time_start + "-" + o.time_end));
        }.bind(this));
        return ( React.createElement("div", {key: this.props.key, id: "dt-container"}, 
                dayAndTimes
            ) )
    }
});

},{"./actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
var TimetableStore = require('./stores/update_timetables.js')

var RosterSlot = React.createClass({displayName: "RosterSlot",
  render: function() {
    return (
      React.createElement("div", {
        onClick: this.props.toggleModal(this.props.id), 
        className: "slot-outer fc-time-grid-event fc-event slot slot-" + this.props.course}, 
        React.createElement("div", {className: "fc-content"}, 
          React.createElement("div", {className: "fc-title slot-text-row"}, this.props.name)
        )
      )
    );
  }
})

var CourseRoster = React.createClass({displayName: "CourseRoster",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.state.timetables.length > 0) {
      // console.log(this.state.timetables[0].courses)
      var slots = this.state.timetables[0].courses.map(function(course) {
        return React.createElement(RosterSlot, React.__spread({},  course, {toggleModal: this.props.toggleModal, key: course.code}))
      }.bind(this));
    } else {
      slots = null;
    }
    var tt = this.state.timetables.length > 0 ? this.state.timetables[0] : null;
    return (
      React.createElement("div", {className: "roster-container"}, 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Semester")
        ), 
        React.createElement("div", {className: "course-roster"}, 
          slots
        )
      )
    )
  }
})

var TextbookRoster = React.createClass({displayName: "TextbookRoster",

  render: function() {
    return (
      React.createElement("div", {className: "roster-container"}, 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Textbooks")
        ), 
        React.createElement("div", {className: "course-roster"}
        )
      )
    )
  }
})

module.exports = React.createClass({displayName: "exports",

  render: function() {
    return (
      React.createElement("div", {ref: "sidebar", className: "side-container side-collapsed flexzone"}, 
        React.createElement(CourseRoster, {toggleModal: this.props.toggleModal}), 
        React.createElement(TextbookRoster, null)
      )
    )
  }
});

},{"./stores/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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
         }.bind(this)
    );

  },

  getInitialState: function() {
    return {course_info: null, loading: true};
  }
});

},{"../actions/course_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/home/linoah/Documents/semesterly/static/js/new_timetable/toast.jsx"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
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
        if (response.error) { // error from URL or local storage
          localStorage.removeItem('data');
          tt_state.courses_to_sections = {};
          this.trigger(this.getInitialState());
          return; // stop processing here
        }
        if (response.length > 0) {
          tt_state = new_state; //only update state if successful
          var index = 0;
          if (new_state.index && new_state.index < response.length) {
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

},{"../actions/toast_actions.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');
var Util = require('./util/timetable_util');
var NewPagination = require('./new_pagination');

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
    var link = window.location.host + "/";
    var data = Util.getLinkData(this.state.courses_to_sections,
      this.state.current_index);
    return link + data;
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

  componentDidUpdate: function() {
    if(typeof(Storage) !== "undefined") {
      if (this.state.timetables.length > 0) {
        // save newly generated courses to local storage
        var new_data = Util.getLinkData(this.state.courses_to_sections, 
          this.state.current_index);
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});

},{"./actions/toast_actions":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/home/linoah/Documents/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/home/linoah/Documents/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/home/linoah/Documents/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/home/linoah/Documents/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/home/linoah/Documents/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/home/linoah/Documents/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	getInitialState: function() {
		return {visible: true};
	},		
	render: function() {
		if (!this.state.visible) {return null;}
		return (
		React.createElement("div", {className: "sem-toast-wrapper toasting"}, 
			React.createElement("div", {className: "sem-toast"}, this.props.content)
		)
		);
	},
	componentDidMount: function() {
		setTimeout(function() {
			if (this._reactInternalInstance) { // if mounted still
				this.setState({visible: false});
			}
		}.bind(this), 4000);
	},

});

},{}],"/home/linoah/Documents/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
module.exports = {
	getLinkData: function(courses_to_sections, index) {
	    var data = index + "&";
	    var c_to_s = courses_to_sections;
	    for (var course_id in c_to_s) {
	      data += course_id;
	      var mapping = c_to_s[course_id];
	      for (var section_heading in mapping) { // i.e 'L', 'T', 'P', 'S'
	        if (mapping[section_heading] != "") {
	          data += "+" + mapping[section_heading]; // delimiter for sections locked
	        }
	      }
	      data += "&"; // delimiter for courses
	    }
	    data = data.slice(0, -1);
	    if (data.length < 3) {data = "";}
	    return data;
	},
}

},{}]},{},["/home/linoah/Documents/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hcHAuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2NvbnRyb2xfYmFyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9ldmFsdWF0aW9ucy5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbG9hZGVyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9tb2RhbF9jb250ZW50LmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9uZXdfcGFnaW5hdGlvbi5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcHJlZmVyZW5jZV9tZW51LmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9yb290LmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWFyY2hfYmFyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWN0aW9uX3Nsb3QuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpZGVfYmFyLmpzeCIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy9jb3Vyc2VfaW5mby5qcyIsIi9ob21lL2xpbm9haC9Eb2N1bWVudHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdG9hc3Rfc3RvcmUuanMiLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RpbWV0YWJsZS5qc3giLCIvaG9tZS9saW5vYWgvRG9jdW1lbnRzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdG9hc3QuanN4IiwiL2hvbWUvbGlub2FoL0RvY3VtZW50cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3V0aWwvdGltZXRhYmxlX3V0aWwuanMi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QUNqQyxPQUFPLElBQUksQ0FBQztFQUNmO0NBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJnZXRUaW1ldGFibGVMaW5rXCIsXG4gIFwibG9hZFByZXNldFRpbWV0YWJsZVwiLFxuICBdXG4pO1xuIiwidmFyIFJvb3QgPSByZXF1aXJlKCcuL3Jvb3QnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzJyk7XG5jb3Vyc2VzID0gW107XG5fU0NIT09MID0gXCJqaHVcIjtcbl9TRU1FU1RFUiA9IFwiU1wiO1xuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZScpXG4pO1xuXG52YXIgZGF0YSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdWJzdHJpbmcoMSk7IC8vIGxvYWRpbmcgdGltZXRhYmxlIGRhdGEgZnJvbSB1cmxcbmlmICghZGF0YSAmJiB0eXBlb2YoU3RvcmFnZSkgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZGlkbid0IGZpbmQgaW4gVVJMLCB0cnkgbG9jYWwgc3RvcmFnZVxuICAgIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZGF0YScpO1xufSBcbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhfc2VsZWN0ZWQ6IG51bGxcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQ8L2Rpdj4pIDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsc31cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2NsaWNrX25vdGljZX1cblx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdGNoYW5nZVNlbGVjdGVkOiBmdW5jdGlvbihlX2luZGV4KSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluZGV4X3NlbGVjdGVkID09IGVfaW5kZXgpIFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogbnVsbH0pO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogZV9pbmRleH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH1cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgQ291cnNlSW5mb1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvY291cnNlX2luZm8nKTtcbnZhciBFdmFsdWF0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vZXZhbHVhdGlvbnMuanN4Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIENvdXJzZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTZWN0aW9uU2xvdCA9IHJlcXVpcmUoJy4vc2VjdGlvbl9zbG90LmpzeCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtSZWZsdXguY29ubmVjdChDb3Vyc2VJbmZvU3RvcmUpXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsb2FkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyA8TG9hZGVyIC8+IDogbnVsbDtcblx0XHR2YXIgaGVhZGVyID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0SGVhZGVyKClcblx0XHR2YXIgZGVzY3JpcHRpb24gPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXREZXNjcmlwdGlvbigpXG5cdFx0dmFyIGV2YWx1YXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0RXZhbHVhdGlvbnMoKVxuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFJlY29tZW5kYXRpb25zKClcblx0XHR2YXIgdGV4dGJvb2tzID10aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRUZXh0Ym9va3MoKVxuXHRcdHZhciBzZWN0aW9ucyA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFNlY3Rpb25zKClcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD1cIm1vZGFsLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICB7bG9hZGVyfVxuICAgICAgICAgICAgICAgIHtoZWFkZXJ9XG4gICAgICAgICAgICAgICAge2Rlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgIHtldmFsdWF0aW9uc31cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnN9XG4gICAgICAgICAgICAgICAge3RleHRib29rc31cbiAgICAgICAgICAgICAgICB7cmVjb21lbmRhdGlvbnN9XG4gICAgICAgICAgICA8L2Rpdj4pO1xuXHR9LFxuXG5cdGdldEhlYWRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhlYWRlciA9ICg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWhlYWRlclwiPlxuXHRcdFx0PGRpdiBpZD1cImNvdXJzZS1pbmZvLXdyYXBwZXJcIj5cblx0XHRcdFx0PGRpdiBpZD1cIm5hbWVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5uYW1lfTwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY29kZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGV9PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvdXJzZS1hY3Rpb24gZnVpLXBsdXNcIiBvbkNsaWNrPXt0aGlzLmFkZENvdXJzZSgpfS8+XG5cdFx0PC9kaXY+KVxuXHRcdHJldHVybiBoZWFkZXJcblx0fSxcblxuXHRhZGRDb3Vyc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IGZhbHNlfSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXHRvcGVuUmVjb21lbmRhdGlvbjogZnVuY3Rpb24oY291cnNlX2lkKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdENvdXJzZUFjdGlvbnMuZ2V0Q291cnNlSW5mbyhjb3Vyc2VfaWQpXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXHRnZXREZXNjcmlwdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlc2NyaXB0aW9uID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLWRlc2NyaXB0aW9uXCI+XG5cdFx0XHRcdDxoNj5EZXNjcmlwdGlvbjo8L2g2PlxuXHRcdFx0XHR7dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5kZXNjcmlwdGlvbn1cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gZGVzY3JpcHRpb247XG5cdH0sXG5cblx0Z2V0RXZhbHVhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiA8RXZhbHVhdGlvbk1hbmFnZXIgZXZhbF9pbmZvPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmV2YWxfaW5mb30gLz5cblx0fSxcblxuXHRnZXRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlbGF0ZWQgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnJlbGF0ZWRfY291cnNlcy5zbGljZSgwLDMpLm1hcChmdW5jdGlvbihyYykge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJyZWNvbW1lbmRhdGlvblwiIG9uQ2xpY2s9e3RoaXMub3BlblJlY29tZW5kYXRpb24ocmMuaWQpfSBrZXk9e3JjLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNlbnRlci13cmFwcGVyXCI+XG5cdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJlYy13cmFwcGVyXCI+XG5cdFx0ICAgICAgICAgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwibmFtZVwiPntyYy5uYW1lfTwvZGl2PlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvZGVcIj57cmMuY29kZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdDwvZGl2PlxuXHRcdCAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXHQ8L2Rpdj4pXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMubGVuZ3RoID09IDAgPyBudWxsIDpcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCI+XG5cdFx0XHRcdDxoNj5Db3Vyc2VzIFlvdSBNaWdodCBMaWtlOjwvaDY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJjb3Vyc2UtcmVjb21lbmRhdGlvbnNcIj5cblx0XHRcdFx0XHR7cmVsYXRlZH1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHJlY29tZW5kYXRpb25zXG5cdH0sXG5cblx0ZXhwYW5kUmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXG5cdH0sXG5cblx0Z2V0VGV4dGJvb2tzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGV4dGJvb2tfZWxlbWVudHMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIFx0PGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGIuaWR9PlxuICAgICAgICAgICAgXHRcdDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXt0Yi5pbWFnZV91cmx9Lz5cbiAgICAgICAgICAgIFx0XHQ8aDY+e3RiLnRpdGxlfTwvaDY+XG4gICAgICAgICAgICBcdFx0PGRpdj57dGIuYXV0aG9yfTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxkaXY+SVNCTjp7dGIuaXNibn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8YSBocmVmPXt0Yi5kZXRhaWxfdXJsfSB0YXJnZXQ9XCJfYmxhbmtcIj5cbiAgICAgICAgICAgIFx0XHRcdDxpbWcgc3JjPVwiaHR0cHM6Ly9pbWFnZXMtbmEuc3NsLWltYWdlcy1hbWF6b24uY29tL2ltYWdlcy9HLzAxL2Fzc29jaWF0ZXMvcmVtb3RlLWJ1eS1ib3gvYnV5NS5fVjE5MjIwNzczOV8uZ2lmXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIyOFwiIGJvcmRlcj1cIjBcIi8+XG4gICAgICAgICAgICBcdFx0PC9hPlxuICAgICAgICAgICAgXHQ8L2Rpdj4pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciB0ZXh0Ym9va3MgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnRleHRib29rX2luZm9bMF0udGV4dGJvb2tzLmxlbmd0aCA9PSAwID8gKDxkaXYgaWQ9XCJlbXB0eS1pbnRyb1wiPk5vIHRleHRib29rcyB5ZXQgZm9yIHRoaXMgY291cnNlPC9kaXY+KSA6XG5cdFx0XHRcdCg8ZGl2IGlkPVwidGV4dGJvb2tzXCI+XG5cdCAgICAgICAgICAgIFx0e3RleHRib29rX2VsZW1lbnRzfVxuXHQgICAgICAgICAgICA8L2Rpdj4pO1xuXHRcdHZhciByZXQgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtdGV4dGJvb2tzXCI+XG5cdFx0XHRcdDxoNj5UZXh0Ym9va3M6PC9oNj5cblx0XHRcdFx0e3RleHRib29rc31cblx0XHRcdDwvZGl2Pik7XG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblxuXHRnZXRTZWN0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIEYgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0YubWFwKGZ1bmN0aW9uKHMpe1xuXHRcdFx0cmV0dXJuICg8U2VjdGlvblNsb3Qga2V5PXtzLmlkfSBhbGxfc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRl9vYmpzfSBzZWN0aW9uPXtzfS8+KVxuXHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIFMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1MubWFwKGZ1bmN0aW9uKHMpe1xuXHRcdFx0cmV0dXJuICg8U2VjdGlvblNsb3Qga2V5PXtzLmlkfSBhbGxfc2VjdGlvbnM9e3RoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfU19vYmpzfSBzZWN0aW9uPXtzfS8+KVxuXHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHNlY3Rpb25zID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLXNlY3Rpb25zXCI+XG5cdFx0XHRcdDxoNj5Db3Vyc2UgU2VjdGlvbnM6PC9oNj5cblx0XHRcdFx0PGRpdiBpZD1cImFsbC1zZWN0aW9ucy13cmFwcGVyXCI+XG5cdFx0XHRcdFx0e0Z9XG5cdFx0XHRcdFx0e1N9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiBzZWN0aW9uc1xuXHR9LFxuXG5cbn0pO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2ZpcnN0X2Rpc3BsYXllZDogMH07XG4gIH0sXG5cbiAgY2hhbmdlUGFnZTogZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXgsXG4gICAgICAgICAgIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudDtcbiAgICAgICAvLyBjYWxjdWxhdGUgdGhlIG5ldyBmaXJzdF9kaXNwbGF5ZWQgYnV0dG9uICh0aW1ldGFibGUpXG4gICAgICAgdmFyIG5ld19maXJzdCA9IGN1cnJlbnQgKyAoOSpkaXJlY3Rpb24pIC0gKGN1cnJlbnQgJSA5KTtcbiAgICAgICBpZiAobmV3X2ZpcnN0ID49IDAgJiYgbmV3X2ZpcnN0IDwgY291bnQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5zZXRJbmRleChuZXdfZmlyc3QpKCk7XG4gICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgICBcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBcdHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBcdGlmIChjb3VudCA8PSAxKSB7IHJldHVybiBudWxsOyB9IC8vIGRvbid0IGRpc3BsYXkgaWYgdGhlcmUgYXJlbid0IGVub3VnaCBzY2hlZHVsZXNcbiAgICBcdHZhciBmaXJzdCA9IGN1cnJlbnQgLSAoY3VycmVudCAlIDkpOyAvLyByb3VuZCBkb3duIHRvIG5lYXJlc3QgbXVsdGlwbGUgb2YgOVxuICAgIFx0dmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyA5LCBjb3VudCk7XG4gICAgXHRmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgIFx0IHZhciBjbGFzc05hbWUgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXggPT0gaSA/IFwiYWN0aXZlXCIgOiBcIlwiO1xuICAgICAgXHRcdG9wdGlvbnMucHVzaChcbiAgICAgICAgXHRcdDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17XCJzZW0tcGFnZSBcIiArIGNsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+XG4gICAgICAgICAgICAgXHRcdCB7aSArIDF9XG4gICAgICAgXHRcdFx0PC9saT4pO1xuICBcdFx0fVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2IG5hdi1kb3VibGUgbmF2LWRvdWJsZS1wcmV2XCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKC0xKX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1sZWZ0IHNlbS1wYWdpbmF0aW9uLXByZXYgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8b2wgY2xhc3NOYW1lPVwic2VtLXBhZ2VzXCI+XG5cdFx0XHRcdFx0e29wdGlvbnN9XG5cdFx0XHRcdDwvb2w+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb24tbmF2XCIgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1yaWdodCBzZW0tcGFnaW5hdGlvbi1uZXh0IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLW5leHRcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodCBzZW0tcGFnaW5hdGlvbi1uZXh0IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2ZpcnN0X2Rpc3BsYXllZDogMH07XG4gIH0sXG5cbiAgY2hhbmdlUGFnZTogZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXgsXG4gICAgICAgICAgIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudDtcbiAgICAgICAvLyBjYWxjdWxhdGUgdGhlIG5ldyBmaXJzdF9kaXNwbGF5ZWQgYnV0dG9uICh0aW1ldGFibGUpXG4gICAgICAgdmFyIG5ld19maXJzdCA9IGN1cnJlbnQgKyAoOSpkaXJlY3Rpb24pIC0gKGN1cnJlbnQgJSA5KTtcbiAgICAgICBpZiAobmV3X2ZpcnN0ID49IDAgJiYgbmV3X2ZpcnN0IDwgY291bnQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5zZXRJbmRleChuZXdfZmlyc3QpKCk7XG4gICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3B0aW9ucyA9IFtdLCBjb3VudCA9IHRoaXMucHJvcHMuY291bnQsIGN1cnJlbnQgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXg7XG4gICAgaWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIHZhciBmaXJzdCA9IGN1cnJlbnQgLSAoY3VycmVudCAlIDkpOyAvLyByb3VuZCBkb3duIHRvIG5lYXJlc3QgbXVsdGlwbGUgb2YgOVxuICAgIHZhciBsaW1pdCA9IE1hdGgubWluKGZpcnN0ICsgOSwgY291bnQpO1xuICAgIGZvciAodmFyIGkgPSBmaXJzdDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgIHZhciBjbGFzc05hbWUgPSB0aGlzLnByb3BzLmN1cnJlbnRfaW5kZXggPT0gaSA/IFwiYWN0aXZlXCIgOiBcIlwiO1xuICAgICAgb3B0aW9ucy5wdXNoKFxuICAgICAgICA8bGkga2V5PXtpfSBjbGFzc05hbWU9e2NsYXNzTmFtZX0+XG4gICAgICAgICAgICAgIDxhIG9uQ2xpY2s9e3RoaXMucHJvcHMuc2V0SW5kZXgoaSl9PntpICsgMX08L2E+XG4gICAgICAgIDwvbGk+KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24gcGFnaW5hdGlvbi1taW5pbWFsXCI+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXYtZG91YmxlXCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKC0xKX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtbGVmdFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwicHJldmlvdXNcIj5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiZnVpLWFycm93LWxlZnQgcGFnaW5hdGlvbi1idG5cIiBcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnByZXZ9PjwvYT5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICB7b3B0aW9uc31cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm5leHRcIj5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiZnVpLWFycm93LXJpZ2h0IHBhZ2luYXRpb24tYnRuXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLm5leHR9PjwvYT5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dC1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoMSl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuICBcblxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBCaW5hcnlQcmVmZXJlbmNlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRvZ2dsZV9sYWJlbCA9IFwiY21uLXRvZ2dsZS1cIiArIHRoaXMucHJvcHMudG9nZ2xlX2lkO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtaXRlbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdGV4dFwiPlxuICAgICAgICAgIDxsaT4ge3RoaXMucHJvcHMudGV4dH0gPC9saT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10b2dnbGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXRjaFwiPlxuICAgICAgICAgICAgPGlucHV0IHJlZj1cImNoZWNrYm94X2VsZW1cIiBpZD17dG9nZ2xlX2xhYmVsfSBcbiAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJjbW4tdG9nZ2xlIGNtbi10b2dnbGUtcm91bmRcIiB0eXBlPVwiY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnRvZ2dsZVByZWZlcmVuY2V9Lz5cbiAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPXt0b2dnbGVfbGFiZWx9PjwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVQcmVmZXJlbmNlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3X3ZhbHVlID0gdGhpcy5yZWZzLmNoZWNrYm94X2VsZW0uY2hlY2tlZDtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZVByZWZlcmVuY2VzKHRoaXMucHJvcHMubmFtZSwgbmV3X3ZhbHVlKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBjdXJyZW50X3RvZ2dsZV9pZDogMCxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwibWVudS1jb250YWluZXJcIiBjbGFzc05hbWU9XCJjb2xsYXBzZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdmJhci1jb2xsYXBzZVwiID5cbiAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibmF2IG5hdmJhci1uYXZcIiBpZD1cIm1lbnVcIj5cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgIDxCaW5hcnlQcmVmZXJlbmNlIHRleHQ9XCJBdm9pZCBlYXJseSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYmVmb3JlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGxhdGUgY2xhc3Nlc1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJub19jbGFzc2VzX2FmdGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVfaWQ9e3RoaXMuZ2V0X25leHRfdG9nZ2xlX2lkKCl9IC8+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkFsbG93IGNvbmZsaWN0c1wiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU9XCJ0cnlfd2l0aF9jb25mbGljdHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGdldF9uZXh0X3RvZ2dsZV9pZDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdXJyZW50X3RvZ2dsZV9pZCArPSAxXG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF90b2dnbGVfaWQ7XG4gIH1cblxufSk7IiwidmFyIENvbnRyb2xCYXIgPSByZXF1aXJlKCcuL2NvbnRyb2xfYmFyJyk7XG52YXIgVGltZXRhYmxlID0gcmVxdWlyZSgnLi90aW1ldGFibGUnKTtcbnZhciBNb2RhbENvbnRlbnQgPSByZXF1aXJlKCcuL21vZGFsX2NvbnRlbnQnKTtcbnZhciBUb2FzdFN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdG9hc3Rfc3RvcmUuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlX2Jhci5qc3gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKSwgUmVmbHV4LmNvbm5lY3QoVG9hc3RTdG9yZSldLFxuICBzaWRlYmFyX2NvbGxhcHNlZDogdHJ1ZSxcblxuICBnZXRJbml0aWFsU3RhdGU6ZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nZXRDb3Vyc2VzKCk7XG5cbiAgICByZXR1cm4ge307XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIE1vZGFsID0gQm9yb25bJ091dGxpbmVNb2RhbCddO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJyb290XCI+XG4gICAgICAgIDxkaXYgaWQ9XCJ0b2FzdC1jb250YWluZXJcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cInNlbWVzdGVybHktbmFtZVwiPlNlbWVzdGVyLmx5PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8Q29udHJvbEJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cIm5hdmljb25cIiBvbkNsaWNrPXt0aGlzLnRvZ2dsZVNpZGVNb2RhbH0+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IC8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWxsLWNvbHMtY29udGFpbmVyXCI+XG4gICAgICAgICAgPFNpZGViYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhbC1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxUaW1ldGFibGUgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLnRvZ2dsZSgpO1xuICAgICAgICBjb3Vyc2VfYWN0aW9ucy5nZXRDb3Vyc2VJbmZvKGNvdXJzZV9pZCk7XG4gICAgfS5iaW5kKHRoaXMpOyBcbiAgfSxcblxuICBnZXRDb3Vyc2VzOiBmdW5jdGlvbigpIHtcbiAgICAkLmdldChcIi9jb3Vyc2VzL1wiICsgX1NDSE9PTCArIFwiL1wiICsgX1NFTUVTVEVSLCBcbiAgICAgICAge30sIFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgIGNvdXJzZXMgPSByZXNwb25zZTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVTaWRlTW9kYWw6IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBleHBhbmRTaWRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICQoJy5jYWwtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ3NxdWVlemUtb3V0IGZ1bGwtY2FsJyk7XG4gICAgJCgnLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ3NsaWRlLW91dCBzaWRlLWNvbGxhcHNlZCcpO1xuICAgICQoJy5zaWRlLWNvbnRhaW5lcicpLmFkZENsYXNzKCdzbGlkZS1pbiBzaWRlLWRlcGxveWVkJyk7XG4gICAgJCgnLmNhbC1jb250YWluZXInKS5hZGRDbGFzcygnc3F1ZWV6ZS1pbiBzcXVlZXplZC1jYWwnKTtcbiAgfSxcblxuICBjb2xsYXBzZVNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ3NsaWRlLWluIHNpZGUtZGVwbG95ZWQnKTtcbiAgICAkKCcuY2FsLWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCdzcXVlZXplLWluIHNxdWVlemVkLWNhbCcpO1xuICAgICQoJy5zaWRlLWNvbnRhaW5lcicpLmFkZENsYXNzKCdzbGlkZS1vdXQgc2lkZS1jb2xsYXBzZWQnKTtcbiAgICAkKCcuY2FsLWNvbnRhaW5lcicpLmFkZENsYXNzKCdzcXVlZXplLW91dCBmdWxsLWNhbCcpO1xuICB9XG5cblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIFNlYXJjaFJlc3VsdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGlfY2xhc3MgPSBcInNlYXJjaC1yZXN1bHRcIiwgaWNvbl9jbGFzcyA9IFwiZnVpLXBsdXNcIjtcbiAgICBpZiAodGhpcy5wcm9wcy5pbl9yb3N0ZXIpIHtcbiAgICAgIGxpX2NsYXNzICs9IFwiIHRvZG8tZG9uZVwiO1xuICAgICAgaWNvbl9jbGFzcyA9IFwiZnVpLWNoZWNrXCI7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8bGkgY2xhc3NOYW1lPXtsaV9jbGFzc30gb25Nb3VzZURvd249e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8tY29udGVudFwiPlxuICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0b2RvLW5hbWVcIj5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLmNvZGV9XG4gICAgICAgICAgPC9oND5cbiAgICAgICAgICB7dGhpcy5wcm9wcy5uYW1lfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtcInNlYXJjaC1yZXN1bHQtYWN0aW9uIFwiICsgaWNvbl9jbGFzc30gXG4gICAgICAgICAgb25Nb3VzZURvd249e3RoaXMudG9nZ2xlQ291cnNlfT5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9saT5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZW1vdmluZyA9IHRoaXMucHJvcHMuaW5fcm9zdGVyO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogcmVtb3Zpbmd9KTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7ICAvLyBzdG9wIGlucHV0IGZyb20gdHJpZ2dlcmluZyBvbkJsdXIgYW5kIHRodXMgaGlkaW5nIHJlc3VsdHNcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBzdG9wIHBhcmVudCBmcm9tIG9wZW5pbmcgbW9kYWxcbiAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgZm9jdXNlZDogZmFsc2UsXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWFyY2hfcmVzdWx0c19kaXYgPSB0aGlzLmdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQoKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1iYXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnB1dC1jb21iaW5lXCI+XG4gICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IGNvZGUsIHRpdGxlLCBkZXNjcmlwdGlvbiwgcHJvZmVzc29yLCBkZWdyZWVcIiBcbiAgICAgICAgICAgIGlkPVwic2VhcmNoLWlucHV0XCIgXG4gICAgICAgICAgICByZWY9XCJpbnB1dFwiIFxuICAgICAgICAgICAgb25Gb2N1cz17dGhpcy5mb2N1c30gb25CbHVyPXt0aGlzLmJsdXJ9IFxuICAgICAgICAgICAgb25JbnB1dD17dGhpcy5xdWVyeUNoYW5nZWR9Lz5cbiAgICAgICAgICA8YnV0dG9uIGRhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIiBkYXRhLXRhcmdldD1cIiNtZW51LWNvbnRhaW5lclwiIGlkPVwibWVudS1idG5cIj5cbiAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImZhIGZhLXNsaWRlcnMgZmEtMnggbWVudS1pY29uXCI+PC9pPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c19kaXZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZm9jdXNlZCB8fCB0aGlzLnN0YXRlLnJlc3VsdHMubGVuZ3RoID09IDApIHtyZXR1cm4gbnVsbDt9XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzZWFyY2hfcmVzdWx0cyA9IHRoaXMuc3RhdGUucmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgaSsrO1xuICAgICAgdmFyIGluX3Jvc3RlciA9IHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tyLmlkXSAhPSBudWxsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlYXJjaFJlc3VsdCB7Li4ucn0ga2V5PXtpfSBpbl9yb3N0ZXI9e2luX3Jvc3Rlcn0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9Lz5cbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8gbXJtXCI+XG4gICAgICAgICAgICA8dWwgaWQ9XCJzZWFyY2gtcmVzdWx0c1wiPlxuICAgICAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHN9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogdHJ1ZX0pO1xuICB9LFxuXG4gIGJsdXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IGZhbHNlfSk7XG4gIH0sXG5cbiAgcXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBxdWVyeSA9IGV2ZW50LnRhcmdldC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBmaWx0ZXJlZCA9IHF1ZXJ5Lmxlbmd0aCA8PSAxID8gW10gOiB0aGlzLmZpbHRlckNvdXJzZXMocXVlcnkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHM6IGZpbHRlcmVkfSk7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgcmVzdWx0cyA9IGNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAoYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG52YXIgY29sb3VyX3RvX2hpZ2hsaWdodCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3QgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj47XG4gICAgICAgIHZhciBwcm9mID0gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInByb2ZzXCI+e2Nvc1swXS5pbnN0cnVjdG9yc308L2Rpdj47XG4gICAgICAgIHZhciBzZWN0X3Byb2YgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdC1wcm9mXCI+e3NlY3R9e3Byb2Z9PC9kaXY+O1xuICAgICAgICByZXR1cm4gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInNlY3Rpb24td3JhcHBlclwiPntzZWN0X3Byb2Z9e2RheUFuZFRpbWVzfTwvZGl2PjtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKG8ubWVldGluZ19zZWN0aW9uID09IHRoaXMucHJvcHMuc2VjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvX29iamVjdHMucHVzaChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29fb2JqZWN0cztcbiAgICB9LFxuXG4gICAgZ2V0RGF5c0FuZFRpbWVzOiBmdW5jdGlvbihjb3MpIHtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gY29zLm1hcChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkYXktdGltZVwiIGtleT17by5pZH0+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cImR0LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIHtkYXlBbmRUaW1lc31cbiAgICAgICAgICAgIDwvZGl2PiApXG4gICAgfVxufSk7XG4iLCJ2YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpXG5cbnZhciBSb3N0ZXJTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSlcblxudmFyIENvdXJzZVJvc3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIHVzZSB0aGUgdGltZXRhYmxlIGZvciBzbG90cyBiZWNhdXNlIGl0IGNvbnRhaW5zIHRoZSBtb3N0IGluZm9ybWF0aW9uXG4gICAgaWYgKHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbMF0uY291cnNlcylcbiAgICAgIHZhciBzbG90cyA9IHRoaXMuc3RhdGUudGltZXRhYmxlc1swXS5jb3Vyc2VzLm1hcChmdW5jdGlvbihjb3Vyc2UpIHtcbiAgICAgICAgcmV0dXJuIDxSb3N0ZXJTbG90IHsuLi5jb3Vyc2V9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBrZXk9e2NvdXJzZS5jb2RlfS8+XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzbG90cyA9IG51bGw7XG4gICAgfVxuICAgIHZhciB0dCA9IHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwID8gdGhpcy5zdGF0ZS50aW1ldGFibGVzWzBdIDogbnVsbDtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm9zdGVyLWhlYWRlclwiPlxuICAgICAgICAgIDxoND5Zb3VyIFNlbWVzdGVyPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlclwiPlxuICAgICAgICAgIHtzbG90c31cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn0pXG5cbnZhciBUZXh0Ym9va1Jvc3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlclwiPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9XCJzaWRlYmFyXCIgY2xhc3NOYW1lPVwic2lkZS1jb250YWluZXIgc2lkZS1jb2xsYXBzZWQgZmxleHpvbmVcIj5cbiAgICAgICAgPENvdXJzZVJvc3RlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0vPlxuICAgICAgICA8VGV4dGJvb2tSb3N0ZXIgLz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSk7IiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cblxuLy8gbWFwcyBiYXNlIGNvbG91ciBvZiBzbG90IHRvIGNvbG91ciBvbiBoaWdobGlnaHRcbnZhciBjb2xvdXJfdG9faGlnaGxpZ2h0ID0ge1xuICAgIFwiI0ZENzQ3M1wiIDogXCIjRTI2QTZBXCIsXG4gICAgXCIjNDRCQkZGXCIgOiBcIiMyOEE0RUFcIixcbiAgICBcIiM0Q0Q0QjBcIiA6IFwiIzNEQkI5QVwiLFxuICAgIFwiIzg4NzBGRlwiIDogXCIjNzA1OUU2XCIsXG4gICAgXCIjRjlBRTc0XCIgOiBcIiNGNzk1NEFcIixcbiAgICBcIiNENERCQzhcIiA6IFwiI0I1QkZBM1wiLFxuICAgIFwiI0U3Rjc2RFwiIDogXCIjQzRENDREXCIsXG4gICAgXCIjRjE4MkI0XCIgOiBcIiNERTY5OURcIixcbiAgICBcIiM3NDk5QTJcIiA6IFwiIzY2OEI5NFwiLFxufSAvLyBjb25zaWRlciAjQ0YwMDBGLCAjZThmYWMzXG5cbi8vIGhvdyBiaWcgYSBzbG90IG9mIGhhbGYgYW4gaG91ciB3b3VsZCBiZSwgaW4gcGl4ZWxzXG52YXIgSEFMRl9IT1VSX0hFSUdIVCA9IDMwO1xuXG52YXIgU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge3Nob3dfYnV0dG9uczogZmFsc2V9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGluID0gbnVsbCwgcmVtb3ZlX2J1dHRvbiA9IG51bGw7XG4gICAgICAgIHZhciBzbG90X3N0eWxlID0gdGhpcy5nZXRTbG90U3R5bGUoKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zaG93X2J1dHRvbnMpIHtcbiAgICAgICAgICAgIHBpbiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lciBib3R0b21cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZFwiIG9uQ2xpY2s9e3RoaXMucGluQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXRodW1iLXRhY2tcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgICAgICByZW1vdmVfYnV0dG9uID0gKCA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZFwiIG9uQ2xpY2s9e3RoaXMucmVtb3ZlQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXRpbWVzIHJlbW92ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcm9wcy5waW5uZWQpIHtcbiAgICAgICAgICAgIHBpbiA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lciBib3R0b21cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ1dHRvbi1zdXJyb3VuZCBwaW5uZWRcIiBvbkNsaWNrPXt0aGlzLnVucGluQ291cnNlfSA+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXRodW1iLXRhY2tcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuY291cnNlKX1cbiAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17dGhpcy51bmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtcInNsb3Qtb3V0ZXIgZmMtdGltZS1ncmlkLWV2ZW50IGZjLWV2ZW50IHNsb3Qgc2xvdC1cIiArIHRoaXMucHJvcHMuY291cnNlfSBcbiAgICAgICAgICAgIHN0eWxlPXtzbG90X3N0eWxlfT5cbiAgICAgICAgICAgIHtyZW1vdmVfYnV0dG9ufVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0aGlzLnByb3BzLnRpbWVfc3RhcnR9IOKAkyB7dGhpcy5wcm9wcy50aW1lX2VuZH08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5jb2RlICsgXCIgXCIgKyB0aGlzLnByb3BzLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAge3Bpbn0gICAgICAgICAgICBcbiAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgLyoqXG4gICAgKiBSZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgc3R5bGUgb2YgYSBzcGVjaWZpYyBzbG90LiBTaG91bGQgc3BlY2lmeSBhdFxuICAgICogbGVhc3QgdGhlIHRvcCB5LWNvb3JkaW5hdGUgYW5kIGhlaWdodCBvZiB0aGUgc2xvdCwgYXMgd2VsbCBhcyBiYWNrZ3JvdW5kQ29sb3JcbiAgICAqIHdoaWxlIHRha2luZyBpbnRvIGFjY291bnQgaWYgdGhlcmUncyBhbiBvdmVybGFwcGluZyBjb25mbGljdFxuICAgICovXG4gICAgZ2V0U2xvdFN0eWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0X2hvdXIgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgc3RhcnRfbWludXRlID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVsxXSksXG4gICAgICAgICAgICBlbmRfaG91ciAgICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBlbmRfbWludXRlICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfZW5kLnNwbGl0KFwiOlwiKVsxXSk7XG5cbiAgICAgICAgdmFyIHRvcCA9IChzdGFydF9ob3VyIC0gOCkqNTIgKyAoc3RhcnRfbWludXRlKSooMjYvMzApO1xuICAgICAgICB2YXIgYm90dG9tID0gKGVuZF9ob3VyIC0gOCkqNTIgKyAoZW5kX21pbnV0ZSkqKDI2LzMwKSAtIDE7XG4gICAgICAgIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3AgLSAyO1xuXG4gICAgICAgIC8vIHRoZSBjdW11bGF0aXZlIHdpZHRoIG9mIHRoaXMgc2xvdCBhbmQgYWxsIG9mIHRoZSBzbG90cyBpdCBpcyBjb25mbGljdGluZyB3aXRoXG4gICAgICAgIHZhciB0b3RhbF9zbG90X3dpZHRocyA9IDk4IC0gKDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsKTtcbiAgICAgICAgLy8gdGhlIHdpZHRoIG9mIHRoaXMgcGFydGljdWxhciBzbG90XG4gICAgICAgIHZhciBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgPSB0b3RhbF9zbG90X3dpZHRocyAvIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cztcbiAgICAgICAgLy8gdGhlIGFtb3VudCBvZiBsZWZ0IG1hcmdpbiBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdCwgaW4gcGVyY2VudGFnZVxuICAgICAgICB2YXIgcHVzaF9sZWZ0ID0gKHRoaXMucHJvcHMuc2hpZnRfaW5kZXggKiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UpICsgNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKGNvbG91cl90b19oaWdobGlnaHRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb24sIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICB1bnBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogdHJ1ZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAgICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2UpXG4gICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gW1wiTVwiLCBcIlRcIiwgXCJXXCIsIFwiUlwiLCBcIkZcIl07XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB0aGlzLmdldFNsb3RzQnlEYXkoKTtcbiAgICAgICAgdmFyIGFsbF9zbG90cyA9IGRheXMubWFwKGZ1bmN0aW9uKGRheSkge1xuICAgICAgICAgICAgdmFyIGRheV9zbG90cyA9IHNsb3RzX2J5X2RheVtkYXldLm1hcChmdW5jdGlvbihzbG90KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmlzUGlubmVkKHNsb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2xvdCB7Li4uc2xvdH0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IGtleT17c2xvdC5pZH0gcGlubmVkPXtwfS8+XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17ZGF5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZXZlbnQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheV9zbG90c31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgIHthbGxfc2xvdHN9XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IHsxOiAnbW9uJywgMjogJ3R1ZScsIDM6ICd3ZWQnLCA0OiAndGh1JywgNTogJ2ZyaSd9O1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IFwiLmZjLVwiICsgZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgLy8gJChzZWxlY3RvcikuYWRkQ2xhc3MoXCJmYy10b2RheVwiKTtcbiAgICB9LFxuXG4gICAgaXNQaW5uZWQ6IGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgdmFyIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdWydDJ107XG4gICAgICAgIGlmIChfU0NIT09MID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVtzbG90Lm1lZXRpbmdfc2VjdGlvblswXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IgPT0gc2xvdC5tZWV0aW5nX3NlY3Rpb247XG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgY291cnNlIGluIHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXMpIHtcbiAgICAgICAgICAgIHZhciBjcnMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzW2NvdXJzZV07XG4gICAgICAgICAgICBmb3IgKHZhciBzbG90X2lkIGluIGNycy5zbG90cykge1xuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gY3JzLnNsb3RzW3Nsb3RfaWRdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2xvdXJcIl0gPSBPYmplY3Qua2V5cyhjb2xvdXJfdG9faGlnaGxpZ2h0KVtjb3Vyc2VdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2RlXCJdID0gY3JzLmNvZGUudHJpbSgpO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJuYW1lXCJdID0gY3JzLm5hbWU7XG4gICAgICAgICAgICAgICAgc2xvdHNfYnlfZGF5W3Nsb3QuZGF5XS5wdXNoKHNsb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbG90c19ieV9kYXk7XG4gICAgfSxcblxufSk7XG4iLCJ2YXIgY291cnNlX2FjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtjb3Vyc2VfYWN0aW9uc10sXG5cbiAgZ2V0Q291cnNlSW5mbzogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgX1NDSE9PTCArIFwiL2lkL1wiICsgY291cnNlX2lkLCBcbiAgICAgICAgIHt9LCBcbiAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IGZhbHNlLCBjb3Vyc2VfaW5mbzogcmVzcG9uc2V9KTtcbiAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG5cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y291cnNlX2luZm86IG51bGwsIGxvYWRpbmc6IHRydWV9O1xuICB9XG59KTtcbiIsInZhciBUb2FzdCA9IHJlcXVpcmUoJy4uL3RvYXN0Jyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtUb2FzdEFjdGlvbnNdLFxuXG4gIGNyZWF0ZVRvYXN0OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC1jb250YWluZXInKTtcbiAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPFRvYXN0IGNvbnRlbnQ9e2NvbnRlbnR9IC8+LFxuICAgICAgY29udGFpbmVyXG4gICAgKTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xuXG5cbnZhciB0dF9zdGF0ZSA9IHtcbiAgc2Nob29sOiBcImpodVwiLFxuICBzZW1lc3RlcjogXCJTXCIsXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBwcmVmZXJlbmNlczoge1xuICAgICdub19jbGFzc2VzX2JlZm9yZSc6IGZhbHNlLFxuICAgICdub19jbGFzc2VzX2FmdGVyJzogZmFsc2UsXG4gICAgJ2xvbmdfd2Vla2VuZCc6IGZhbHNlLFxuICAgICdncm91cGVkJzogZmFsc2UsXG4gICAgJ2RvX3JhbmtpbmcnOiBmYWxzZSxcbiAgICAndHJ5X3dpdGhfY29uZmxpY3RzJzogZmFsc2VcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuXG4gLyoqXG4gICogVXBkYXRlIHR0X3N0YXRlIHdpdGggbmV3IGNvdXJzZSByb3N0ZXJcbiAgKiBAcGFyYW0ge29iamVjdH0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24gY29udGFpbnMgYXR0cmlidXRlZCBpZCwgc2VjdGlvbiwgcmVtb3ZpbmdcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyB0dF9zdGF0ZVxuICAqL1xuICB1cGRhdGVDb3Vyc2VzOiBmdW5jdGlvbihuZXdfY291cnNlX3dpdGhfc2VjdGlvbikge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzp0cnVlfSk7XG5cbiAgICB2YXIgcmVtb3ZpbmcgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5yZW1vdmluZztcbiAgICB2YXIgbmV3X2NvdXJzZV9pZCA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLmlkO1xuICAgIHZhciBzZWN0aW9uID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uc2VjdGlvbjtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIHR0X3N0YXRlKTsgLy8gZGVlcCBjb3B5IG9mIHR0X3N0YXRlXG4gICAgdmFyIGNfdG9fcyA9IG5ld19zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zO1xuICAgIFxuICAgIGlmICghcmVtb3ZpbmcpIHsgLy8gYWRkaW5nIGNvdXJzZVxuICAgICAgaWYgKHR0X3N0YXRlLnNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb259O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHRfc3RhdGUuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgIHZhciBsb2NrZWRfc2VjdGlvbnMgPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiAnJ30gLy8gdGhpcyBpcyB3aGF0IHdlIHdhbnQgdG8gc2VuZCBpZiBub3QgbG9ja2luZ1xuICAgICAgICBpZiAoc2VjdGlvbikgeyAvLyBsb2NraW5nXG4gICAgICAgICAgaWYgKGNfdG9fc1tuZXdfY291cnNlX2lkXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBsb2NrZWRfc2VjdGlvbnMgPSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07IC8vIGNvcHkgdGhlIG9sZCBtYXBwaW5nXG4gICAgICAgICAgICAvLyBpbiBjYXNlIHNvbWUgc2VjdGlvbnMgd2VyZSBhbHJlYWR5IGxvY2tlZCBmb3IgdGhpcyBjb3Vyc2UsXG4gICAgICAgICAgICAvLyBhbmQgbm93IHdlJ3JlIGFib3V0IHRvIGxvY2sgYSBuZXcgb25lLlxuICAgICAgICAgIH1cbiAgICAgICAgICBsb2NrZWRfc2VjdGlvbnNbc2VjdGlvblswXV0gPSBzZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGNfdG9fc1tuZXdfY291cnNlX2lkXSA9IGxvY2tlZF9zZWN0aW9ucztcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7IC8vIHJlbW92aW5nIGNvdXJzZVxuICAgICAgZGVsZXRlIGNfdG9fc1tuZXdfY291cnNlX2lkXTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhjX3RvX3MpLmxlbmd0aCA9PSAwKSB7IC8vIHJlbW92ZWQgbGFzdCBjb3Vyc2VcbiAgICAgICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCkpO1xuICAgICAgICAgIHJldHVybjsgIFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAvKipcbiAgKiBVcGRhdGUgdHRfc3RhdGUgd2l0aCBuZXcgcHJlZmVyZW5jZXNcbiAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZmVyZW5jZTogdGhlIHByZWZlcmVuY2UgdGhhdCBpcyBiZWluZyB1cGRhdGVkXG4gICogQHBhcmFtIG5ld192YWx1ZTogdGhlIG5ldyB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHByZWZlcmVuY2VcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2Vzbid0IHJldHVybiBhbnl0aGluZywganVzdCB1cGRhdGVzIHR0X3N0YXRlXG4gICovXG4gIHVwZGF0ZVByZWZlcmVuY2VzOiBmdW5jdGlvbihwcmVmZXJlbmNlLCBuZXdfdmFsdWUpIHtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIHR0X3N0YXRlKTsgLy8gZGVlcCBjb3B5IG9mIHR0X3N0YXRlXG4gICAgbmV3X3N0YXRlLnByZWZlcmVuY2VzW3ByZWZlcmVuY2VdID0gbmV3X3ZhbHVlO1xuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuICAvLyBNYWtlcyBhIFBPU1QgcmVxdWVzdCB0byB0aGUgYmFja2VuZCB3aXRoIHR0X3N0YXRlXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbihuZXdfc3RhdGUpIHtcbiAgICAkLnBvc3QoJy90aW1ldGFibGUvJywgSlNPTi5zdHJpbmdpZnkobmV3X3N0YXRlKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7IC8vIGVycm9yIGZyb20gVVJMIG9yIGxvY2FsIHN0b3JhZ2VcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMgPSB7fTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5nZXRJbml0aWFsU3RhdGUoKSk7XG4gICAgICAgICAgcmV0dXJuOyAvLyBzdG9wIHByb2Nlc3NpbmcgaGVyZVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdHRfc3RhdGUgPSBuZXdfc3RhdGU7IC8vb25seSB1cGRhdGUgc3RhdGUgaWYgc3VjY2Vzc2Z1bFxuICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgaWYgKG5ld19zdGF0ZS5pbmRleCAmJiBuZXdfc3RhdGUuaW5kZXggPCByZXNwb25zZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGluZGV4ID0gbmV3X3N0YXRlLmluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIG5ld19zdGF0ZVsnaW5kZXgnXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMgIT0ge30pIHsgLy8gY29uZmxpY3RcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBjb25mbGljdF9lcnJvcjogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlRoYXQgY291cnNlIGNhdXNlZCBhIGNvbmZsaWN0ISBUcnkgYWdhaW4gd2l0aCB0aGUgQWxsb3cgQ29uZmxpY3RzIHByZWZlcmVuY2UgdHVybmVkIG9uLlwiKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cblxuICBsb2FkUHJlc2V0VGltZXRhYmxlOiBmdW5jdGlvbih1cmxfZGF0YSkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgIHZhciBjb3Vyc2VzID0gdXJsX2RhdGEuc3BsaXQoXCImXCIpO1xuICAgIHR0X3N0YXRlLmluZGV4ID0gcGFyc2VJbnQoY291cnNlcy5zaGlmdCgpKTtcbiAgICB2YXIgc2Nob29sID0gdHRfc3RhdGUuc2Nob29sO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291cnNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGMgPSBwYXJzZUludChjb3Vyc2VzW2ldKTtcbiAgICAgIHZhciBjb3Vyc2VfaW5mbyA9IGNvdXJzZXNbaV0uc3BsaXQoXCIrXCIpO1xuICAgICAgY291cnNlX2luZm8uc2hpZnQoKTsgLy8gcmVtb3ZlcyBmaXJzdCBlbGVtZW50XG4gICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9O1xuICAgICAgaWYgKGNvdXJzZV9pbmZvLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb3Vyc2VfaW5mby5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gY291cnNlX2luZm9bal07XG4gICAgICAgICAgaWYgKHNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tjXVtzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdWydDJ10gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KHR0X3N0YXRlKTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZX07XG4gIH1cbn0pO1xuIiwidmFyIFNsb3RNYW5hZ2VyID0gcmVxdWlyZSgnLi9zbG90X21hbmFnZXInKTtcbnZhciBQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9wYWdpbmF0aW9uJyk7XG52YXIgVXBkYXRlVGltZXRhYmxlc1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsL3RpbWV0YWJsZV91dGlsJyk7XG52YXIgTmV3UGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vbmV3X3BhZ2luYXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSldLFxuXG4gIG5leHRUaW1ldGFibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggKyAxIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ICsgMX0pO1xuICAgIH1cbiAgfSxcblxuICBwcmV2VGltZXRhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudF9pbmRleDogdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMX0pO1xuICAgIH0gICAgXG4gIH0sXG5cbiAgc2V0SW5kZXg6IGZ1bmN0aW9uKG5ld19pbmRleCkge1xuICAgIHJldHVybihmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIGdldFNoYXJlTGluazogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpbmsgPSB3aW5kb3cubG9jYXRpb24uaG9zdCArIFwiL1wiO1xuICAgIHZhciBkYXRhID0gVXRpbC5nZXRMaW5rRGF0YSh0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgpO1xuICAgIHJldHVybiBsaW5rICsgZGF0YTtcbiAgfSxcblxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGU9e3RoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfS8+KTtcbiAgICAgIHZhciBsb2FkZXIgPSAhdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6XG4gICAgICAoICA8ZGl2IGNsYXNzTmFtZT1cInNwaW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDFcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDJcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDNcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDRcIj48L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVjdDVcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+KVxuICAgICAgcmV0dXJuIChcblxuICAgICAgICAgIDxkaXYgaWQ9XCJjYWxlbmRhclwiIGNsYXNzTmFtZT1cImZjIGZjLWx0ciBmYy11bnRoZW1lZFwiPlxuICAgICAgICAgICAgICB7bG9hZGVyfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRvb2xiYXJcIj5cbiAgICAgICAgICAgICAgICA8UGFnaW5hdGlvbiBcbiAgICAgICAgICAgICAgICAgIGNvdW50PXt0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RofSBcbiAgICAgICAgICAgICAgICAgIG5leHQ9e3RoaXMubmV4dFRpbWV0YWJsZX0gXG4gICAgICAgICAgICAgICAgICBwcmV2PXt0aGlzLnByZXZUaW1ldGFibGV9XG4gICAgICAgICAgICAgICAgICBzZXRJbmRleD17dGhpcy5zZXRJbmRleH1cbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg9e3RoaXMuc3RhdGUuY3VycmVudF9pbmRleH0vPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSByaWdodCBjYWxlbmRhci1mdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgZGF0YS1jbGlwYm9hcmQtdGV4dD17dGhpcy5nZXRTaGFyZUxpbmsoKX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmdWktY2xpcFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jbGVhclwiPjwvZGl2PlxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtYmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLW1vblwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdHVlXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy13ZWRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXRodVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtZnJpXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1zbGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTJwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjNwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj40cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjZwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj43cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJ3aWRnZXQtaHJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCIgaWQ9XCJzbG90LW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nsb3RfbWFuYWdlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpcCA9IG5ldyBDbGlwYm9hcmQoJy5jYWxlbmRhci1mdW5jdGlvbicpO1xuICAgIGNsaXAub24oJ3N1Y2Nlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJMaW5rIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgaWYodHlwZW9mKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc2F2ZSBuZXdseSBnZW5lcmF0ZWQgY291cnNlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgICAgIHZhciBuZXdfZGF0YSA9IFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zLCBcbiAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0YScsIG5ld19kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkYXRhJyk7XG4gICAgICB9XG4gICAgfSBcblxuICB9LFxuXG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt2aXNpYmxlOiB0cnVlfTtcblx0fSxcdFx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLnZpc2libGUpIHtyZXR1cm4gbnVsbDt9XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdC13cmFwcGVyIHRvYXN0aW5nXCI+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdFwiPnt0aGlzLnByb3BzLmNvbnRlbnR9PC9kaXY+XG5cdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5fcmVhY3RJbnRlcm5hbEluc3RhbmNlKSB7IC8vIGlmIG1vdW50ZWQgc3RpbGxcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7dmlzaWJsZTogZmFsc2V9KTtcblx0XHRcdH1cblx0XHR9LmJpbmQodGhpcyksIDQwMDApO1xuXHR9LFxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRMaW5rRGF0YTogZnVuY3Rpb24oY291cnNlc190b19zZWN0aW9ucywgaW5kZXgpIHtcblx0ICAgIHZhciBkYXRhID0gaW5kZXggKyBcIiZcIjtcblx0ICAgIHZhciBjX3RvX3MgPSBjb3Vyc2VzX3RvX3NlY3Rpb25zO1xuXHQgICAgZm9yICh2YXIgY291cnNlX2lkIGluIGNfdG9fcykge1xuXHQgICAgICBkYXRhICs9IGNvdXJzZV9pZDtcblx0ICAgICAgdmFyIG1hcHBpbmcgPSBjX3RvX3NbY291cnNlX2lkXTtcblx0ICAgICAgZm9yICh2YXIgc2VjdGlvbl9oZWFkaW5nIGluIG1hcHBpbmcpIHsgLy8gaS5lICdMJywgJ1QnLCAnUCcsICdTJ1xuXHQgICAgICAgIGlmIChtYXBwaW5nW3NlY3Rpb25faGVhZGluZ10gIT0gXCJcIikge1xuXHQgICAgICAgICAgZGF0YSArPSBcIitcIiArIG1hcHBpbmdbc2VjdGlvbl9oZWFkaW5nXTsgLy8gZGVsaW1pdGVyIGZvciBzZWN0aW9ucyBsb2NrZWRcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgZGF0YSArPSBcIiZcIjsgLy8gZGVsaW1pdGVyIGZvciBjb3Vyc2VzXG5cdCAgICB9XG5cdCAgICBkYXRhID0gZGF0YS5zbGljZSgwLCAtMSk7XG5cdCAgICBpZiAoZGF0YS5sZW5ndGggPCAzKSB7ZGF0YSA9IFwiXCI7fVxuXHQgICAgcmV0dXJuIGRhdGE7XG5cdH0sXG59XG4iXX0=
