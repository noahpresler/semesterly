(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  [
  "updateCourses",
  "updatePreferences",
  "loadPresetTimetable",
  "setSchool",
  "setLoading",
  "setDoneLoading",
  "setCurrentIndex",
  ]
);

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
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

},{"./actions/update_timetables":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/root.jsx"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
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

},{"./preference_menu":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/search_bar.jsx"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
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

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
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
			CourseActions.getCourseInfo(this.props.school, course_id);
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

},{"./actions/course_actions":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/course_info.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
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

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');
var Sidebar = require('./side_bar');
var SimpleModal = require('./simple_modal');
var SchoolList = require('./school_list');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],
  sidebar_collapsed: true,


  render: function() {
    var Modal = Boron['OutlineModal'];
    var school_selector = null;

    if (this.state.school == "") {
      school_selector = (
      React.createElement(SimpleModal, {header: "Semester.ly | Welcome", 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: React.createElement(SchoolList, {setSchool: this.setSchool})})
      );}
    return (
      React.createElement("div", {id: "root"}, 
        school_selector, 
        React.createElement("div", {id: "toast-container"}), 
        React.createElement("div", {id: "semesterly-name"}, "Semester.ly"), 
        React.createElement("div", {id: "control-bar-container"}, 
          React.createElement(ControlBar, {toggleModal: this.toggleCourseModal})
        ), 
        React.createElement("div", {id: "navicon", onClick: this.toggleSideModal}, 
          React.createElement("span", null), React.createElement("span", null), React.createElement("span", null)
        ), 
        React.createElement("div", {id: "modal-container"}, 
          React.createElement(Modal, {closeOnClick: true, ref: "OutlineModal", className: "course-modal"}, 
              React.createElement(ModalContent, {school: this.state.school})
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
        course_actions.getCourseInfo(this.state.school, course_id);
    }.bind(this); 
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

},{"./actions/course_actions":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/modal_content.jsx","./school_list":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/school_list.jsx","./side_bar":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/side_bar.jsx","./simple_modal":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/toast_store.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/timetable.jsx"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/school_list.jsx":[function(require,module,exports){
TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({displayName: "exports",

	render: function() {
		return 	(
			React.createElement("div", {className: "school-list"}, 
				React.createElement("div", {className: "school-picker school-uoft"}, 
					React.createElement("img", {src: "/static/img/school_logos/uoft_logo.png", 
						className: "school-logo", 
			             onClick: this.setSchool("uoft")})
				), 
				React.createElement("div", {className: "school-picker school-jhu"}, 
					React.createElement("img", {src: "/static/img/school_logos/jhu_logo.png", 
						className: "school-logo", 
			             onClick: this.setSchool("jhu")})
				)
			));
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

},{"./actions/update_timetables":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
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
      courses:[],
      results: [],
      focused: false,
    };
  },

  componentWillUpdate: function(new_props, new_state) {
    if (new_state.school != this.state.school) {
      this.getCourses(new_state.school);
    }

  },
  getCourses: function(school) {
    TimetableActions.setLoading();
    $.get("/courses/" + school + "/" + _SEMESTER, 
        {}, 
        function(response) {
          this.setState({courses: response});
          TimetableActions.setDoneLoading();

        }.bind(this)
    );
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
    var results = this.state.courses.filter(function(c) {
      return (c.code.toLowerCase().indexOf(query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1);
    });
    return results;
  },


});

},{"./actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
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

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.props.timetables.length > 0) {
      var slots = this.props.timetables[0].courses.map(function(course) {
        return React.createElement(RosterSlot, React.__spread({},  course, {toggleModal: this.props.toggleModal, key: course.code}))
      }.bind(this));
    } else {
      slots = null;
    }
    var tt = this.props.timetables.length > 0 ? this.props.timetables[0] : null;
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
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
     if (this.state.timetables.length > 0) {
      textbooks = []
       for (i=0; i < this.state.timetables[this.state.current_index].courses.length; i++)  {
          for(j=0; j < this.state.timetables[this.state.current_index].courses[i].textbooks.length; j++) {
            textbooks.push(this.state.timetables[this.state.current_index].courses[i].textbooks[j])
          }
       }
       var tb_elements = textbooks.map(function(tb) {
          return ( 
            React.createElement("div", {className: "textbook", key: tb['id']}, 
                React.createElement("img", {height: "125", src: tb['image_url']}), 
                React.createElement("div", {className: "module"}, 
                  React.createElement("h6", {className: "line-clamp"}, tb['title'])
                  ), 
                React.createElement("a", {href: tb['detail_url'], target: "_blank"}, 
                  React.createElement("img", {src: "https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif", width: "120", height: "28", border: "0"})
                )
            ));
       }.bind(this));
    } else {
      var tb_elements = null;
    }
    return (
      React.createElement("div", {className: "roster-container"}, 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Textbooks")
        ), 
        React.createElement("div", {className: "course-roster"}, 
            tb_elements
        )
      )
    )
  }
})

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    return (
      React.createElement("div", {ref: "sidebar", className: "side-container side-collapsed flexzone"}, 
        React.createElement(CourseRoster, {toggleModal: this.props.toggleModal, timetables: this.state.timetables}), 
        React.createElement(TextbookRoster, null)
      )
    )
  }
});

},{"./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
module.exports = React.createClass({displayName: "exports",
	
	render: function() {
		return (
			React.createElement("div", null, 
			 	React.createElement("div", {id: "dim-screen"}), 
				React.createElement("div", {className: "simple-modal", style: this.props.styles}, 
					React.createElement("h6", {className: "simple-modal-header"}, this.props.header), 
					React.createElement("hr", {className: "simple-modal-separator"}), 
					React.createElement("div", {className: "simple-modal-content"}, 
						this.props.content
					)
				)
			)

		);
	},

});

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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

        if (this.props.num_conflicts > 1) {
            console.log(this.props.time_start, this.props.time_end, this.props.num_conflicts)
        }
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
        if (this.props.school == "uoft") {
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

},{"./actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
var course_actions = require('../actions/course_actions.js');

module.exports = Reflux.createStore({
  listenables: [course_actions],

  getCourseInfo: function(school, course_id) {
    this.trigger({loading: true});
    $.get("/courses/"+ school + "/id/" + course_id, 
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

},{"../actions/course_actions.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/toast.jsx"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
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

SCHOOL_LIST = ["jhu", "uoft"];


module.exports = Reflux.createStore({
  listenables: [actions],
  courses_to_sections: {},
  getInitialState: function() {
    return {
      timetables: [], 
      courses_to_sections: {}, 
      current_index: -1, 
      conflict_error: false,
      loading: false,
      school: ""};
  },

  setSchool: function(new_school) {
    var school = SCHOOL_LIST.indexOf(new_school) > -1 ? new_school : "";
    var new_state = this.getInitialState();
    tt_state.school = school;
    new_state.school = school;
    this.trigger(new_state);
  },
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
          var replaced = this.getInitialState();
          replaced.school = tt_state.school;
          this.trigger(replaced);
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
    this.trigger({loading: true});
    $.post('/timetable/', JSON.stringify(new_state), function(response) {
        if (response.error) { // error from URL or local storage
          localStorage.removeItem('data');
          tt_state.courses_to_sections = {};
          var replaced = this.getInitialState();
          replaced.school = tt_state.school;
          this.trigger(replaced);
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
    var courses = url_data.split("&");
    var school = courses.shift();
    this.trigger({loading: true, school: school});
    tt_state.school = school;
    tt_state.index = parseInt(courses.shift());
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

  setLoading: function() {
    this.trigger({loading: true});
  },
  setDoneLoading: function() {
    this.trigger({loading: false});
  },

  setCurrentIndex: function(new_index) {
    this.trigger({current_index: new_index});
  },


});

},{"../actions/toast_actions.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');
var Util = require('./util/timetable_util');
var NewPagination = require('./new_pagination');

module.exports = React.createClass({displayName: "exports",
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  setIndex: function(new_index) {
    return(function () {
      if (new_index >= 0 && new_index < this.state.timetables.length) {
        TimetableActions.setCurrentIndex(new_index);
      }
    }.bind(this));
  },

  getShareLink: function() {
    var link = window.location.host + "/";
    var data = Util.getLinkData(this.state.school,
      this.state.courses_to_sections,
      this.state.current_index);
    return link + data;
  },


  render: function() {
      var slot_manager = this.state.timetables.length == 0 ? null :
       (React.createElement(SlotManager, {toggleModal: this.props.toggleModal, 
                     timetable: this.state.timetables[this.state.current_index], 
                     courses_to_sections: this.state.courses_to_sections, 
                     school: this.state.school}));
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
                  next: this.setIndex(this.state.current_index + 1), 
                  prev: this.setIndex(this.state.current_index - 1), 
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
        var new_data = Util.getLinkData(this.state.school, 
          this.state.courses_to_sections, 
          this.state.current_index);
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});

},{"./actions/toast_actions":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
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

},{}],"/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
module.exports = {
	getLinkData: function(school, courses_to_sections, index) {
	    var data = school + "&" + index + "&";
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

},{}]},{},["/Users/Felix/Documents/code/projects/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zLmpzIiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzIiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcyIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FwcC5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9jb250cm9sX2Jhci5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9ldmFsdWF0aW9ucy5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9sb2FkZXIuanN4IiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbW9kYWxfY29udGVudC5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9uZXdfcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9wYWdpbmF0aW9uLmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3ByZWZlcmVuY2VfbWVudS5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9yb290LmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NjaG9vbF9saXN0LmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NlYXJjaF9iYXIuanN4IiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VjdGlvbl9zbG90LmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpZGVfYmFyLmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3NpbXBsZV9tb2RhbC5qc3giLCIvVXNlcnMvRmVsaXgvRG9jdW1lbnRzL2NvZGUvcHJvamVjdHMvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL2NvdXJzZV9pbmZvLmpzIiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3RvYXN0X3N0b3JlLmpzIiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL0ZlbGl4L0RvY3VtZW50cy9jb2RlL3Byb2plY3RzL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdGltZXRhYmxlLmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RvYXN0LmpzeCIsIi9Vc2Vycy9GZWxpeC9Eb2N1bWVudHMvY29kZS9wcm9qZWN0cy9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3V0aWwvdGltZXRhYmxlX3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxhQUFhLENBQUM7Q0FDaEI7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkM7RUFDQSxlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLHFCQUFxQjtFQUNyQixXQUFXO0VBQ1gsWUFBWTtFQUNaLGdCQUFnQjtFQUNoQixpQkFBaUI7R0FDaEI7Q0FDRixDQUFDOzs7QUNWRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FB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Q0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFBLEVBQUEsb0JBQUEsTUFBSyxFQUFBLElBQUMsRUFBQSxLQUFVLENBQUssQ0FBQSxFQUFBO3NDQUN2RSxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLFVBQVcsQ0FBQSxFQUFBO3NDQUN2QixvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1DQUFvQyxDQUFLLENBQUEsRUFBQTtzQ0FDdkQsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBb0IsQ0FBSyxDQUFBO29DQUNwQyxDQUFBLEVBQUE7b0NBQ0wsb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtzQ0FDRixvQkFB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SUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2hDO0dBQ0QsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEIsRUFBRTs7Q0FFRCxDQUFDLENBQUM7OztBQ3BCSCxNQUFNLENBQUMsT0FBTyxHQUFHO0NBQ2hCLFdBQVcsRUFBRSxTQUFTLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUU7S0FDdEQsSUFBSSxJQUFJLEdBQUcsTUFBTSxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO0tBQ3RDLElBQUksTUFBTSxHQUFHLG1CQUFtQixDQUFDO0tBQ2pDLEtBQUssSUFBSSxTQUFTLElBQUksTUFBTSxFQUFFO0FBQ25DLE9BQU8sSUFBSSxJQUFJLFNBQVMsQ0FBQzs7T0FFbEIsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQ2hDLEtBQUssSUFBSSxlQUFlLElBQUksT0FBTyxFQUFFO1NBQ25DLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtXQUNsQyxJQUFJLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztVQUN4QztRQUNGO09BQ0QsSUFBSSxJQUFJLEdBQUcsQ0FBQztNQUNiO0tBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztLQUNqQyxPQUFPLElBQUksQ0FBQztFQUNmO0NBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIFwic2V0U2Nob29sXCIsXG4gIFwic2V0TG9hZGluZ1wiLFxuICBcInNldERvbmVMb2FkaW5nXCIsXG4gIFwic2V0Q3VycmVudEluZGV4XCIsXG4gIF1cbik7XG4iLCJ2YXIgUm9vdCA9IHJlcXVpcmUoJy4vcm9vdCcpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbl9TRU1FU1RFUiA9IFwiU1wiO1xuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxSb290IC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZScpXG4pO1xuXG52YXIgZGF0YSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdWJzdHJpbmcoMSk7IC8vIGxvYWRpbmcgdGltZXRhYmxlIGRhdGEgZnJvbSB1cmxcbmlmICghZGF0YSAmJiB0eXBlb2YoU3RvcmFnZSkgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZGlkbid0IGZpbmQgaW4gVVJMLCB0cnkgbG9jYWwgc3RvcmFnZVxuICAgIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZGF0YScpO1xufSBcbmlmIChkYXRhKSB7XG5cdFRpbWV0YWJsZUFjdGlvbnMubG9hZFByZXNldFRpbWV0YWJsZShkYXRhKTtcbn1cbiIsInZhciBTZWFyY2hCYXIgPSByZXF1aXJlKCcuL3NlYXJjaF9iYXInKTtcbnZhciBQcmVmZXJlbmNlTWVudSA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZV9tZW51Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhclwiPlxuICAgICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2VhcmNoQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFByZWZlcmVuY2VNZW51IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICk7XG4gIH0sXG59KTtcbiIsInZhciBFdmFsdWF0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZCA/IFwiZXZhbC1pdGVtIHNlbGVjdGVkXCIgOiBcImV2YWwtaXRlbVwiXG5cdFx0dmFyIGRldGFpbHMgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwiZGV0YWlsc1wiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS5zdW1tYXJ5LnJlcGxhY2UoL1xcdTAwYTAvZywgXCIgXCIpfTwvZGl2PlxuXHRcdFx0KVxuXHRcdHZhciBwcm9mID0gIXRoaXMucHJvcHMuc2VsZWN0ZWQgPyBudWxsIDogKFxuXHRcdFx0PGRpdiBpZD1cInByb2ZcIj5Qcm9mZXNzb3I6IHt0aGlzLnByb3BzLmV2YWxfZGF0YS5wcm9mZXNzb3J9PC9kaXY+XG5cdFx0XHQpXG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5wcm9wcy5zZWxlY3Rpb25DYWxsYmFja30gPlxuXHRcdFx0PGRpdiBpZD1cImV2YWwtd3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInllYXJcIj57dGhpcy5wcm9wcy5ldmFsX2RhdGEueWVhcn08L2Rpdj5cblx0XHRcdFx0e3Byb2Z9XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicmF0aW5nLXdyYXBwZXJcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInN0YXItcmF0aW5ncy1zcHJpdGVcIj5cblx0XHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7d2lkdGg6IDEwMCp0aGlzLnByb3BzLmV2YWxfZGF0YS5zY29yZS81ICsgXCIlXCJ9fSBjbGFzc05hbWU9XCJyYXRpbmdcIj48L3NwYW4+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJudW1lcmljLXJhdGluZ1wiPntcIihcIiArIHRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlICsgXCIpXCJ9PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7ZGV0YWlsc31cblx0XHQ8L2Rpdj4pO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5kZXhfc2VsZWN0ZWQ6IG51bGxcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBldmFscyA9IHRoaXMucHJvcHMuZXZhbF9pbmZvLm1hcChmdW5jdGlvbihlKSB7XG5cdFx0XHRpKys7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBpID09IHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQ7XG5cdFx0XHRyZXR1cm4gKDxFdmFsdWF0aW9uIGV2YWxfZGF0YT17ZX0ga2V5PXtlLmlkfSBzZWxlY3Rpb25DYWxsYmFjaz17dGhpcy5jaGFuZ2VTZWxlY3RlZChpKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkfSAvPik7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgY2xpY2tfbm90aWNlID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gY291cnNlIGV2YWx1YXRpb25zIGZvciB0aGlzIGNvdXJzZSB5ZXQ8L2Rpdj4pIDogKDxkaXYgaWQ9XCJjbGljay1pbnRyb1wiPkNsaWNrIGFuIGV2YWx1YXRpb24gaXRlbSBhYm92ZSB0byByZWFkIHRoZSBjb21tZW50czwvZGl2Pik7XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZXZhbHVhdGlvbnNcIj5cblx0XHRcdDxoNj5Db3Vyc2UgRXZhbHVhdGlvbnM6PC9oNj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdHtldmFsc31cblx0XHRcdDwvZGl2PlxuXHRcdFx0e2NsaWNrX25vdGljZX1cblx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdGNoYW5nZVNlbGVjdGVkOiBmdW5jdGlvbihlX2luZGV4KSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluZGV4X3NlbGVjdGVkID09IGVfaW5kZXgpIFxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogbnVsbH0pO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtpbmRleF9zZWxlY3RlZDogZV9pbmRleH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH1cbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsb2FkXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlLWdyaWRcIj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlMVwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUyXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTNcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNFwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU1XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTZcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlN1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU4XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTlcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG59KTtcblxuIiwidmFyIExvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG52YXIgQ291cnNlSW5mb1N0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvY291cnNlX2luZm8nKTtcbnZhciBFdmFsdWF0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vZXZhbHVhdGlvbnMuanN4Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIENvdXJzZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvY291cnNlX2FjdGlvbnMnKTtcbnZhciBTZWN0aW9uU2xvdCA9IHJlcXVpcmUoJy4vc2VjdGlvbl9zbG90LmpzeCcpXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtSZWZsdXguY29ubmVjdChDb3Vyc2VJbmZvU3RvcmUpXSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsb2FkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyA8TG9hZGVyIC8+IDogbnVsbDtcblx0XHR2YXIgaGVhZGVyID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0SGVhZGVyKClcblx0XHR2YXIgZGVzY3JpcHRpb24gPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXREZXNjcmlwdGlvbigpXG5cdFx0dmFyIGV2YWx1YXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0RXZhbHVhdGlvbnMoKVxuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFJlY29tZW5kYXRpb25zKClcblx0XHR2YXIgdGV4dGJvb2tzID10aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRUZXh0Ym9va3MoKVxuXHRcdHZhciBzZWN0aW9ucyA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFNlY3Rpb25zKClcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD1cIm1vZGFsLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICB7bG9hZGVyfVxuICAgICAgICAgICAgICAgIHtoZWFkZXJ9XG4gICAgICAgICAgICAgICAge2Rlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgIHtldmFsdWF0aW9uc31cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnN9XG4gICAgICAgICAgICAgICAge3RleHRib29rc31cbiAgICAgICAgICAgICAgICB7cmVjb21lbmRhdGlvbnN9XG4gICAgICAgICAgICA8L2Rpdj4pO1xuXHR9LFxuXG5cdGdldEhlYWRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhlYWRlciA9ICg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWhlYWRlclwiPlxuXHRcdFx0PGRpdiBpZD1cImNvdXJzZS1pbmZvLXdyYXBwZXJcIj5cblx0XHRcdFx0PGRpdiBpZD1cIm5hbWVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5uYW1lfTwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY29kZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGV9PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImNvdXJzZS1hY3Rpb24gZnVpLXBsdXNcIiBvbkNsaWNrPXt0aGlzLmFkZENvdXJzZSgpfS8+XG5cdFx0PC9kaXY+KVxuXHRcdHJldHVybiBoZWFkZXJcblx0fSxcblxuXHRhZGRDb3Vyc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IGZhbHNlfSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxuXHRvcGVuUmVjb21lbmRhdGlvbjogZnVuY3Rpb24oY291cnNlX2lkKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdENvdXJzZUFjdGlvbnMuZ2V0Q291cnNlSW5mbyh0aGlzLnByb3BzLnNjaG9vbCwgY291cnNlX2lkKTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cdGdldERlc2NyaXB0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZGVzY3JpcHRpb24gPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2UtZGVzY3JpcHRpb25cIj5cblx0XHRcdFx0PGg2PkRlc2NyaXB0aW9uOjwvaDY+XG5cdFx0XHRcdHt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmRlc2NyaXB0aW9ufVxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiBkZXNjcmlwdGlvbjtcblx0fSxcblxuXHRnZXRFdmFsdWF0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIDxFdmFsdWF0aW9uTWFuYWdlciBldmFsX2luZm89e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZXZhbF9pbmZvfSAvPlxuXHR9LFxuXG5cdGdldFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVsYXRlZCA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLnNsaWNlKDAsMykubWFwKGZ1bmN0aW9uKHJjKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInJlY29tbWVuZGF0aW9uXCIgb25DbGljaz17dGhpcy5vcGVuUmVjb21lbmRhdGlvbihyYy5pZCl9IGtleT17cmMuaWR9PlxuICAgICAgICAgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiY2VudGVyLXdyYXBwZXJcIj5cblx0ICAgICAgICAgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwicmVjLXdyYXBwZXJcIj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJuYW1lXCI+e3JjLm5hbWV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHRcdDxkaXYgY2xhc3NOYW1lPVwiY29kZVwiPntyYy5jb2RlfTwvZGl2PlxuXHRcdCAgICAgICAgICAgIFx0PC9kaXY+XG5cdFx0ICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcdDwvZGl2PilcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgcmVjb21lbmRhdGlvbnMgPSB0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnJlbGF0ZWRfY291cnNlcy5sZW5ndGggPT0gMCA/IG51bGwgOlxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIj5cblx0XHRcdFx0PGg2PkNvdXJzZXMgWW91IE1pZ2h0IExpa2U6PC9oNj5cblx0XHRcdFx0PGRpdiBpZD1cImNvdXJzZS1yZWNvbWVuZGF0aW9uc1wiPlxuXHRcdFx0XHRcdHtyZWxhdGVkfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pilcblx0XHRyZXR1cm4gcmVjb21lbmRhdGlvbnNcblx0fSxcblxuXHRleHBhbmRSZWNvbWVuZGF0aW9uczogZnVuY3Rpb24oKSB7XG5cblx0fSxcblxuXHRnZXRUZXh0Ym9va3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZXh0Ym9va19lbGVtZW50cyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubWFwKGZ1bmN0aW9uKHRiKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgXHQ8ZGl2IGNsYXNzTmFtZT1cInRleHRib29rXCIga2V5PXt0Yi5pZH0+XG4gICAgICAgICAgICBcdFx0PGltZyBoZWlnaHQ9XCIxMjVcIiBzcmM9e3RiLmltYWdlX3VybH0vPlxuICAgICAgICAgICAgXHRcdDxoNj57dGIudGl0bGV9PC9oNj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2Pnt0Yi5hdXRob3J9PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGRpdj5JU0JOOnt0Yi5pc2JufTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxhIGhyZWY9e3RiLmRldGFpbF91cmx9IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgXHRcdFx0PGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgIFx0XHQ8L2E+XG4gICAgICAgICAgICBcdDwvZGl2Pik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHRleHRib29rcyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gdGV4dGJvb2tzIHlldCBmb3IgdGhpcyBjb3Vyc2U8L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pik7XG5cdFx0dmFyIHJldCA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS10ZXh0Ym9va3NcIj5cblx0XHRcdFx0PGg2PlRleHRib29rczo8L2g2PlxuXHRcdFx0XHR7dGV4dGJvb2tzfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgRiA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfRi5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3MuaWR9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgUyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8uc2VjdGlvbnNfUy5tYXAoZnVuY3Rpb24ocyl7XG5cdFx0XHRyZXR1cm4gKDxTZWN0aW9uU2xvdCBrZXk9e3MuaWR9IGFsbF9zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TX29ianN9IHNlY3Rpb249e3N9Lz4pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiYWxsLXNlY3Rpb25zLXdyYXBwZXJcIj5cblx0XHRcdFx0XHR7Rn1cblx0XHRcdFx0XHR7U31cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHNlY3Rpb25zXG5cdH0sXG5cblxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICAgIFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFx0dmFyIG9wdGlvbnMgPSBbXSwgY291bnQgPSB0aGlzLnByb3BzLmNvdW50LCBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4O1xuICAgIFx0aWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIFx0dmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgXHR2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBcdGZvciAodmFyIGkgPSBmaXJzdDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgXHQgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBcdFx0b3B0aW9ucy5wdXNoKFxuICAgICAgICBcdFx0PGxpIGtleT17aX0gY2xhc3NOYW1lPXtcInNlbS1wYWdlIFwiICsgY2xhc3NOYW1lfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT5cbiAgICAgICAgICAgICBcdFx0IHtpICsgMX1cbiAgICAgICBcdFx0XHQ8L2xpPik7XG4gIFx0XHR9XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb25cIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLXByZXZcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtbGVmdCBzZW0tcGFnaW5hdGlvbi1wcmV2IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLnByZXZ9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxvbCBjbGFzc05hbWU9XCJzZW0tcGFnZXNcIj5cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0PC9vbD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLm5leHR9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdiBuYXYtZG91YmxlIG5hdi1kb3VibGUtbmV4dFwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyA5LCBjb3VudCk7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17Y2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgPGEgb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+e2kgKyAxfTwvYT5cbiAgICAgICAgPC9saT4pO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbiBwYWdpbmF0aW9uLW1pbmltYWxcIj5cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwicHJldi1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2aW91c1wiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctbGVmdCBwYWdpbmF0aW9uLWJ0blwiIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIHtvcHRpb25zfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dFwiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctcmlnaHQgcGFnaW5hdGlvbi1idG5cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHRcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG4gIFxuXG59KTsiLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIEJpbmFyeVByZWZlcmVuY2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdG9nZ2xlX2xhYmVsID0gXCJjbW4tdG9nZ2xlLVwiICsgdGhpcy5wcm9wcy50b2dnbGVfaWQ7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS1pdGVtXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10ZXh0XCI+XG4gICAgICAgICAgPGxpPiB7dGhpcy5wcm9wcy50ZXh0fSA8L2xpPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRvZ2dsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoXCI+XG4gICAgICAgICAgICA8aW5wdXQgcmVmPVwiY2hlY2tib3hfZWxlbVwiIGlkPXt0b2dnbGVfbGFiZWx9IFxuICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNtbi10b2dnbGUgY21uLXRvZ2dsZS1yb3VuZFwiIHR5cGU9XCJjaGVja2JveFwiIFxuICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMudG9nZ2xlUHJlZmVyZW5jZX0vPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9e3RvZ2dsZV9sYWJlbH0+PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZVByZWZlcmVuY2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdfdmFsdWUgPSB0aGlzLnJlZnMuY2hlY2tib3hfZWxlbS5jaGVja2VkO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlUHJlZmVyZW5jZXModGhpcy5wcm9wcy5uYW1lLCBuZXdfdmFsdWUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGN1cnJlbnRfdG9nZ2xlX2lkOiAwLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWNvbGxhcHNlXCIgPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdlwiIGlkPVwibWVudVwiPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTsiLCJ2YXIgQ29udHJvbEJhciA9IHJlcXVpcmUoJy4vY29udHJvbF9iYXInKTtcbnZhciBUaW1ldGFibGUgPSByZXF1aXJlKCcuL3RpbWV0YWJsZScpO1xudmFyIE1vZGFsQ29udGVudCA9IHJlcXVpcmUoJy4vbW9kYWxfY29udGVudCcpO1xudmFyIFRvYXN0U3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy90b2FzdF9zdG9yZS5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNpZGViYXIgPSByZXF1aXJlKCcuL3NpZGVfYmFyJyk7XG52YXIgU2ltcGxlTW9kYWwgPSByZXF1aXJlKCcuL3NpbXBsZV9tb2RhbCcpO1xudmFyIFNjaG9vbExpc3QgPSByZXF1aXJlKCcuL3NjaG9vbF9saXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSksIFJlZmx1eC5jb25uZWN0KFRvYXN0U3RvcmUpXSxcbiAgc2lkZWJhcl9jb2xsYXBzZWQ6IHRydWUsXG5cblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBNb2RhbCA9IEJvcm9uWydPdXRsaW5lTW9kYWwnXTtcbiAgICB2YXIgc2Nob29sX3NlbGVjdG9yID0gbnVsbDtcblxuICAgIGlmICh0aGlzLnN0YXRlLnNjaG9vbCA9PSBcIlwiKSB7XG4gICAgICBzY2hvb2xfc2VsZWN0b3IgPSAoXG4gICAgICA8U2ltcGxlTW9kYWwgaGVhZGVyPXtcIlNlbWVzdGVyLmx5IHwgV2VsY29tZVwifVxuICAgICAgICAgICAgICAgICAgIHN0eWxlcz17e2JhY2tncm91bmRDb2xvcjogXCIjRkRGNUZGXCIsIGNvbG9yOiBcIiMwMDBcIn19IFxuICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9ezxTY2hvb2xMaXN0IHNldFNjaG9vbD17dGhpcy5zZXRTY2hvb2x9Lz4gfS8+XG4gICAgICApO31cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInJvb3RcIj5cbiAgICAgICAge3NjaG9vbF9zZWxlY3Rvcn1cbiAgICAgICAgPGRpdiBpZD1cInRvYXN0LWNvbnRhaW5lclwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwic2VtZXN0ZXJseS1uYW1lXCI+U2VtZXN0ZXIubHk8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImNvbnRyb2wtYmFyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxDb250cm9sQmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfS8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwibmF2aWNvblwiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlU2lkZU1vZGFsfT5cbiAgICAgICAgICA8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJtb2RhbC1jb250YWluZXJcIj5cbiAgICAgICAgICA8TW9kYWwgY2xvc2VPbkNsaWNrPXt0cnVlfSByZWY9J091dGxpbmVNb2RhbCcgY2xhc3NOYW1lPVwiY291cnNlLW1vZGFsXCI+XG4gICAgICAgICAgICAgIDxNb2RhbENvbnRlbnQgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0vPlxuICAgICAgICAgIDwvTW9kYWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFsbC1jb2xzLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxTaWRlYmFyIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfS8+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8VGltZXRhYmxlIHRvZ2dsZU1vZGFsPXt0aGlzLnRvZ2dsZUNvdXJzZU1vZGFsfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cblxuXG4gIHRvZ2dsZUNvdXJzZU1vZGFsOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVmc1snT3V0bGluZU1vZGFsJ10udG9nZ2xlKCk7XG4gICAgICAgIGNvdXJzZV9hY3Rpb25zLmdldENvdXJzZUluZm8odGhpcy5zdGF0ZS5zY2hvb2wsIGNvdXJzZV9pZCk7XG4gICAgfS5iaW5kKHRoaXMpOyBcbiAgfSxcblxuXG4gIHRvZ2dsZVNpZGVNb2RhbDogZnVuY3Rpb24oKXtcbiAgICBpZiAodGhpcy5zaWRlYmFyX2NvbGxhcHNlZCkge1xuICAgICAgdGhpcy5leHBhbmRTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZVNpZGVNb2RhbCgpO1xuICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9IHRydWU7XG4gICAgfVxuICB9LFxuXG4gIGV4cGFuZFNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLmNhbC1jb250YWluZXInKS5yZW1vdmVDbGFzcygnc3F1ZWV6ZS1vdXQgZnVsbC1jYWwnKTtcbiAgICAkKCcuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnc2xpZGUtb3V0IHNpZGUtY29sbGFwc2VkJyk7XG4gICAgJCgnLnNpZGUtY29udGFpbmVyJykuYWRkQ2xhc3MoJ3NsaWRlLWluIHNpZGUtZGVwbG95ZWQnKTtcbiAgICAkKCcuY2FsLWNvbnRhaW5lcicpLmFkZENsYXNzKCdzcXVlZXplLWluIHNxdWVlemVkLWNhbCcpO1xuICB9LFxuXG4gIGNvbGxhcHNlU2lkZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAkKCcuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnc2xpZGUtaW4gc2lkZS1kZXBsb3llZCcpO1xuICAgICQoJy5jYWwtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ3NxdWVlemUtaW4gc3F1ZWV6ZWQtY2FsJyk7XG4gICAgJCgnLnNpZGUtY29udGFpbmVyJykuYWRkQ2xhc3MoJ3NsaWRlLW91dCBzaWRlLWNvbGxhcHNlZCcpO1xuICAgICQoJy5jYWwtY29udGFpbmVyJykuYWRkQ2xhc3MoJ3NxdWVlemUtb3V0IGZ1bGwtY2FsJyk7XG4gIH1cblxuXG59KTtcbiIsIlRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXHQoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1saXN0XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtdW9mdFwiPlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL3VvZnRfbG9nby5wbmdcIiBcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInNjaG9vbC1sb2dvXCJcblx0XHRcdCAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLnNldFNjaG9vbChcInVvZnRcIil9Lz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtamh1XCI+XG5cdFx0XHRcdFx0PGltZyBzcmM9XCIvc3RhdGljL2ltZy9zY2hvb2xfbG9nb3Mvamh1X2xvZ28ucG5nXCIgXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJzY2hvb2wtbG9nb1wiXG5cdFx0XHQgICAgICAgICAgICAgb25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJqaHVcIil9Lz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj4pO1xuXHR9LFxuXG5cdHNldFNjaG9vbDogZnVuY3Rpb24obmV3X3NjaG9vbCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRUaW1ldGFibGVBY3Rpb25zLnNldFNjaG9vbChuZXdfc2Nob29sKTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG59KTtcblxuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbnZhciBTZWFyY2hSZXN1bHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpX2NsYXNzID0gXCJzZWFyY2gtcmVzdWx0XCIsIGljb25fY2xhc3MgPSBcImZ1aS1wbHVzXCI7XG4gICAgaWYgKHRoaXMucHJvcHMuaW5fcm9zdGVyKSB7XG4gICAgICBsaV9jbGFzcyArPSBcIiB0b2RvLWRvbmVcIjtcbiAgICAgIGljb25fY2xhc3MgPSBcImZ1aS1jaGVja1wiO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGxpIGNsYXNzTmFtZT17bGlfY2xhc3N9IG9uTW91c2VEb3duPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuaWQpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvLWNvbnRlbnRcIj5cbiAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidG9kby1uYW1lXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb2RlfVxuICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17XCJzZWFyY2gtcmVzdWx0LWFjdGlvbiBcIiArIGljb25fY2xhc3N9IFxuICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLnRvZ2dsZUNvdXJzZX0+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVtb3ZpbmcgPSB0aGlzLnByb3BzLmluX3Jvc3RlcjtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgLy8gc3RvcCBpbnB1dCBmcm9tIHRyaWdnZXJpbmcgb25CbHVyIGFuZCB0aHVzIGhpZGluZyByZXN1bHRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gc3RvcCBwYXJlbnQgZnJvbSBvcGVuaW5nIG1vZGFsXG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb3Vyc2VzOltdLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uKG5ld19wcm9wcywgbmV3X3N0YXRlKSB7XG4gICAgaWYgKG5ld19zdGF0ZS5zY2hvb2wgIT0gdGhpcy5zdGF0ZS5zY2hvb2wpIHtcbiAgICAgIHRoaXMuZ2V0Q291cnNlcyhuZXdfc3RhdGUuc2Nob29sKTtcbiAgICB9XG5cbiAgfSxcbiAgZ2V0Q291cnNlczogZnVuY3Rpb24oc2Nob29sKSB7XG4gICAgVGltZXRhYmxlQWN0aW9ucy5zZXRMb2FkaW5nKCk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIiArIHNjaG9vbCArIFwiL1wiICsgX1NFTUVTVEVSLCBcbiAgICAgICAge30sIFxuICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2NvdXJzZXM6IHJlc3BvbnNlfSk7XG4gICAgICAgICAgVGltZXRhYmxlQWN0aW9ucy5zZXREb25lTG9hZGluZygpO1xuXG4gICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHNfZGl2ID0gdGhpcy5nZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50KCk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5wdXQtY29tYmluZVwiPlxuICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCBieSBjb2RlLCB0aXRsZSwgZGVzY3JpcHRpb24sIHByb2Zlc3NvciwgZGVncmVlXCIgXG4gICAgICAgICAgICBpZD1cInNlYXJjaC1pbnB1dFwiIFxuICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMuZm9jdXN9IG9uQmx1cj17dGhpcy5ibHVyfSBcbiAgICAgICAgICAgIG9uSW5wdXQ9e3RoaXMucXVlcnlDaGFuZ2VkfS8+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1zbGlkZXJzIGZhLTJ4IG1lbnUtaWNvblwiPjwvaT5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHNfZGl2fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmZvY3VzZWQgfHwgdGhpcy5zdGF0ZS5yZXN1bHRzLmxlbmd0aCA9PSAwKSB7cmV0dXJuIG51bGw7fVxuICAgIHZhciBpID0gMDtcbiAgICB2YXIgc2VhcmNoX3Jlc3VsdHMgPSB0aGlzLnN0YXRlLnJlc3VsdHMubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGkrKztcbiAgICAgIHZhciBpbl9yb3N0ZXIgPSB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbci5pZF0gIT0gbnVsbDtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxTZWFyY2hSZXN1bHQgey4uLnJ9IGtleT17aX0gaW5fcm9zdGVyPXtpbl9yb3N0ZXJ9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfS8+XG4gICAgICApO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtcmVzdWx0cy1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvIG1ybVwiPlxuICAgICAgICAgICAgPHVsIGlkPVwic2VhcmNoLXJlc3VsdHNcIj5cbiAgICAgICAgICAgICAge3NlYXJjaF9yZXN1bHRzfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IHRydWV9KTtcbiAgfSxcblxuICBibHVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiBmYWxzZX0pO1xuICB9LFxuXG4gIHF1ZXJ5Q2hhbmdlZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgcXVlcnkgPSBldmVudC50YXJnZXQudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgZmlsdGVyZWQgPSBxdWVyeS5sZW5ndGggPD0gMSA/IFtdIDogdGhpcy5maWx0ZXJDb3Vyc2VzKHF1ZXJ5KTtcbiAgICB0aGlzLnNldFN0YXRlKHtyZXN1bHRzOiBmaWx0ZXJlZH0pO1xuICB9LFxuXG4gIGZpbHRlckNvdXJzZXM6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgdmFyIHJlc3VsdHMgPSB0aGlzLnN0YXRlLmNvdXJzZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiAoYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cbi8vIG1hcHMgYmFzZSBjb2xvdXIgb2Ygc2xvdCB0byBjb2xvdXIgb24gaGlnaGxpZ2h0XG52YXIgY29sb3VyX3RvX2hpZ2hsaWdodCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3QgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj47XG4gICAgICAgIHZhciBwcm9mID0gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInByb2ZzXCI+e2Nvc1swXS5pbnN0cnVjdG9yc308L2Rpdj47XG4gICAgICAgIHZhciBzZWN0X3Byb2YgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdC1wcm9mXCI+e3NlY3R9e3Byb2Z9PC9kaXY+O1xuICAgICAgICByZXR1cm4gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInNlY3Rpb24td3JhcHBlclwiPntzZWN0X3Byb2Z9e2RheUFuZFRpbWVzfTwvZGl2PjtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKG8ubWVldGluZ19zZWN0aW9uID09IHRoaXMucHJvcHMuc2VjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvX29iamVjdHMucHVzaChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29fb2JqZWN0cztcbiAgICB9LFxuXG4gICAgZ2V0RGF5c0FuZFRpbWVzOiBmdW5jdGlvbihjb3MpIHtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gY29zLm1hcChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkYXktdGltZVwiIGtleT17by5pZH0+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cImR0LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIHtkYXlBbmRUaW1lc31cbiAgICAgICAgICAgIDwvZGl2PiApXG4gICAgfVxufSk7XG4iLCJ2YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpXG5cbnZhciBSb3N0ZXJTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSlcblxudmFyIENvdXJzZVJvc3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIHVzZSB0aGUgdGltZXRhYmxlIGZvciBzbG90cyBiZWNhdXNlIGl0IGNvbnRhaW5zIHRoZSBtb3N0IGluZm9ybWF0aW9uXG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc2xvdHMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0uY291cnNlcy5tYXAoZnVuY3Rpb24oY291cnNlKSB7XG4gICAgICAgIHJldHVybiA8Um9zdGVyU2xvdCB7Li4uY291cnNlfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtjb3Vyc2UuY29kZX0vPlxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2xvdHMgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgdHQgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMucHJvcHMudGltZXRhYmxlc1swXSA6IG51bGw7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm9zdGVyLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1oZWFkZXJcIj5cbiAgICAgICAgICA8aDQ+WW91ciBTZW1lc3RlcjwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXJcIj5cbiAgICAgICAgICB7c2xvdHN9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KVxuXG52YXIgVGV4dGJvb2tSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgaWYgKHRoaXMuc3RhdGUudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0ZXh0Ym9va3MgPSBbXVxuICAgICAgIGZvciAoaT0wOyBpIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlcy5sZW5ndGg7IGkrKykgIHtcbiAgICAgICAgICBmb3Ioaj0wOyBqIDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzW3RoaXMuc3RhdGUuY3VycmVudF9pbmRleF0uY291cnNlc1tpXS50ZXh0Ym9va3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHRleHRib29rcy5wdXNoKHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzW2pdKVxuICAgICAgICAgIH1cbiAgICAgICB9XG4gICAgICAgdmFyIHRiX2VsZW1lbnRzID0gdGV4dGJvb2tzLm1hcChmdW5jdGlvbih0Yikge1xuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119PlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXt0YlsnaW1hZ2VfdXJsJ119Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGJbJ3RpdGxlJ119PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlclwiPlxuICAgICAgICAgICAge3RiX2VsZW1lbnRzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9XCJzaWRlYmFyXCIgY2xhc3NOYW1lPVwic2lkZS1jb250YWluZXIgc2lkZS1jb2xsYXBzZWQgZmxleHpvbmVcIj5cbiAgICAgICAgPENvdXJzZVJvc3RlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gdGltZXRhYmxlcz17dGhpcy5zdGF0ZS50aW1ldGFibGVzfS8+XG4gICAgICAgIDxUZXh0Ym9va1Jvc3RlciAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHQgXHQ8ZGl2IGlkPVwiZGltLXNjcmVlblwiPjwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbFwiIHN0eWxlPXt0aGlzLnByb3BzLnN0eWxlc30+XG5cdFx0XHRcdFx0PGg2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1oZWFkZXJcIj57dGhpcy5wcm9wcy5oZWFkZXJ9PC9oNj5cblx0XHRcdFx0XHQ8aHIgY2xhc3NOYW1lPVwic2ltcGxlLW1vZGFsLXNlcGFyYXRvclwiLz5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdFx0XHR7dGhpcy5wcm9wcy5jb250ZW50fVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0KTtcblx0fSxcblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG4vLyBtYXBzIGJhc2UgY29sb3VyIG9mIHNsb3QgdG8gY29sb3VyIG9uIGhpZ2hsaWdodFxudmFyIGNvbG91cl90b19oaWdobGlnaHQgPSB7XG4gICAgXCIjRkQ3NDczXCIgOiBcIiNFMjZBNkFcIixcbiAgICBcIiM0NEJCRkZcIiA6IFwiIzI4QTRFQVwiLFxuICAgIFwiIzRDRDRCMFwiIDogXCIjM0RCQjlBXCIsXG4gICAgXCIjODg3MEZGXCIgOiBcIiM3MDU5RTZcIixcbiAgICBcIiNGOUFFNzRcIiA6IFwiI0Y3OTU0QVwiLFxuICAgIFwiI0Q0REJDOFwiIDogXCIjQjVCRkEzXCIsXG4gICAgXCIjRTdGNzZEXCIgOiBcIiNDNEQ0NERcIixcbiAgICBcIiNGMTgyQjRcIiA6IFwiI0RFNjk5RFwiLFxuICAgIFwiIzc0OTlBMlwiIDogXCIjNjY4Qjk0XCIsXG59IC8vIGNvbnNpZGVyICNDRjAwMEYsICNlOGZhYzNcblxuLy8gaG93IGJpZyBhIHNsb3Qgb2YgaGFsZiBhbiBob3VyIHdvdWxkIGJlLCBpbiBwaXhlbHNcbnZhciBIQUxGX0hPVVJfSEVJR0hUID0gMzA7XG5cbnZhciBTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7c2hvd19idXR0b25zOiBmYWxzZX07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwaW4gPSBudWxsLCByZW1vdmVfYnV0dG9uID0gbnVsbDtcbiAgICAgICAgdmFyIHNsb3Rfc3R5bGUgPSB0aGlzLmdldFNsb3RTdHlsZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dfYnV0dG9ucykge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMudW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGh1bWItdGFja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5jb3Vyc2UpfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9e1wic2xvdC1vdXRlciBmYy10aW1lLWdyaWQtZXZlbnQgZmMtZXZlbnQgc2xvdCBzbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2V9IFxuICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBzdHlsZSBvZiBhIHNwZWNpZmljIHNsb3QuIFNob3VsZCBzcGVjaWZ5IGF0XG4gICAgKiBsZWFzdCB0aGUgdG9wIHktY29vcmRpbmF0ZSBhbmQgaGVpZ2h0IG9mIHRoZSBzbG90LCBhcyB3ZWxsIGFzIGJhY2tncm91bmRDb2xvclxuICAgICogd2hpbGUgdGFraW5nIGludG8gYWNjb3VudCBpZiB0aGVyZSdzIGFuIG92ZXJsYXBwaW5nIGNvbmZsaWN0XG4gICAgKi9cbiAgICBnZXRTbG90U3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhcnRfaG91ciAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBzdGFydF9taW51dGUgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzFdKSxcbiAgICAgICAgICAgIGVuZF9ob3VyICAgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIGVuZF9taW51dGUgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzFdKTtcblxuICAgICAgICB2YXIgdG9wID0gKHN0YXJ0X2hvdXIgLSA4KSo1MiArIChzdGFydF9taW51dGUpKigyNi8zMCk7XG4gICAgICAgIHZhciBib3R0b20gPSAoZW5kX2hvdXIgLSA4KSo1MiArIChlbmRfbWludXRlKSooMjYvMzApIC0gMTtcbiAgICAgICAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcCAtIDI7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cyA+IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMucHJvcHMudGltZV9zdGFydCwgdGhpcy5wcm9wcy50aW1lX2VuZCwgdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzKVxuICAgICAgICB9XG4gICAgICAgIC8vIHRoZSBjdW11bGF0aXZlIHdpZHRoIG9mIHRoaXMgc2xvdCBhbmQgYWxsIG9mIHRoZSBzbG90cyBpdCBpcyBjb25mbGljdGluZyB3aXRoXG4gICAgICAgIHZhciB0b3RhbF9zbG90X3dpZHRocyA9IDk4IC0gKDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsKTtcbiAgICAgICAgLy8gdGhlIHdpZHRoIG9mIHRoaXMgcGFydGljdWxhciBzbG90XG4gICAgICAgIHZhciBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgPSB0b3RhbF9zbG90X3dpZHRocyAvIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cztcbiAgICAgICAgLy8gdGhlIGFtb3VudCBvZiBsZWZ0IG1hcmdpbiBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdCwgaW4gcGVyY2VudGFnZVxuICAgICAgICB2YXIgcHVzaF9sZWZ0ID0gKHRoaXMucHJvcHMuc2hpZnRfaW5kZXggKiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UpICsgNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKGNvbG91cl90b19oaWdobGlnaHRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb24sIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICB1bnBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogdHJ1ZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAgICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2UpXG4gICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gW1wiTVwiLCBcIlRcIiwgXCJXXCIsIFwiUlwiLCBcIkZcIl07XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB0aGlzLmdldFNsb3RzQnlEYXkoKTtcbiAgICAgICAgdmFyIGFsbF9zbG90cyA9IGRheXMubWFwKGZ1bmN0aW9uKGRheSkge1xuICAgICAgICAgICAgdmFyIGRheV9zbG90cyA9IHNsb3RzX2J5X2RheVtkYXldLm1hcChmdW5jdGlvbihzbG90KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmlzUGlubmVkKHNsb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2xvdCB7Li4uc2xvdH0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IGtleT17c2xvdC5pZH0gcGlubmVkPXtwfS8+XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17ZGF5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZXZlbnQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheV9zbG90c31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgIHthbGxfc2xvdHN9XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IHsxOiAnbW9uJywgMjogJ3R1ZScsIDM6ICd3ZWQnLCA0OiAndGh1JywgNTogJ2ZyaSd9O1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IFwiLmZjLVwiICsgZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgLy8gJChzZWxlY3RvcikuYWRkQ2xhc3MoXCJmYy10b2RheVwiKTtcbiAgICB9LFxuXG4gICAgaXNQaW5uZWQ6IGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgdmFyIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdWydDJ107XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bc2xvdC5tZWV0aW5nX3NlY3Rpb25bMF1dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yID09IHNsb3QubWVldGluZ19zZWN0aW9uO1xuICAgIH0sXG5cbiAgICBnZXRTbG90c0J5RGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHtcbiAgICAgICAgICAgICdNJzogW10sXG4gICAgICAgICAgICAnVCc6IFtdLFxuICAgICAgICAgICAgJ1cnOiBbXSxcbiAgICAgICAgICAgICdSJzogW10sXG4gICAgICAgICAgICAnRic6IFtdXG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGNvdXJzZSBpbiB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzKSB7XG4gICAgICAgICAgICB2YXIgY3JzID0gdGhpcy5wcm9wcy50aW1ldGFibGUuY291cnNlc1tjb3Vyc2VdO1xuICAgICAgICAgICAgZm9yICh2YXIgc2xvdF9pZCBpbiBjcnMuc2xvdHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2xvdCA9IGNycy5zbG90c1tzbG90X2lkXTtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29sb3VyXCJdID0gT2JqZWN0LmtleXMoY29sb3VyX3RvX2hpZ2hsaWdodClbY291cnNlXTtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29kZVwiXSA9IGNycy5jb2RlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBzbG90W1wibmFtZVwiXSA9IGNycy5uYW1lO1xuICAgICAgICAgICAgICAgIHNsb3RzX2J5X2RheVtzbG90LmRheV0ucHVzaChzbG90KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2xvdHNfYnlfZGF5O1xuICAgIH0sXG5cbn0pO1xuIiwidmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbY291cnNlX2FjdGlvbnNdLFxuXG4gIGdldENvdXJzZUluZm86IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgc2Nob29sICsgXCIvaWQvXCIgKyBjb3Vyc2VfaWQsIFxuICAgICAgICAge30sIFxuICAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2UsIGNvdXJzZV9pbmZvOiByZXNwb25zZX0pO1xuICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcblxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtjb3Vyc2VfaW5mbzogbnVsbCwgbG9hZGluZzogdHJ1ZX07XG4gIH1cbn0pO1xuIiwidmFyIFRvYXN0ID0gcmVxdWlyZSgnLi4vdG9hc3QnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW1RvYXN0QWN0aW9uc10sXG5cbiAgY3JlYXRlVG9hc3Q6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0LWNvbnRhaW5lcicpO1xuICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoY29udGFpbmVyKTtcbiAgICBSZWFjdERPTS5yZW5kZXIoXG4gICAgICA8VG9hc3QgY29udGVudD17Y29udGVudH0gLz4sXG4gICAgICBjb250YWluZXJcbiAgICApO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cblxudmFyIHR0X3N0YXRlID0ge1xuICBzY2hvb2w6IFwiamh1XCIsXG4gIHNlbWVzdGVyOiBcIlNcIixcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIHByZWZlcmVuY2VzOiB7XG4gICAgJ25vX2NsYXNzZXNfYmVmb3JlJzogZmFsc2UsXG4gICAgJ25vX2NsYXNzZXNfYWZ0ZXInOiBmYWxzZSxcbiAgICAnbG9uZ193ZWVrZW5kJzogZmFsc2UsXG4gICAgJ2dyb3VwZWQnOiBmYWxzZSxcbiAgICAnZG9fcmFua2luZyc6IGZhbHNlLFxuICAgICd0cnlfd2l0aF9jb25mbGljdHMnOiBmYWxzZVxuICB9XG59XG5cblNDSE9PTF9MSVNUID0gW1wiamh1XCIsIFwidW9mdFwiXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgIHNjaG9vbDogXCJcIn07XG4gIH0sXG5cbiAgc2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG4gICAgdmFyIHNjaG9vbCA9IFNDSE9PTF9MSVNULmluZGV4T2YobmV3X3NjaG9vbCkgPiAtMSA/IG5ld19zY2hvb2wgOiBcIlwiO1xuICAgIHZhciBuZXdfc3RhdGUgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpO1xuICAgIHR0X3N0YXRlLnNjaG9vbCA9IHNjaG9vbDtcbiAgICBuZXdfc3RhdGUuc2Nob29sID0gc2Nob29sO1xuICAgIHRoaXMudHJpZ2dlcihuZXdfc3RhdGUpO1xuICB9LFxuIC8qKlxuICAqIFVwZGF0ZSB0dF9zdGF0ZSB3aXRoIG5ldyBjb3Vyc2Ugcm9zdGVyXG4gICogQHBhcmFtIHtvYmplY3R9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uIGNvbnRhaW5zIGF0dHJpYnV0ZWQgaWQsIHNlY3Rpb24sIHJlbW92aW5nXG4gICogQHJldHVybiB7dm9pZH0gZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgdHRfc3RhdGVcbiAgKi9cbiAgdXBkYXRlQ291cnNlczogZnVuY3Rpb24obmV3X2NvdXJzZV93aXRoX3NlY3Rpb24pIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6dHJ1ZX0pO1xuXG4gICAgdmFyIHJlbW92aW5nID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24ucmVtb3Zpbmc7XG4gICAgdmFyIG5ld19jb3Vyc2VfaWQgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5pZDtcbiAgICB2YXIgc2VjdGlvbiA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb247XG4gICAgdmFyIG5ld19zdGF0ZSA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0dF9zdGF0ZSk7IC8vIGRlZXAgY29weSBvZiB0dF9zdGF0ZVxuICAgIHZhciBjX3RvX3MgPSBuZXdfc3RhdGUuY291cnNlc190b19zZWN0aW9ucztcbiAgICBcbiAgICBpZiAoIXJlbW92aW5nKSB7IC8vIGFkZGluZyBjb3Vyc2VcbiAgICAgIGlmICh0dF9zdGF0ZS5zY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9ufTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR0X3N0YXRlLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICB2YXIgbG9ja2VkX3NlY3Rpb25zID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9IC8vIHRoaXMgaXMgd2hhdCB3ZSB3YW50IHRvIHNlbmQgaWYgbm90IGxvY2tpbmdcbiAgICAgICAgaWYgKHNlY3Rpb24pIHsgLy8gbG9ja2luZ1xuICAgICAgICAgIGlmIChjX3RvX3NbbmV3X2NvdXJzZV9pZF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgbG9ja2VkX3NlY3Rpb25zID0gY190b19zW25ld19jb3Vyc2VfaWRdOyAvLyBjb3B5IHRoZSBvbGQgbWFwcGluZ1xuICAgICAgICAgICAgLy8gaW4gY2FzZSBzb21lIHNlY3Rpb25zIHdlcmUgYWxyZWFkeSBsb2NrZWQgZm9yIHRoaXMgY291cnNlLFxuICAgICAgICAgICAgLy8gYW5kIG5vdyB3ZSdyZSBhYm91dCB0byBsb2NrIGEgbmV3IG9uZS5cbiAgICAgICAgICB9XG4gICAgICAgICAgbG9ja2VkX3NlY3Rpb25zW3NlY3Rpb25bMF1dID0gc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSBsb2NrZWRfc2VjdGlvbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmluZyBjb3Vyc2VcbiAgICAgIGRlbGV0ZSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY190b19zKS5sZW5ndGggPT0gMCkgeyAvLyByZW1vdmVkIGxhc3QgY291cnNlXG4gICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gdHRfc3RhdGUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAgXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuIC8qKlxuICAqIFVwZGF0ZSB0dF9zdGF0ZSB3aXRoIG5ldyBwcmVmZXJlbmNlc1xuICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmZXJlbmNlOiB0aGUgcHJlZmVyZW5jZSB0aGF0IGlzIGJlaW5nIHVwZGF0ZWRcbiAgKiBAcGFyYW0gbmV3X3ZhbHVlOiB0aGUgbmV3IHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgcHJlZmVyZW5jZVxuICAqIEByZXR1cm4ge3ZvaWR9IGRvZXNuJ3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgdHRfc3RhdGVcbiAgKi9cbiAgdXBkYXRlUHJlZmVyZW5jZXM6IGZ1bmN0aW9uKHByZWZlcmVuY2UsIG5ld192YWx1ZSkge1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdHRfc3RhdGUpOyAvLyBkZWVwIGNvcHkgb2YgdHRfc3RhdGVcbiAgICBuZXdfc3RhdGUucHJlZmVyZW5jZXNbcHJlZmVyZW5jZV0gPSBuZXdfdmFsdWU7XG4gICAgdGhpcy5tYWtlUmVxdWVzdChuZXdfc3RhdGUpO1xuICB9LFxuXG4gIC8vIE1ha2VzIGEgUE9TVCByZXF1ZXN0IHRvIHRoZSBiYWNrZW5kIHdpdGggdHRfc3RhdGVcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uKG5ld19zdGF0ZSkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgICQucG9zdCgnL3RpbWV0YWJsZS8nLCBKU09OLnN0cmluZ2lmeShuZXdfc3RhdGUpLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHsgLy8gZXJyb3IgZnJvbSBVUkwgb3IgbG9jYWwgc3RvcmFnZVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkYXRhJyk7XG4gICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gdHRfc3RhdGUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAvLyBzdG9wIHByb2Nlc3NpbmcgaGVyZVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdHRfc3RhdGUgPSBuZXdfc3RhdGU7IC8vb25seSB1cGRhdGUgc3RhdGUgaWYgc3VjY2Vzc2Z1bFxuICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgaWYgKG5ld19zdGF0ZS5pbmRleCAmJiBuZXdfc3RhdGUuaW5kZXggPCByZXNwb25zZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGluZGV4ID0gbmV3X3N0YXRlLmluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIG5ld19zdGF0ZVsnaW5kZXgnXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMgIT0ge30pIHsgLy8gY29uZmxpY3RcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBjb25mbGljdF9lcnJvcjogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlRoYXQgY291cnNlIGNhdXNlZCBhIGNvbmZsaWN0ISBUcnkgYWdhaW4gd2l0aCB0aGUgQWxsb3cgQ29uZmxpY3RzIHByZWZlcmVuY2UgdHVybmVkIG9uLlwiKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cblxuICBsb2FkUHJlc2V0VGltZXRhYmxlOiBmdW5jdGlvbih1cmxfZGF0YSkge1xuICAgIHZhciBjb3Vyc2VzID0gdXJsX2RhdGEuc3BsaXQoXCImXCIpO1xuICAgIHZhciBzY2hvb2wgPSBjb3Vyc2VzLnNoaWZ0KCk7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlLCBzY2hvb2w6IHNjaG9vbH0pO1xuICAgIHR0X3N0YXRlLnNjaG9vbCA9IHNjaG9vbDtcbiAgICB0dF9zdGF0ZS5pbmRleCA9IHBhcnNlSW50KGNvdXJzZXMuc2hpZnQoKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3Vyc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IHBhcnNlSW50KGNvdXJzZXNbaV0pO1xuICAgICAgdmFyIGNvdXJzZV9pbmZvID0gY291cnNlc1tpXS5zcGxpdChcIitcIik7XG4gICAgICBjb3Vyc2VfaW5mby5zaGlmdCgpOyAvLyByZW1vdmVzIGZpcnN0IGVsZW1lbnRcbiAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbY10gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiAnJ307XG4gICAgICBpZiAoY291cnNlX2luZm8ubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvdXJzZV9pbmZvLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHNlY3Rpb24gPSBjb3Vyc2VfaW5mb1tqXTtcbiAgICAgICAgICBpZiAoc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdW3NlY3Rpb25bMF1dID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc2Nob29sID09IFwiamh1XCIpIHtcbiAgICAgICAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbY11bJ0MnXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QodHRfc3RhdGUpO1xuICB9LFxuXG4gIHNldExvYWRpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICB9LFxuICBzZXREb25lTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICB9LFxuXG4gIHNldEN1cnJlbnRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBTbG90TWFuYWdlciA9IHJlcXVpcmUoJy4vc2xvdF9tYW5hZ2VyJyk7XG52YXIgUGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vcGFnaW5hdGlvbicpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy90b2FzdF9hY3Rpb25zJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC90aW1ldGFibGVfdXRpbCcpO1xudmFyIE5ld1BhZ2luYXRpb24gPSByZXF1aXJlKCcuL25ld19wYWdpbmF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBzZXRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgcmV0dXJuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChuZXdfaW5kZXggPj0gMCAmJiBuZXdfaW5kZXggPCB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q3VycmVudEluZGV4KG5ld19pbmRleCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRTaGFyZUxpbms6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIjtcbiAgICB2YXIgZGF0YSA9IFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsXG4gICAgICB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgpO1xuICAgIHJldHVybiBsaW5rICsgZGF0YTtcbiAgfSxcblxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGU9e3RoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgICAgICAgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0vPik7XG4gICAgICB2YXIgbG9hZGVyID0gIXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PilcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIj5cbiAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgPFBhZ2luYXRpb24gXG4gICAgICAgICAgICAgICAgICBjb3VudD17dGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aH0gXG4gICAgICAgICAgICAgICAgICBuZXh0PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCArIDEpfSBcbiAgICAgICAgICAgICAgICAgIHByZXY9e3RoaXMuc2V0SW5kZXgodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMSl9XG4gICAgICAgICAgICAgICAgICBzZXRJbmRleD17dGhpcy5zZXRJbmRleH1cbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg9e3RoaXMuc3RhdGUuY3VycmVudF9pbmRleH0vPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSByaWdodCBjYWxlbmRhci1mdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgZGF0YS1jbGlwYm9hcmQtdGV4dD17dGhpcy5nZXRTaGFyZUxpbmsoKX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmdWktY2xpcFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jbGVhclwiPjwvZGl2PlxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtYmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLW1vblwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdHVlXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy13ZWRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXRodVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtZnJpXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1zbGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTJwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjNwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj40cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjZwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj43cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJ3aWRnZXQtaHJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCIgaWQ9XCJzbG90LW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nsb3RfbWFuYWdlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpcCA9IG5ldyBDbGlwYm9hcmQoJy5jYWxlbmRhci1mdW5jdGlvbicpO1xuICAgIGNsaXAub24oJ3N1Y2Nlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJMaW5rIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgaWYodHlwZW9mKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc2F2ZSBuZXdseSBnZW5lcmF0ZWQgY291cnNlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgICAgIHZhciBuZXdfZGF0YSA9IFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsIFxuICAgICAgICAgIHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9ucywgXG4gICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2RhdGEnLCBuZXdfZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgfVxuICAgIH0gXG5cbiAgfSxcblxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7dmlzaWJsZTogdHJ1ZX07XG5cdH0sXHRcdFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5zdGF0ZS52aXNpYmxlKSB7cmV0dXJuIG51bGw7fVxuXHRcdHJldHVybiAoXG5cdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3Qtd3JhcHBlciB0b2FzdGluZ1wiPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3RcIj57dGhpcy5wcm9wcy5jb250ZW50fTwvZGl2PlxuXHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuX3JlYWN0SW50ZXJuYWxJbnN0YW5jZSkgeyAvLyBpZiBtb3VudGVkIHN0aWxsXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3Zpc2libGU6IGZhbHNlfSk7XG5cdFx0XHR9XG5cdFx0fS5iaW5kKHRoaXMpLCA0MDAwKTtcblx0fSxcblxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0TGlua0RhdGE6IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlc190b19zZWN0aW9ucywgaW5kZXgpIHtcblx0ICAgIHZhciBkYXRhID0gc2Nob29sICsgXCImXCIgKyBpbmRleCArIFwiJlwiO1xuXHQgICAgdmFyIGNfdG9fcyA9IGNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdCAgICBmb3IgKHZhciBjb3Vyc2VfaWQgaW4gY190b19zKSB7XG5cdCAgICAgIGRhdGEgKz0gY291cnNlX2lkO1xuXG5cdCAgICAgIHZhciBtYXBwaW5nID0gY190b19zW2NvdXJzZV9pZF07XG5cdCAgICAgIGZvciAodmFyIHNlY3Rpb25faGVhZGluZyBpbiBtYXBwaW5nKSB7IC8vIGkuZSAnTCcsICdUJywgJ1AnLCAnUydcblx0ICAgICAgICBpZiAobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddICE9IFwiXCIpIHtcblx0ICAgICAgICAgIGRhdGEgKz0gXCIrXCIgKyBtYXBwaW5nW3NlY3Rpb25faGVhZGluZ107IC8vIGRlbGltaXRlciBmb3Igc2VjdGlvbnMgbG9ja2VkXG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIGRhdGEgKz0gXCImXCI7IC8vIGRlbGltaXRlciBmb3IgY291cnNlc1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgaWYgKGRhdGEubGVuZ3RoIDwgMykge2RhdGEgPSBcIlwiO31cblx0ICAgIHJldHVybiBkYXRhO1xuXHR9LFxufVxuIl19
