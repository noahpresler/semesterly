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
  "loadPresetTimetable",
  "setSchool",
  "setCoursesLoading",
  "setCoursesDoneLoading",
  "setCurrentIndex",
  ]
);

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
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
			React.createElement("span", {className: "course-action fui-plus", onClick: this.addCourse()}), 
			React.createElement("div", {id: "course-info-wrapper"}, 
				React.createElement("div", {id: "name"}, this.state.course_info.name), 
				React.createElement("div", {id: "code"}, this.state.course_info.code)
			)
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
            		React.createElement("img", {height: "95", src: tb.image_url}), 
            		React.createElement("h6", {className: "line-clamp"}, tb.title), 
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
		if (this.state.show_sections === this.state.course_info.code) {
			var sec_display = (
				React.createElement("div", {id: "all-sections-wrapper"}, 
					F, 
					S
				))
		} else {
			var sec_display = (React.createElement("div", {id: "numSections", onClick: this.setShowSections(this.state.course_info.code)}, "This course has ", React.createElement("b", null, this.state.course_info.sections_S.length + this.state.course_info.sections_F.length), " sections. Click to view them."))
		}
		var sections = 
			(React.createElement("div", {className: "modal-entry", id: "course-sections"}, 
				React.createElement("h6", null, "Course Sections:"), 
				sec_display
			))
		return sections
	},

	getInitialState: function() {
		return {
			show_sections: 0
		};
	},

	setShowSections: function(id) {
		return (function() {
			this.setState({show_sections: id});
		}.bind(this));
	},


});

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
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

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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
    var first = current - (current % 9); // round down to nearest multiple of this.props.numBubbles
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
                   checked: this.state.preferences[this.props.name], 
                   onClick: this.togglePreference}), 
            React.createElement("label", {htmlFor: toggle_label})
          )
        )
      )
    );
  },

  togglePreference: function() {
    var new_value = !this.state.preferences[this.props.name];
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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
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
  sidebar_collapsed: 'neutral',


  render: function() {
    var Modal = Boron['OutlineModal'];
    var school_selector = null;
    var loader = !(this.state.loading || this.state.courses_loading) ? null :
      (  React.createElement("div", {className: "spinner"}, 
            React.createElement("div", {className: "rect1"}), 
            React.createElement("div", {className: "rect2"}), 
            React.createElement("div", {className: "rect3"}), 
            React.createElement("div", {className: "rect4"}), 
            React.createElement("div", {className: "rect5"})
        ));
    if (this.state.school == "") {
      school_selector = (
      React.createElement(SimpleModal, {header: "Semester.ly | Welcome", 
                   styles: {backgroundColor: "#FDF5FF", color: "#000"}, 
                   content: React.createElement(SchoolList, {setSchool: this.setSchool})})
      );}
    return (
      React.createElement("div", {id: "root"}, 
        school_selector, 
        loader, 
        React.createElement("div", {id: "toast-container"}), 
        React.createElement("div", {id: "control-bar-container"}, 
          React.createElement("div", {id: "semesterly-name"}, "Semester.ly"), 
          React.createElement("img", {id: "semesterly-logo", src: "/static/img/logo2.0.png"}), 
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
    if (this.sidebar_collapsed == 'neutral') {
      var bodyw = $(window).width();
      if (bodyw > 1099) {
        this.collapseSideModal();
        this.sidebar_collapsed = 'open';
      } else {
        this.expandSideModal();
        this.sidebar_collapsed = 'closed';
      }
    }
    if (this.sidebar_collapsed == 'closed') {
      this.expandSideModal();
      this.sidebar_collapsed = 'open';
    } else {
      this.collapseSideModal();
      this.sidebar_collapsed = 'closed';
    }
  },

  expandSideModal: function() {
    $('.cal-container, .side-container').removeClass('full-cal').addClass('less-cal');
  },

  collapseSideModal: function() {
    $('.cal-container, .side-container').removeClass('less-cal').addClass('full-cal');
  }


});

},{"./actions/course_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/modal_content.jsx","./school_list":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/school_list.jsx","./side_bar":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_bar.jsx","./simple_modal":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/toast_store.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/school_list.jsx":[function(require,module,exports){
TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({displayName: "exports",

	render: function() {
		return 	(
			React.createElement("div", {className: "school-list"}, 
				React.createElement("div", {className: "school-picker school-jhu", 
					onClick: this.setSchool("jhu")}, 
					React.createElement("img", {src: "/static/img/school_logos/jhu_logo.png", 
						className: "school-logo"})
				), 
				React.createElement("div", {className: "school-picker school-uoft", 
					onClick: this.setSchool("uoft")}, 
					React.createElement("img", {src: "/static/img/school_logos/uoft_logo.png", 
						className: "school-logo"})
				)
			));
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

},{"./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var SearchResult = React.createClass({displayName: "SearchResult",
  render: function() {
    var li_class = "search-result", icon_class = "fui-plus";
    if (this.props.in_roster) {
      li_class += " todo-done";
      icon_class = "fui-check";
    }
    var bodyw = $(window).width();    return (
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
    TimetableActions.setCoursesLoading();
    $.get("/courses/" + school + "/" + _SEMESTER, 
        {}, 
        function(response) {
          this.setState({courses: response});
          TimetableActions.setCoursesDoneLoading();

        }.bind(this)
    );
  },

  render: function() {
    var search_results_div = this.getSearchResultsComponent();
    return (
      React.createElement("div", {id: "search-bar"}, 
        React.createElement("div", {className: "input-combine"}, 
          React.createElement("div", {className: "input-wrapper"}, 
            React.createElement("input", {
              type: "text", 
              placeholder: "Search by code, title, description, professor, degree", 
              id: "search-input", 
              ref: "input", 
              onFocus: this.focus, onBlur: this.blur, 
              onInput: this.queryChanged})
            ), 
          React.createElement("button", {"data-toggle": "collapse", "data-target": "#menu-container", id: "menu-btn"}, 
            React.createElement("div", {id: "sliders"}, 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              ), 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              ), 
              React.createElement("span", null, 
                React.createElement("div", {className: "box"})
              )
            )
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

  isSubsequence: function(result,query) {
      result = query.split(" ").every(function(s) {
          if (result.indexOf(s) > -1) {
            return true;
          } else {
            return false;
          }
      }.bind(this));
      return result;
  },

  filterCourses: function(query) {
    var opt_query = query.replace("intro","introduction")
    that = this
    var results = this.state.courses.filter(function(c) {
      return (that.isSubsequence(c.name.toLowerCase(),query) || 
             that.isSubsequence(c.name.toLowerCase(),opt_query) ||
             c.code.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1);
    });
    return results;
  },



});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');


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

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
var TimetableStore = require('./stores/update_timetables.js')

var RosterSlot = React.createClass({displayName: "RosterSlot",
  render: function() {
    var styles={backgroundColor: this.props.colour, borderColor: this.props.colour};
    return (
      React.createElement("div", {
        onClick: this.props.toggleModal(this.props.id), 
        style: styles, 
        onMouseEnter: this.highlightSiblings, 
        onMouseLeave: this.unhighlightSiblings, 
        className: "slot-outer fc-time-grid-event fc-event slot slot-" + this.props.id}, 
        React.createElement("div", {className: "fc-content"}, 
          React.createElement("div", {className: "fc-title slot-text-row"}, this.props.name)
        )
      )
    );
  },

  componentDidMount: function() {
  },
  highlightSiblings: function() {
      this.updateColours(COLOUR_TO_HIGHLIGHT[this.props.colour]);
  },
  unhighlightSiblings: function() {
      this.updateColours(this.props.colour);
  },
  updateColours: function(colour) {
    $(".slot-" + this.props.id)
      .css('background-color', colour)
      .css('border-color', colour);
  },

})

var CourseRoster = React.createClass({displayName: "CourseRoster",

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.props.timetables.length > 0) {
      var slots = this.props.timetables[0].courses.map(function(course) {
        var colour =  COURSE_TO_COLOUR[course.code];

        return React.createElement(RosterSlot, React.__spread({},  course, {toggleModal: this.props.toggleModal, key: course.code, colour: colour}))
      }.bind(this));
    } else {
      slots = null;
    }
    var tt = this.props.timetables.length > 0 ? this.props.timetables[0] : null;
    return (
      React.createElement("div", {className: "course-roster course-list"}, 
        React.createElement("div", {className: "clearfix"}, 
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
          if (tb['image_url'] === "Cannot be found") {
            var img = '/static/img/default_cover.jpg'
          } else {
            var img = tb['image_url']
          }
          if (tb['title'] == "Cannot be found") {
            var title = "#" +  tb['isbn']
          } else {
            var title = tb['title']
          }
          return ( 
            React.createElement("div", {className: "textbook", key: tb['id']}, 
                React.createElement("img", {height: "125", src: img}), 
                React.createElement("div", {className: "module"}, 
                  React.createElement("h6", {className: "line-clamp"}, title)
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
      React.createElement("div", {className: "course-roster textbook-list"}, 
        React.createElement("div", {className: "clearfix"}, 
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
      React.createElement("div", {ref: "sidebar", className: "side-container side-collapsed"}, 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Semester")
        ), 
        React.createElement(CourseRoster, {toggleModal: this.props.toggleModal, timetables: this.state.timetables}), 
        React.createElement("div", {className: "roster-header"}, 
          React.createElement("h4", null, "Your Textbooks")
        ), 
        React.createElement(TextbookRoster, null)
      )
    )
  }
});

},{"./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
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

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');


// maps base colour of slot to colour on highlight
COLOUR_TO_HIGHLIGHT = {
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
COURSE_TO_COLOUR = {}
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
                    React.createElement("span", {className: "fa fa-lock"})
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
                    React.createElement("span", {className: "fa fa-lock"})
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
            // console.log(this.props.time_start, this.props.time_end, this.props.num_conflicts)
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
        this.updateColours(COLOUR_TO_HIGHLIGHT[this.props.colour]);
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
        COURSE_TO_COLOUR = {};
        for (var course in this.props.timetable.courses) {
            var crs = this.props.timetable.courses[course];
            for (var slot_id in crs.slots) {
                var slot = crs.slots[slot_id];
                var colour = Object.keys(COLOUR_TO_HIGHLIGHT)[course];
                slot["colour"] = colour;
                slot["code"] = crs.code.trim();
                slot["name"] = crs.name;
                slots_by_day[slot.day].push(slot);
                COURSE_TO_COLOUR[crs.code] = colour;
            }
        }
        return slots_by_day;
    },

});

},{"./actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
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


TT_STATE = {
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
  loading: false,

  getInitialState: function() {
    return {
      timetables: [], 
      preferences: TT_STATE.preferences,
      courses_to_sections: {}, 
      current_index: -1, 
      conflict_error: false,
      loading: false, // timetables loading
      courses_loading: false,
      school: ""};
  },

  setSchool: function(new_school) {
    var school = SCHOOL_LIST.indexOf(new_school) > -1 ? new_school : "";
    var new_state = this.getInitialState();
    TT_STATE.school = school;
    new_state.school = school;
    this.trigger(new_state);
  },
 /**
  * Update TT_STATE with new course roster
  * @param {object} new_course_with_section contains attributed id, section, removing
  * @return {void} does not return anything, just updates TT_STATE
  */
  updateCourses: function(new_course_with_section) {
    if (this.loading) {return;} // if loading, don't process.
    this.loading = true;
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var section = new_course_with_section.section;
    var new_state = $.extend(true, {}, TT_STATE); // deep copy of TT_STATE
    var c_to_s = new_state.courses_to_sections;
    
    if (!removing) { // adding course
      if (TT_STATE.school == "jhu") {
        c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': new_course_with_section.section};
      }
      else if (TT_STATE.school == "uoft") {
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
          TT_STATE.courses_to_sections = {};
          var replaced = this.getInitialState();
          replaced.school = TT_STATE.school;
          this.loading = false;
          this.trigger(replaced);
          return;  
      }
    }
    this.makeRequest(new_state);
  },

 /**
  * Update TT_STATE with new preferences
  * @param {string} preference: the preference that is being updated
  * @param new_value: the new value of the specified preference
  * @return {void} doesn't return anything, just updates TT_STATE
  */
  updatePreferences: function(preference, new_value) {
    var new_state = $.extend(true, {}, TT_STATE); // deep copy of TT_STATE
    new_state.preferences[preference] = new_value;
    this.trigger({preferences: new_state.preferences});
    this.makeRequest(new_state);
  },

  // Makes a POST request to the backend with TT_STATE
  makeRequest: function(new_state) {
    this.trigger({loading: true});
    $.post('/timetable/', JSON.stringify(new_state), function(response) {
        this.loading = false;
        if (response.error) { // error from URL or local storage
          localStorage.removeItem('data');
          TT_STATE.courses_to_sections = {};
          var replaced = this.getInitialState();
          replaced.school = TT_STATE.school;
          this.trigger(replaced);
          return; // stop processing here
        }
        if (response.length > 0) {
          TT_STATE = new_state; //only update state if successful
          var index = 0;
          if (new_state.index && new_state.index < response.length) {
            index = new_state.index;
            delete new_state['index'];
          }
          this.trigger({
              timetables: response,
              courses_to_sections: TT_STATE.courses_to_sections,
              current_index: index,
              loading: false
          });
        } else if (TT_STATE.courses_to_sections != {}) { // conflict
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
    var prefs = courses.shift();
    var preferences_array = prefs.split(";");
    var pref_obj = {};
    for (var k in preferences_array) {
      var pref_with_val = preferences_array[k].split("=");
      var pref = pref_with_val[0];
      var val = pref_with_val[1];
      pref_obj[pref] = (val === 'true');
    }
    this.trigger({loading: true, school: school, preferences:pref_obj});
    TT_STATE.preferences = pref_obj;
    TT_STATE.school = school;
    TT_STATE.index = parseInt(courses.shift());
    for (var i = 0; i < courses.length; i++) {
      var c = parseInt(courses[i]);
      var course_info = courses[i].split("+");
      course_info.shift(); // removes first element
      TT_STATE.courses_to_sections[c] = {'L': '', 'T': '', 'P': '', 'C': ''};
      if (course_info.length > 0) {
        for (var j = 0; j < course_info.length; j++) {
          var section = course_info[j];
          if (school == "uoft") {
            TT_STATE.courses_to_sections[c][section[0]] = section;
          }
          else if (school == "jhu") {
            TT_STATE.courses_to_sections[c]['C'] = section;
          }
        }
      }
    }
    this.makeRequest(TT_STATE);
  },

  setCoursesLoading: function() {
    this.trigger({courses_loading: true});
  },
  setCoursesDoneLoading: function() {
    this.trigger({courses_loading: false});
  },

  setCurrentIndex: function(new_index) {
    this.trigger({current_index: new_index});
  },


});

},{"../actions/toast_actions.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
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
    var data = this.getData();
    return link + data;
  },
  getData: function() {
  return Util.getLinkData(this.state.school,
      this.state.courses_to_sections,
      this.state.current_index, this.state.preferences);
  },
  getEndHour: function() {
    // gets the end hour of the current timetable
    var max_end_hour = 18;
    if (!this.hasTimetables()) {
      return max_end_hour;
    }
    var courses = this.state.timetables[this.state.current_index].courses;
    for (var course_index in courses) {
      var course = courses[course_index];
      for (var slot_index in course.slots) {
        var slot = course.slots[slot_index];
        var end_hour = parseInt(slot.time_end.split(":")[0]);
        max_end_hour = Math.max(max_end_hour, end_hour);
      }
    }
    return max_end_hour;

  },

  getHourRows: function() {
    var max_end_hour = this.getEndHour();
    var rows = [];
    for (var i = 8; i <= max_end_hour; i++) { // one row for each hour, starting from 8am
      var time = i + "am";
      if (i >= 12) { // the pm hours
        var hour = (i - 12) > 0 ? i - 12 : i;
        time = hour + "pm";
      }
      rows.push(
          (React.createElement("tr", {key: time}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}, React.createElement("span", null, time)), 
              React.createElement("td", {className: "fc-widget-content"})
          ))
      );  
      // for the half hour row
      rows.push(
          (React.createElement("tr", {className: "fc-minor", key: time + "-half"}, 
              React.createElement("td", {className: "fc-axis fc-time fc-widget-content"}), 
              React.createElement("td", {className: "fc-widget-content"})
          ))
      );

    }

    return rows;
  },


  hasTimetables: function() {
    return this.state.timetables.length > 0;
  },

  render: function() {
      var has_timetables = this.hasTimetables();
      var slot_manager = !has_timetables ? null :
       (React.createElement(SlotManager, {toggleModal: this.props.toggleModal, 
                     timetable: this.state.timetables[this.state.current_index], 
                     courses_to_sections: this.state.courses_to_sections, 
                     school: this.state.school}));

      var hours = this.getHourRows();
      var opacity = this.state.loading ? {opacity: "0.5"} : {};
      var height = (572 + (this.getEndHour() - 18)*52) + "px";
      return (

          React.createElement("div", {id: "calendar", className: "fc fc-ltr fc-unthemed", style: opacity}, 
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
                          React.createElement("div", {className: "fc-time-grid-container fc-scroller", id: "calendar-inner", style: {height: height}}, 
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
                                    hours
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
        var new_data = this.getData();
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});

},{"./actions/toast_actions":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
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

},{}],"/Users/rohandas/Desktop/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
module.exports = {
	getLinkData: function(school, courses_to_sections, index, preferences) {
	    var data = school + "&";
	    for (var pref in preferences) {
	    	data += pref + "=" + preferences[pref] + ";";
	    }
	    data = data.slice(0, -1);
	    data += "&" + index + "&";
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

},{}]},{},["/Users/rohandas/Desktop/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FjdGlvbnMvY291cnNlX2FjdGlvbnMuanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYXBwLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvY29udHJvbF9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9ldmFsdWF0aW9ucy5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2xvYWRlci5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL21vZGFsX2NvbnRlbnQuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9uZXdfcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3BhZ2luYXRpb24uanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9wcmVmZXJlbmNlX21lbnUuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9yb290LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2Nob29sX2xpc3QuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zZWFyY2hfYmFyLmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VjdGlvbl9zbG90LmpzeCIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2lkZV9iYXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaW1wbGVfbW9kYWwuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvY291cnNlX2luZm8uanMiLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy90b2FzdF9zdG9yZS5qcyIsIi9Vc2Vycy9yb2hhbmRhcy9EZXNrdG9wL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90aW1ldGFibGUuanN4IiwiL1VzZXJzL3JvaGFuZGFzL0Rlc2t0b3Avc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS90b2FzdC5qc3giLCIvVXNlcnMvcm9oYW5kYXMvRGVza3RvcC9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3V0aWwvdGltZXRhYmxlX3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxhQUFhLENBQUM7Q0FDaEI7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkM7RUFDQSxlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLHFCQUFxQjtFQUNyQixXQUFXO0VBQ1gsbUJBQW1CO0VBQ25CLHVCQUF1QjtFQUN2QixpQkFBaUI7R0FDaEI7Q0FDRixDQUFDOzs7QUNWRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUM5RCxTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUVoQixRQUFRLENBQUMsTUFBTTtFQUNiLG9CQUFDLElBQUksRUFBQSxJQUFBLENBQUcsQ0FBQTtFQUNSLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO0FBQ2pDLENBQUMsQ0FBQzs7QUFFRixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7QUFDcEYsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLFdBQVcsRUFBRTtJQUMxQyxJQUFJLEdBQUcsWUFBWSxDQUFDLE9B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QUFDLENBQUM7QUFDOUIsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDOztLQUVqQyxPQUFPLElBQUksQ0FBQztFQUNmO0NBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiZ2V0Q291cnNlSW5mb1wiXVxuKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcImNyZWF0ZVRvYXN0XCJdXG4pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZUFjdGlvbnMoXG4gIFtcbiAgXCJ1cGRhdGVDb3Vyc2VzXCIsXG4gIFwidXBkYXRlUHJlZmVyZW5jZXNcIixcbiAgXCJsb2FkUHJlc2V0VGltZXRhYmxlXCIsXG4gIFwic2V0U2Nob29sXCIsXG4gIFwic2V0Q291cnNlc0xvYWRpbmdcIixcbiAgXCJzZXRDb3Vyc2VzRG9uZUxvYWRpbmdcIixcbiAgXCJzZXRDdXJyZW50SW5kZXhcIixcbiAgXVxuKTtcbiIsInZhciBSb290ID0gcmVxdWlyZSgnLi9yb290Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFJvb3QgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKCFkYXRhICYmIHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBkaWRuJ3QgZmluZCBpbiBVUkwsIHRyeSBsb2NhbCBzdG9yYWdlXG4gICAgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRhJyk7XG59IFxuaWYgKGRhdGEpIHtcblx0VGltZXRhYmxlQWN0aW9ucy5sb2FkUHJlc2V0VGltZXRhYmxlKGRhdGEpO1xufVxuIiwidmFyIFNlYXJjaEJhciA9IHJlcXVpcmUoJy4vc2VhcmNoX2JhcicpO1xudmFyIFByZWZlcmVuY2VNZW51ID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlX21lbnUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cImNvbnRyb2wtYmFyXCI+XG4gICAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxTZWFyY2hCYXIgdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8UHJlZmVyZW5jZU1lbnUgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgKTtcbiAgfSxcbn0pO1xuIiwidmFyIEV2YWx1YXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLnNlbGVjdGVkID8gXCJldmFsLWl0ZW0gc2VsZWN0ZWRcIiA6IFwiZXZhbC1pdGVtXCJcblx0XHR2YXIgZGV0YWlscyA9ICF0aGlzLnByb3BzLnNlbGVjdGVkID8gbnVsbCA6IChcblx0XHRcdDxkaXYgaWQ9XCJkZXRhaWxzXCI+e3RoaXMucHJvcHMuZXZhbF9kYXRhLnN1bW1hcnkucmVwbGFjZSgvXFx1MDBhMC9nLCBcIiBcIil9PC9kaXY+XG5cdFx0XHQpXG5cdFx0dmFyIHByb2YgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwicHJvZlwiPlByb2Zlc3Nvcjoge3RoaXMucHJvcHMuZXZhbF9kYXRhLnByb2Zlc3Nvcn08L2Rpdj5cblx0XHRcdClcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNlbGVjdGlvbkNhbGxiYWNrfSA+XG5cdFx0XHQ8ZGl2IGlkPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwieWVhclwiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS55ZWFyfTwvZGl2PlxuXHRcdFx0XHR7cHJvZn1cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gc3R5bGU9e3t3aWR0aDogMTAwKnRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlLzUgKyBcIiVcIn19IGNsYXNzTmFtZT1cInJhdGluZ1wiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm51bWVyaWMtcmF0aW5nXCI+e1wiKFwiICsgdGhpcy5wcm9wcy5ldmFsX2RhdGEuc2NvcmUgKyBcIilcIn08L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdHtkZXRhaWxzfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbmRleF9zZWxlY3RlZDogbnVsbFxuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIGV2YWxzID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubWFwKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGkrKztcblx0XHRcdHZhciBzZWxlY3RlZCA9IGkgPT0gdGhpcy5zdGF0ZS5pbmRleF9zZWxlY3RlZDtcblx0XHRcdHJldHVybiAoPEV2YWx1YXRpb24gZXZhbF9kYXRhPXtlfSBrZXk9e2UuaWR9IHNlbGVjdGlvbkNhbGxiYWNrPXt0aGlzLmNoYW5nZVNlbGVjdGVkKGkpfSBzZWxlY3RlZD17c2VsZWN0ZWR9IC8+KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBjbGlja19ub3RpY2UgPSB0aGlzLnByb3BzLmV2YWxfaW5mby5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyBjb3Vyc2UgZXZhbHVhdGlvbnMgZm9yIHRoaXMgY291cnNlIHlldDwvZGl2PikgOiAoPGRpdiBpZD1cImNsaWNrLWludHJvXCI+Q2xpY2sgYW4gZXZhbHVhdGlvbiBpdGVtIGFib3ZlIHRvIHJlYWQgdGhlIGNvbW1lbnRzPC9kaXY+KTtcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1ldmFsdWF0aW9uc1wiPlxuXHRcdFx0PGg2PkNvdXJzZSBFdmFsdWF0aW9uczo8L2g2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJldmFsLXdyYXBwZXJcIj5cblx0XHRcdFx0e2V2YWxzfVxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Y2xpY2tfbm90aWNlfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0Y2hhbmdlU2VsZWN0ZWQ6IGZ1bmN0aW9uKGVfaW5kZXgpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQgPT0gZV9pbmRleCkgXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBudWxsfSk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBlX2luZGV4fSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBpZD1cImxvYWRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUtZ3JpZFwiPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUxXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTJcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlM1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU0XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTVcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNlwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU3XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZThcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlOVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcbn0pO1xuXG4iLCJ2YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbnZhciBDb3Vyc2VJbmZvU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9jb3Vyc2VfaW5mbycpO1xudmFyIEV2YWx1YXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9ldmFsdWF0aW9ucy5qc3gnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgQ291cnNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4JylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW1JlZmx1eC5jb25uZWN0KENvdXJzZUluZm9TdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRlciA9IHRoaXMuc3RhdGUubG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRIZWFkZXIoKVxuXHRcdHZhciBkZXNjcmlwdGlvbiA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKClcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRFdmFsdWF0aW9ucygpXG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0UmVjb21lbmRhdGlvbnMoKVxuXHRcdHZhciB0ZXh0Ym9va3MgPXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFRleHRib29rcygpXG5cdFx0dmFyIHNlY3Rpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPVwibW9kYWwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgICAge2hlYWRlcn1cbiAgICAgICAgICAgICAgICB7ZGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAge2V2YWx1YXRpb25zfVxuICAgICAgICAgICAgICAgIHtzZWN0aW9uc31cbiAgICAgICAgICAgICAgICB7dGV4dGJvb2tzfVxuICAgICAgICAgICAgICAgIHtyZWNvbWVuZGF0aW9uc31cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG5cblx0Z2V0SGVhZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJjb3Vyc2UtYWN0aW9uIGZ1aS1wbHVzXCIgb25DbGljaz17dGhpcy5hZGRDb3Vyc2UoKX0vPlxuXHRcdFx0PGRpdiBpZD1cImNvdXJzZS1pbmZvLXdyYXBwZXJcIj5cblx0XHRcdFx0PGRpdiBpZD1cIm5hbWVcIj57dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5uYW1lfTwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY29kZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLmNvZGV9PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGhlYWRlclxuXHR9LFxuXG5cdGFkZENvdXJzZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMuc3RhdGUuY291cnNlX2luZm8uaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogZmFsc2V9KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Q291cnNlQWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMucHJvcHMuc2Nob29sLCBjb3Vyc2VfaWQpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0Z2V0RGVzY3JpcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1kZXNjcmlwdGlvblwiPlxuXHRcdFx0XHQ8aDY+RGVzY3JpcHRpb246PC9oNj5cblx0XHRcdFx0e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZGVzY3JpcHRpb259XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGRlc2NyaXB0aW9uO1xuXHR9LFxuXG5cdGdldEV2YWx1YXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gPEV2YWx1YXRpb25NYW5hZ2VyIGV2YWxfaW5mbz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5ldmFsX2luZm99IC8+XG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwicmVjb21tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjZW50ZXItd3JhcHBlclwiPlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2RlXCI+e3JjLmNvZGV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHQ8L2Rpdj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiPlxuXHRcdFx0XHQ8aDY+Q291cnNlcyBZb3UgTWlnaHQgTGlrZTo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY291cnNlLXJlY29tZW5kYXRpb25zXCI+XG5cdFx0XHRcdFx0e3JlbGF0ZWR9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiByZWNvbWVuZGF0aW9uc1xuXHR9LFxuXG5cdGV4cGFuZFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblxuXHR9LFxuXG5cdGdldFRleHRib29rczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRleHRib29rX2VsZW1lbnRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBrZXk9e3RiLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8aW1nIGhlaWdodD1cIjk1XCIgc3JjPXt0Yi5pbWFnZV91cmx9Lz5cbiAgICAgICAgICAgIFx0XHQ8aDYgY2xhc3NOYW1lPVwibGluZS1jbGFtcFwiPnt0Yi50aXRsZX08L2g2PlxuICAgICAgICAgICAgXHRcdDxkaXY+e3RiLmF1dGhvcn08L2Rpdj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2PklTQk46e3RiLmlzYm59PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGEgaHJlZj17dGIuZGV0YWlsX3VybH0gdGFyZ2V0PVwiX2JsYW5rXCI+XG4gICAgICAgICAgICBcdFx0XHQ8aW1nIHNyYz1cImh0dHBzOi8vaW1hZ2VzLW5hLnNzbC1pbWFnZXMtYW1hem9uLmNvbS9pbWFnZXMvRy8wMS9hc3NvY2lhdGVzL3JlbW90ZS1idXktYm94L2J1eTUuX1YxOTIyMDc3MzlfLmdpZlwiIHdpZHRoPVwiMTIwXCIgaGVpZ2h0PVwiMjhcIiBib3JkZXI9XCIwXCIvPlxuICAgICAgICAgICAgXHRcdDwvYT5cbiAgICAgICAgICAgIFx0PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblx0XHR2YXIgdGV4dGJvb2tzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyB0ZXh0Ym9va3MgeWV0IGZvciB0aGlzIGNvdXJzZTwvZGl2PikgOlxuXHRcdFx0XHQoPGRpdiBpZD1cInRleHRib29rc1wiPlxuXHQgICAgICAgICAgICBcdHt0ZXh0Ym9va19lbGVtZW50c31cblx0ICAgICAgICAgICAgPC9kaXY+KTtcblx0XHR2YXIgcmV0ID0gXG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiIGlkPVwiY291cnNlLXRleHRib29rc1wiPlxuXHRcdFx0XHQ8aDY+VGV4dGJvb2tzOjwvaDY+XG5cdFx0XHRcdHt0ZXh0Ym9va3N9XG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cblx0Z2V0U2VjdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBGID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0Zfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1Nfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3dfc2VjdGlvbnMgPT09IHRoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZSkge1xuXHRcdFx0dmFyIHNlY19kaXNwbGF5ID0gKFxuXHRcdFx0XHQ8ZGl2IGlkPVwiYWxsLXNlY3Rpb25zLXdyYXBwZXJcIj5cblx0XHRcdFx0XHR7Rn1cblx0XHRcdFx0XHR7U31cblx0XHRcdFx0PC9kaXY+KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgc2VjX2Rpc3BsYXkgPSAoPGRpdiBpZD1cIm51bVNlY3Rpb25zXCIgb25DbGljaz17dGhpcy5zZXRTaG93U2VjdGlvbnModGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlKX0+VGhpcyBjb3Vyc2UgaGFzIDxiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1MubGVuZ3RoICsgdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLmxlbmd0aH08L2I+IHNlY3Rpb25zLiBDbGljayB0byB2aWV3IHRoZW0uPC9kaXY+KVxuXHRcdH1cblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHR7c2VjX2Rpc3BsYXl9XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHNlY3Rpb25zXG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd19zZWN0aW9uczogMFxuXHRcdH07XG5cdH0sXG5cblx0c2V0U2hvd1NlY3Rpb25zOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtzaG93X3NlY3Rpb25zOiBpZH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICAgIFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFx0dmFyIG9wdGlvbnMgPSBbXSwgY291bnQgPSB0aGlzLnByb3BzLmNvdW50LCBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4O1xuICAgIFx0aWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIFx0dmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgXHR2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBcdGZvciAodmFyIGkgPSBmaXJzdDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgXHQgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBcdFx0b3B0aW9ucy5wdXNoKFxuICAgICAgICBcdFx0PGxpIGtleT17aX0gY2xhc3NOYW1lPXtcInNlbS1wYWdlIFwiICsgY2xhc3NOYW1lfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT5cbiAgICAgICAgICAgICBcdFx0IHtpICsgMX1cbiAgICAgICBcdFx0XHQ8L2xpPik7XG4gIFx0XHR9XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb25cIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLXByZXZcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtbGVmdCBzZW0tcGFnaW5hdGlvbi1wcmV2IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLnByZXZ9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxvbCBjbGFzc05hbWU9XCJzZW0tcGFnZXNcIj5cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0PC9vbD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLm5leHR9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdiBuYXYtZG91YmxlIG5hdi1kb3VibGUtbmV4dFwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiB0aGlzLnByb3BzLm51bUJ1YmJsZXNcbiAgICB2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBmb3IgKHZhciBpID0gZmlyc3Q7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4ID09IGkgPyBcImFjdGl2ZVwiIDogXCJcIjtcbiAgICAgIG9wdGlvbnMucHVzaChcbiAgICAgICAgPGxpIGtleT17aX0gY2xhc3NOYW1lPXtjbGFzc05hbWV9PlxuICAgICAgICAgICAgICA8YSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT57aSArIDF9PC9hPlxuICAgICAgICA8L2xpPik7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uIHBhZ2luYXRpb24tbWluaW1hbFwiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgtMSl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2luYXRpb24tYnRuXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLWxlZnRcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cInByZXZpb3VzXCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1sZWZ0IHBhZ2luYXRpb24tYnRuXCIgXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5wcmV2fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAge29wdGlvbnN9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0XCI+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImZ1aS1hcnJvdy1yaWdodCBwYWdpbmF0aW9uLWJ0blwiXG4gICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy5uZXh0fT48L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm5leHQtZG91YmxlXCIgb25DbGljaz17dGhpcy5jaGFuZ2VQYWdlKDEpfT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcbiAgXG5cbn0pOyIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgQmluYXJ5UHJlZmVyZW5jZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0b2dnbGVfbGFiZWwgPSBcImNtbi10b2dnbGUtXCIgKyB0aGlzLnByb3BzLnRvZ2dsZV9pZDtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLWl0ZW1cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRleHRcIj5cbiAgICAgICAgICA8bGk+IHt0aGlzLnByb3BzLnRleHR9IDwvbGk+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInByZWZlcmVuY2UtdG9nZ2xlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzd2l0Y2hcIj5cbiAgICAgICAgICAgIDxpbnB1dCByZWY9XCJjaGVja2JveF9lbGVtXCIgaWQ9e3RvZ2dsZV9sYWJlbH0gXG4gICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY21uLXRvZ2dsZSBjbW4tdG9nZ2xlLXJvdW5kXCIgdHlwZT1cImNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdfVxuICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMudG9nZ2xlUHJlZmVyZW5jZX0vPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9e3RvZ2dsZV9sYWJlbH0+PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZVByZWZlcmVuY2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdfdmFsdWUgPSAhdGhpcy5zdGF0ZS5wcmVmZXJlbmNlc1t0aGlzLnByb3BzLm5hbWVdO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlUHJlZmVyZW5jZXModGhpcy5wcm9wcy5uYW1lLCBuZXdfdmFsdWUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGN1cnJlbnRfdG9nZ2xlX2lkOiAwLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWNvbGxhcHNlXCIgPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdlwiIGlkPVwibWVudVwiPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTtcbiIsInZhciBDb250cm9sQmFyID0gcmVxdWlyZSgnLi9jb250cm9sX2JhcicpO1xudmFyIFRpbWV0YWJsZSA9IHJlcXVpcmUoJy4vdGltZXRhYmxlJyk7XG52YXIgTW9kYWxDb250ZW50ID0gcmVxdWlyZSgnLi9tb2RhbF9jb250ZW50Jyk7XG52YXIgVG9hc3RTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3RvYXN0X3N0b3JlLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL2NvdXJzZV9hY3Rpb25zJyk7XG52YXIgU2lkZWJhciA9IHJlcXVpcmUoJy4vc2lkZV9iYXInKTtcbnZhciBTaW1wbGVNb2RhbCA9IHJlcXVpcmUoJy4vc2ltcGxlX21vZGFsJyk7XG52YXIgU2Nob29sTGlzdCA9IHJlcXVpcmUoJy4vc2Nob29sX2xpc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKSwgUmVmbHV4LmNvbm5lY3QoVG9hc3RTdG9yZSldLFxuICBzaWRlYmFyX2NvbGxhcHNlZDogJ25ldXRyYWwnLFxuXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgTW9kYWwgPSBCb3JvblsnT3V0bGluZU1vZGFsJ107XG4gICAgdmFyIHNjaG9vbF9zZWxlY3RvciA9IG51bGw7XG4gICAgdmFyIGxvYWRlciA9ICEodGhpcy5zdGF0ZS5sb2FkaW5nIHx8IHRoaXMuc3RhdGUuY291cnNlc19sb2FkaW5nKSA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2Pik7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2Nob29sID09IFwiXCIpIHtcbiAgICAgIHNjaG9vbF9zZWxlY3RvciA9IChcbiAgICAgIDxTaW1wbGVNb2RhbCBoZWFkZXI9e1wiU2VtZXN0ZXIubHkgfCBXZWxjb21lXCJ9XG4gICAgICAgICAgICAgICAgICAgc3R5bGVzPXt7YmFja2dyb3VuZENvbG9yOiBcIiNGREY1RkZcIiwgY29sb3I6IFwiIzAwMFwifX0gXG4gICAgICAgICAgICAgICAgICAgY29udGVudD17PFNjaG9vbExpc3Qgc2V0U2Nob29sPXt0aGlzLnNldFNjaG9vbH0vPiB9Lz5cbiAgICAgICk7fVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwicm9vdFwiPlxuICAgICAgICB7c2Nob29sX3NlbGVjdG9yfVxuICAgICAgICB7bG9hZGVyfVxuICAgICAgICA8ZGl2IGlkPVwidG9hc3QtY29udGFpbmVyXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwic2VtZXN0ZXJseS1uYW1lXCI+U2VtZXN0ZXIubHk8L2Rpdj5cbiAgICAgICAgICA8aW1nIGlkPVwic2VtZXN0ZXJseS1sb2dvXCIgc3JjPVwiL3N0YXRpYy9pbWcvbG9nbzIuMC5wbmdcIi8+XG4gICAgICAgICAgPENvbnRyb2xCYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJuYXZpY29uXCIgb25DbGljaz17dGhpcy50b2dnbGVTaWRlTW9kYWx9PlxuICAgICAgICAgIDxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cIm1vZGFsLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxNb2RhbCBjbG9zZU9uQ2xpY2s9e3RydWV9IHJlZj0nT3V0bGluZU1vZGFsJyBjbGFzc05hbWU9XCJjb3Vyc2UtbW9kYWxcIj5cbiAgICAgICAgICAgICAgPE1vZGFsQ29udGVudCBzY2hvb2w9e3RoaXMuc3RhdGUuc2Nob29sfS8+XG4gICAgICAgICAgPC9Nb2RhbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWxsLWNvbHMtY29udGFpbmVyXCI+XG4gICAgICAgICAgPFNpZGViYXIgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9Lz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhbC1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxUaW1ldGFibGUgdG9nZ2xlTW9kYWw9e3RoaXMudG9nZ2xlQ291cnNlTW9kYWx9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuXG5cbiAgdG9nZ2xlQ291cnNlTW9kYWw6IGZ1bmN0aW9uKGNvdXJzZV9pZCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWZzWydPdXRsaW5lTW9kYWwnXS50b2dnbGUoKTtcbiAgICAgICAgY291cnNlX2FjdGlvbnMuZ2V0Q291cnNlSW5mbyh0aGlzLnN0YXRlLnNjaG9vbCwgY291cnNlX2lkKTtcbiAgICB9LmJpbmQodGhpcyk7IFxuICB9LFxuXG5cbiAgdG9nZ2xlU2lkZU1vZGFsOiBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLnNpZGViYXJfY29sbGFwc2VkID09ICduZXV0cmFsJykge1xuICAgICAgdmFyIGJvZHl3ID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgICBpZiAoYm9keXcgPiAxMDk5KSB7XG4gICAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgICAgdGhpcy5zaWRlYmFyX2NvbGxhcHNlZCA9ICdvcGVuJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSAnY2xvc2VkJztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPT0gJ2Nsb3NlZCcpIHtcbiAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ29wZW4nO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbGxhcHNlU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gJ2Nsb3NlZCc7XG4gICAgfVxuICB9LFxuXG4gIGV4cGFuZFNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLmNhbC1jb250YWluZXIsIC5zaWRlLWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCdmdWxsLWNhbCcpLmFkZENsYXNzKCdsZXNzLWNhbCcpO1xuICB9LFxuXG4gIGNvbGxhcHNlU2lkZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAkKCcuY2FsLWNvbnRhaW5lciwgLnNpZGUtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2xlc3MtY2FsJykuYWRkQ2xhc3MoJ2Z1bGwtY2FsJyk7XG4gIH1cblxuXG59KTtcbiIsIlRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXHQoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1saXN0XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2Nob29sLXBpY2tlciBzY2hvb2wtamh1XCIgXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJqaHVcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL2podV9sb2dvLnBuZ1wiIFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwic2Nob29sLWxvZ29cIi8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLXVvZnRcIiBcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnNldFNjaG9vbChcInVvZnRcIil9PlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL3VvZnRfbG9nby5wbmdcIiBcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInNjaG9vbC1sb2dvXCIvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0c2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMuc2V0U2Nob29sKG5ld19zY2hvb2wpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cbn0pO1xuXG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIFNlYXJjaFJlc3VsdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGlfY2xhc3MgPSBcInNlYXJjaC1yZXN1bHRcIiwgaWNvbl9jbGFzcyA9IFwiZnVpLXBsdXNcIjtcbiAgICBpZiAodGhpcy5wcm9wcy5pbl9yb3N0ZXIpIHtcbiAgICAgIGxpX2NsYXNzICs9IFwiIHRvZG8tZG9uZVwiO1xuICAgICAgaWNvbl9jbGFzcyA9IFwiZnVpLWNoZWNrXCI7XG4gICAgfVxuICAgIHZhciBib2R5dyA9ICQod2luZG93KS53aWR0aCgpOyAgICByZXR1cm4gKFxuICAgICAgPGxpIGNsYXNzTmFtZT17bGlfY2xhc3N9IG9uTW91c2VEb3duPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsKHRoaXMucHJvcHMuaWQpfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0b2RvLWNvbnRlbnRcIj5cbiAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidG9kby1uYW1lXCI+XG4gICAgICAgICAgICB7dGhpcy5wcm9wcy5jb2RlfVxuICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17XCJzZWFyY2gtcmVzdWx0LWFjdGlvbiBcIiArIGljb25fY2xhc3N9IFxuICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLnRvZ2dsZUNvdXJzZX0+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfSxcblxuICB0b2dnbGVDb3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVtb3ZpbmcgPSB0aGlzLnByb3BzLmluX3Jvc3RlcjtcbiAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmlkLCBzZWN0aW9uOiAnJywgcmVtb3Zpbmc6IHJlbW92aW5nfSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgLy8gc3RvcCBpbnB1dCBmcm9tIHRyaWdnZXJpbmcgb25CbHVyIGFuZCB0aHVzIGhpZGluZyByZXN1bHRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gc3RvcCBwYXJlbnQgZnJvbSBvcGVuaW5nIG1vZGFsXG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVGltZXRhYmxlU3RvcmUpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb3Vyc2VzOltdLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBmb2N1c2VkOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uKG5ld19wcm9wcywgbmV3X3N0YXRlKSB7XG4gICAgaWYgKG5ld19zdGF0ZS5zY2hvb2wgIT0gdGhpcy5zdGF0ZS5zY2hvb2wpIHtcbiAgICAgIHRoaXMuZ2V0Q291cnNlcyhuZXdfc3RhdGUuc2Nob29sKTtcbiAgICB9XG5cbiAgfSxcbiAgZ2V0Q291cnNlczogZnVuY3Rpb24oc2Nob29sKSB7XG4gICAgVGltZXRhYmxlQWN0aW9ucy5zZXRDb3Vyc2VzTG9hZGluZygpO1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIgKyBzY2hvb2wgKyBcIi9cIiArIF9TRU1FU1RFUiwgXG4gICAgICAgIHt9LCBcbiAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb3Vyc2VzOiByZXNwb25zZX0pO1xuICAgICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q291cnNlc0RvbmVMb2FkaW5nKCk7XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWFyY2hfcmVzdWx0c19kaXYgPSB0aGlzLmdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQoKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1iYXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnB1dC1jb21iaW5lXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbnB1dC13cmFwcGVyXCI+XG4gICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IGNvZGUsIHRpdGxlLCBkZXNjcmlwdGlvbiwgcHJvZmVzc29yLCBkZWdyZWVcIiBcbiAgICAgICAgICAgICAgaWQ9XCJzZWFyY2gtaW5wdXRcIiBcbiAgICAgICAgICAgICAgcmVmPVwiaW5wdXRcIiBcbiAgICAgICAgICAgICAgb25Gb2N1cz17dGhpcy5mb2N1c30gb25CbHVyPXt0aGlzLmJsdXJ9IFxuICAgICAgICAgICAgICBvbklucHV0PXt0aGlzLnF1ZXJ5Q2hhbmdlZH0vPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCIgZGF0YS10YXJnZXQ9XCIjbWVudS1jb250YWluZXJcIiBpZD1cIm1lbnUtYnRuXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2xpZGVyc1wiPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAge3NlYXJjaF9yZXN1bHRzX2Rpdn1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGdldFNlYXJjaFJlc3VsdHNDb21wb25lbnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5mb2N1c2VkIHx8IHRoaXMuc3RhdGUucmVzdWx0cy5sZW5ndGggPT0gMCkge3JldHVybiBudWxsO31cbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzID0gdGhpcy5zdGF0ZS5yZXN1bHRzLm1hcChmdW5jdGlvbihyKSB7XG4gICAgICBpKys7XG4gICAgICB2YXIgaW5fcm9zdGVyID0gdGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW3IuaWRdICE9IG51bGw7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U2VhcmNoUmVzdWx0IHsuLi5yfSBrZXk9e2l9IGluX3Jvc3Rlcj17aW5fcm9zdGVyfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0vPlxuICAgICAgKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLXJlc3VsdHMtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kbyBtcm1cIj5cbiAgICAgICAgICAgIDx1bCBpZD1cInNlYXJjaC1yZXN1bHRzXCI+XG4gICAgICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c31cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtmb2N1c2VkOiB0cnVlfSk7XG4gIH0sXG5cbiAgYmx1cjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogZmFsc2V9KTtcbiAgfSxcblxuICBxdWVyeUNoYW5nZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHF1ZXJ5ID0gZXZlbnQudGFyZ2V0LnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGZpbHRlcmVkID0gcXVlcnkubGVuZ3RoIDw9IDEgPyBbXSA6IHRoaXMuZmlsdGVyQ291cnNlcyhxdWVyeSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7cmVzdWx0czogZmlsdGVyZWR9KTtcbiAgfSxcblxuICBpc1N1YnNlcXVlbmNlOiBmdW5jdGlvbihyZXN1bHQscXVlcnkpIHtcbiAgICAgIHJlc3VsdCA9IHF1ZXJ5LnNwbGl0KFwiIFwiKS5ldmVyeShmdW5jdGlvbihzKSB7XG4gICAgICAgICAgaWYgKHJlc3VsdC5pbmRleE9mKHMpID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgZmlsdGVyQ291cnNlczogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICB2YXIgb3B0X3F1ZXJ5ID0gcXVlcnkucmVwbGFjZShcImludHJvXCIsXCJpbnRyb2R1Y3Rpb25cIilcbiAgICB0aGF0ID0gdGhpc1xuICAgIHZhciByZXN1bHRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VzLmZpbHRlcihmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gKHRoYXQuaXNTdWJzZXF1ZW5jZShjLm5hbWUudG9Mb3dlckNhc2UoKSxxdWVyeSkgfHwgXG4gICAgICAgICAgICAgdGhhdC5pc1N1YnNlcXVlbmNlKGMubmFtZS50b0xvd2VyQ2FzZSgpLG9wdF9xdWVyeSkgfHxcbiAgICAgICAgICAgICBjLmNvZGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKG9wdF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yob3B0X3F1ZXJ5KSA+IC0xIHx8XG4gICAgICAgICAgICAgYy5uYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeSkgPiAtMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH0sXG5cblxuXG59KTtcbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG5cbnZhciBkYXlfdG9fbGV0dGVyID0ge1xuICAgICdNJzogICdNJywgXG4gICAgJ1QnOiAgJ1QnLCBcbiAgICAnVyc6ICAnVycsXG4gICAgJ1InOiAnVGgnLFxuICAgICdGJzogICdGJyxcbiAgICAnUyc6ICdTYScsXG4gICAgJ1UnOiAnUydcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3MgPSB0aGlzLmdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3MoKTtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gdGhpcy5nZXREYXlzQW5kVGltZXMoY29zKTtcbiAgICAgICAgdmFyIHNlY3QgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdGlvbi1udW1cIj57Y29zWzBdLm1lZXRpbmdfc2VjdGlvbn08L2Rpdj47XG4gICAgICAgIHZhciBwcm9mID0gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInByb2ZzXCI+e2Nvc1swXS5pbnN0cnVjdG9yc308L2Rpdj47XG4gICAgICAgIHZhciBzZWN0X3Byb2YgPSA8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwic2VjdC1wcm9mXCI+e3NlY3R9e3Byb2Z9PC9kaXY+O1xuICAgICAgICByZXR1cm4gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInNlY3Rpb24td3JhcHBlclwiPntzZWN0X3Byb2Z9e2RheUFuZFRpbWVzfTwvZGl2PjtcbiAgICB9LFxuXG4gICAgZ2V0UmVsYXRlZENvdXJzZU9mZmVyaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvX29iamVjdHMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucHJvcHMuYWxsX3NlY3Rpb25zW2ldO1xuICAgICAgICAgICAgaWYgKG8ubWVldGluZ19zZWN0aW9uID09IHRoaXMucHJvcHMuc2VjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvX29iamVjdHMucHVzaChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29fb2JqZWN0cztcbiAgICB9LFxuXG4gICAgZ2V0RGF5c0FuZFRpbWVzOiBmdW5jdGlvbihjb3MpIHtcbiAgICAgICAgdmFyIGRheUFuZFRpbWVzID0gY29zLm1hcChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgICByZXR1cm4gKDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkYXktdGltZVwiIGtleT17by5pZH0+e2RheV90b19sZXR0ZXJbby5kYXldICsgXCIgXCIgKyBvLnRpbWVfc3RhcnQgKyBcIi1cIiArIG8udGltZV9lbmR9PC9kaXY+KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuICggPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cImR0LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIHtkYXlBbmRUaW1lc31cbiAgICAgICAgICAgIDwvZGl2PiApXG4gICAgfVxufSk7XG4iLCJ2YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpXG5cbnZhciBSb3N0ZXJTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHlsZXM9e2JhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXIsIGJvcmRlckNvbG9yOiB0aGlzLnByb3BzLmNvbG91cn07XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXZcbiAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmlkKX1cbiAgICAgICAgc3R5bGU9e3N0eWxlc31cbiAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMudW5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgY2xhc3NOYW1lPXtcInNsb3Qtb3V0ZXIgZmMtdGltZS1ncmlkLWV2ZW50IGZjLWV2ZW50IHNsb3Qgc2xvdC1cIiArIHRoaXMucHJvcHMuaWR9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICB9LFxuICBoaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNvbG91cnMoQ09MT1VSX1RPX0hJR0hMSUdIVFt0aGlzLnByb3BzLmNvbG91cl0pO1xuICB9LFxuICB1bmhpZ2hsaWdodFNpYmxpbmdzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gIH0sXG4gIHVwZGF0ZUNvbG91cnM6IGZ1bmN0aW9uKGNvbG91cikge1xuICAgICQoXCIuc2xvdC1cIiArIHRoaXMucHJvcHMuaWQpXG4gICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3VyKVxuICAgICAgLmNzcygnYm9yZGVyLWNvbG9yJywgY29sb3VyKTtcbiAgfSxcblxufSlcblxudmFyIENvdXJzZVJvc3RlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIHVzZSB0aGUgdGltZXRhYmxlIGZvciBzbG90cyBiZWNhdXNlIGl0IGNvbnRhaW5zIHRoZSBtb3N0IGluZm9ybWF0aW9uXG4gICAgaWYgKHRoaXMucHJvcHMudGltZXRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc2xvdHMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0uY291cnNlcy5tYXAoZnVuY3Rpb24oY291cnNlKSB7XG4gICAgICAgIHZhciBjb2xvdXIgPSAgQ09VUlNFX1RPX0NPTE9VUltjb3Vyc2UuY29kZV07XG5cbiAgICAgICAgcmV0dXJuIDxSb3N0ZXJTbG90IHsuLi5jb3Vyc2V9IHRvZ2dsZU1vZGFsPXt0aGlzLnByb3BzLnRvZ2dsZU1vZGFsfSBrZXk9e2NvdXJzZS5jb2RlfSBjb2xvdXI9e2NvbG91cn0vPlxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2xvdHMgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgdHQgPSB0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCA/IHRoaXMucHJvcHMudGltZXRhYmxlc1swXSA6IG51bGw7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlciBjb3Vyc2UtbGlzdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNsZWFyZml4XCI+XG4gICAgICAgICAge3Nsb3RzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxudmFyIFRleHRib29rUm9zdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGV4dGJvb2tzID0gW11cbiAgICAgICBmb3IgKGk9MDsgaSA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMubGVuZ3RoOyBpKyspICB7XG4gICAgICAgICAgZm9yKGo9MDsgaiA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0ZXh0Ym9va3MucHVzaCh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzW2ldLnRleHRib29rc1tqXSlcbiAgICAgICAgICB9XG4gICAgICAgfVxuICAgICAgIHZhciB0Yl9lbGVtZW50cyA9IHRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICBpZiAodGJbJ2ltYWdlX3VybCddID09PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gdGJbJ2ltYWdlX3VybCddXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBcIiNcIiArICB0YlsnaXNibiddXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119PlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvdXJzZS1yb3N0ZXIgdGV4dGJvb2stbGlzdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNsZWFyZml4XCI+XG4gICAgICAgICAge3RiX2VsZW1lbnRzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9XCJzaWRlYmFyXCIgY2xhc3NOYW1lPVwic2lkZS1jb250YWluZXIgc2lkZS1jb2xsYXBzZWRcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgU2VtZXN0ZXI8L2g0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPENvdXJzZVJvc3RlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gdGltZXRhYmxlcz17dGhpcy5zdGF0ZS50aW1ldGFibGVzfS8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm9zdGVyLWhlYWRlclwiPlxuICAgICAgICAgIDxoND5Zb3VyIFRleHRib29rczwvaDQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8VGV4dGJvb2tSb3N0ZXIgLz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0IFx0PGRpdiBpZD1cImRpbS1zY3JlZW5cIj48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWxcIiBzdHlsZT17dGhpcy5wcm9wcy5zdHlsZXN9PlxuXHRcdFx0XHRcdDxoNiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtaGVhZGVyXCI+e3RoaXMucHJvcHMuaGVhZGVyfTwvaDY+XG5cdFx0XHRcdFx0PGhyIGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1zZXBhcmF0b3JcIi8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzaW1wbGUtbW9kYWwtY29udGVudFwiPlxuXHRcdFx0XHRcdFx0e3RoaXMucHJvcHMuY29udGVudH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdCk7XG5cdH0sXG5cbn0pO1xuIiwidmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBUaW1ldGFibGVTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG5cblxuLy8gbWFwcyBiYXNlIGNvbG91ciBvZiBzbG90IHRvIGNvbG91ciBvbiBoaWdobGlnaHRcbkNPTE9VUl9UT19ISUdITElHSFQgPSB7XG4gICAgXCIjRkQ3NDczXCIgOiBcIiNFMjZBNkFcIixcbiAgICBcIiM0NEJCRkZcIiA6IFwiIzI4QTRFQVwiLFxuICAgIFwiIzRDRDRCMFwiIDogXCIjM0RCQjlBXCIsXG4gICAgXCIjODg3MEZGXCIgOiBcIiM3MDU5RTZcIixcbiAgICBcIiNGOUFFNzRcIiA6IFwiI0Y3OTU0QVwiLFxuICAgIFwiI0Q0REJDOFwiIDogXCIjQjVCRkEzXCIsXG4gICAgXCIjRTdGNzZEXCIgOiBcIiNDNEQ0NERcIixcbiAgICBcIiNGMTgyQjRcIiA6IFwiI0RFNjk5RFwiLFxuICAgIFwiIzc0OTlBMlwiIDogXCIjNjY4Qjk0XCIsXG59IC8vIGNvbnNpZGVyICNDRjAwMEYsICNlOGZhYzNcbkNPVVJTRV9UT19DT0xPVVIgPSB7fVxuLy8gaG93IGJpZyBhIHNsb3Qgb2YgaGFsZiBhbiBob3VyIHdvdWxkIGJlLCBpbiBwaXhlbHNcbnZhciBIQUxGX0hPVVJfSEVJR0hUID0gMzA7XG5cbnZhciBTbG90ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7c2hvd19idXR0b25zOiBmYWxzZX07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwaW4gPSBudWxsLCByZW1vdmVfYnV0dG9uID0gbnVsbDtcbiAgICAgICAgdmFyIHNsb3Rfc3R5bGUgPSB0aGlzLmdldFNsb3RTdHlsZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNob3dfYnV0dG9ucykge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtbG9ja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgICAgIHJlbW92ZV9idXR0b24gPSAoIDxkaXYgY2xhc3NOYW1lPVwic2xvdC1pbm5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kXCIgb25DbGljaz17dGhpcy5yZW1vdmVDb3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtdGltZXMgcmVtb3ZlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpbm5lZCkge1xuICAgICAgICAgICAgcGluID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyIGJvdHRvbVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnV0dG9uLXN1cnJvdW5kIHBpbm5lZFwiIG9uQ2xpY2s9e3RoaXMudW5waW5Db3Vyc2V9ID5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtbG9ja1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5jb3Vyc2UpfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLmhpZ2hsaWdodFNpYmxpbmdzfVxuICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBjbGFzc05hbWU9e1wic2xvdC1vdXRlciBmYy10aW1lLWdyaWQtZXZlbnQgZmMtZXZlbnQgc2xvdCBzbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2V9IFxuICAgICAgICAgICAgc3R5bGU9e3Nsb3Rfc3R5bGV9PlxuICAgICAgICAgICAge3JlbW92ZV9idXR0b259XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3RoaXMucHJvcHMudGltZV9zdGFydH0g4oCTIHt0aGlzLnByb3BzLnRpbWVfZW5kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLmNvZGUgKyBcIiBcIiArIHRoaXMucHJvcHMubWVldGluZ19zZWN0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpdGxlIHNsb3QtdGV4dC1yb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICB7cGlufSAgICAgICAgICAgIFxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBzdHlsZSBvZiBhIHNwZWNpZmljIHNsb3QuIFNob3VsZCBzcGVjaWZ5IGF0XG4gICAgKiBsZWFzdCB0aGUgdG9wIHktY29vcmRpbmF0ZSBhbmQgaGVpZ2h0IG9mIHRoZSBzbG90LCBhcyB3ZWxsIGFzIGJhY2tncm91bmRDb2xvclxuICAgICogd2hpbGUgdGFraW5nIGludG8gYWNjb3VudCBpZiB0aGVyZSdzIGFuIG92ZXJsYXBwaW5nIGNvbmZsaWN0XG4gICAgKi9cbiAgICBnZXRTbG90U3R5bGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhcnRfaG91ciAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX3N0YXJ0LnNwbGl0KFwiOlwiKVswXSksXG4gICAgICAgICAgICBzdGFydF9taW51dGUgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzFdKSxcbiAgICAgICAgICAgIGVuZF9ob3VyICAgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIGVuZF9taW51dGUgICA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9lbmQuc3BsaXQoXCI6XCIpWzFdKTtcblxuICAgICAgICB2YXIgdG9wID0gKHN0YXJ0X2hvdXIgLSA4KSo1MiArIChzdGFydF9taW51dGUpKigyNi8zMCk7XG4gICAgICAgIHZhciBib3R0b20gPSAoZW5kX2hvdXIgLSA4KSo1MiArIChlbmRfbWludXRlKSooMjYvMzApIC0gMTtcbiAgICAgICAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcCAtIDI7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cyA+IDEpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucHJvcHMudGltZV9zdGFydCwgdGhpcy5wcm9wcy50aW1lX2VuZCwgdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzKVxuICAgICAgICB9XG4gICAgICAgIC8vIHRoZSBjdW11bGF0aXZlIHdpZHRoIG9mIHRoaXMgc2xvdCBhbmQgYWxsIG9mIHRoZSBzbG90cyBpdCBpcyBjb25mbGljdGluZyB3aXRoXG4gICAgICAgIHZhciB0b3RhbF9zbG90X3dpZHRocyA9IDk4IC0gKDUgKiB0aGlzLnByb3BzLmRlcHRoX2xldmVsKTtcbiAgICAgICAgLy8gdGhlIHdpZHRoIG9mIHRoaXMgcGFydGljdWxhciBzbG90XG4gICAgICAgIHZhciBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgPSB0b3RhbF9zbG90X3dpZHRocyAvIHRoaXMucHJvcHMubnVtX2NvbmZsaWN0cztcbiAgICAgICAgLy8gdGhlIGFtb3VudCBvZiBsZWZ0IG1hcmdpbiBvZiB0aGlzIHBhcnRpY3VsYXIgc2xvdCwgaW4gcGVyY2VudGFnZVxuICAgICAgICB2YXIgcHVzaF9sZWZ0ID0gKHRoaXMucHJvcHMuc2hpZnRfaW5kZXggKiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UpICsgNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWw7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBzbG90X3dpZHRoX3BlcmNlbnRhZ2UgKyBcIiVcIixcbiAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIiArIHRoaXMucHJvcHMuY29sb3VyLFxuICAgICAgICAgICAgbGVmdDogcHVzaF9sZWZ0ICsgXCIlXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMCAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IHRydWV9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgICB9LFxuICAgIHVuaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93X2J1dHRvbnM6IGZhbHNlfSk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3Vycyh0aGlzLnByb3BzLmNvbG91cik7XG4gICAgfSxcbiAgICBwaW5Db3Vyc2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5jb3Vyc2UsIFxuICAgICAgICAgICAgc2VjdGlvbjogdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb24sIFxuICAgICAgICAgICAgcmVtb3Zpbmc6IGZhbHNlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICB1bnBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHJlbW92ZUNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiAnJywgXG4gICAgICAgICAgICByZW1vdmluZzogdHJ1ZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAgICAgJChcIi5zbG90LVwiICsgdGhpcy5wcm9wcy5jb3Vyc2UpXG4gICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgICAgICAuY3NzKCdib3JkZXItY29sb3InLCBjb2xvdXIpO1xuICAgIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gW1wiTVwiLCBcIlRcIiwgXCJXXCIsIFwiUlwiLCBcIkZcIl07XG4gICAgICAgIHZhciBzbG90c19ieV9kYXkgPSB0aGlzLmdldFNsb3RzQnlEYXkoKTtcbiAgICAgICAgdmFyIGFsbF9zbG90cyA9IGRheXMubWFwKGZ1bmN0aW9uKGRheSkge1xuICAgICAgICAgICAgdmFyIGRheV9zbG90cyA9IHNsb3RzX2J5X2RheVtkYXldLm1hcChmdW5jdGlvbihzbG90KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLmlzUGlubmVkKHNsb3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2xvdCB7Li4uc2xvdH0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IGtleT17c2xvdC5pZH0gcGlubmVkPXtwfS8+XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17ZGF5fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZXZlbnQtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2RheV9zbG90c31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgIHthbGxfc2xvdHN9XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgKTtcbiAgICB9LFxuICAgXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF5cyA9IHsxOiAnbW9uJywgMjogJ3R1ZScsIDM6ICd3ZWQnLCA0OiAndGh1JywgNTogJ2ZyaSd9O1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IFwiLmZjLVwiICsgZGF5c1tkLmdldERheSgpXTtcbiAgICAgICAgLy8gJChzZWxlY3RvcikuYWRkQ2xhc3MoXCJmYy10b2RheVwiKTtcbiAgICB9LFxuXG4gICAgaXNQaW5uZWQ6IGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgdmFyIGNvbXBhcmF0b3IgPSB0aGlzLnByb3BzLmNvdXJzZXNfdG9fc2VjdGlvbnNbc2xvdC5jb3Vyc2VdWydDJ107XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bc2xvdC5tZWV0aW5nX3NlY3Rpb25bMF1dO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wYXJhdG9yID09IHNsb3QubWVldGluZ19zZWN0aW9uO1xuICAgIH0sXG5cbiAgICBnZXRTbG90c0J5RGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHtcbiAgICAgICAgICAgICdNJzogW10sXG4gICAgICAgICAgICAnVCc6IFtdLFxuICAgICAgICAgICAgJ1cnOiBbXSxcbiAgICAgICAgICAgICdSJzogW10sXG4gICAgICAgICAgICAnRic6IFtdXG4gICAgICAgIH07XG4gICAgICAgIENPVVJTRV9UT19DT0xPVVIgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgY291cnNlIGluIHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXMpIHtcbiAgICAgICAgICAgIHZhciBjcnMgPSB0aGlzLnByb3BzLnRpbWV0YWJsZS5jb3Vyc2VzW2NvdXJzZV07XG4gICAgICAgICAgICBmb3IgKHZhciBzbG90X2lkIGluIGNycy5zbG90cykge1xuICAgICAgICAgICAgICAgIHZhciBzbG90ID0gY3JzLnNsb3RzW3Nsb3RfaWRdO1xuICAgICAgICAgICAgICAgIHZhciBjb2xvdXIgPSBPYmplY3Qua2V5cyhDT0xPVVJfVE9fSElHSExJR0hUKVtjb3Vyc2VdO1xuICAgICAgICAgICAgICAgIHNsb3RbXCJjb2xvdXJcIl0gPSBjb2xvdXI7XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvZGVcIl0gPSBjcnMuY29kZS50cmltKCk7XG4gICAgICAgICAgICAgICAgc2xvdFtcIm5hbWVcIl0gPSBjcnMubmFtZTtcbiAgICAgICAgICAgICAgICBzbG90c19ieV9kYXlbc2xvdC5kYXldLnB1c2goc2xvdCk7XG4gICAgICAgICAgICAgICAgQ09VUlNFX1RPX0NPTE9VUltjcnMuY29kZV0gPSBjb2xvdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNsb3RzX2J5X2RheTtcbiAgICB9LFxuXG59KTtcbiIsInZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvY291cnNlX2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW2NvdXJzZV9hY3Rpb25zXSxcblxuICBnZXRDb3Vyc2VJbmZvOiBmdW5jdGlvbihzY2hvb2wsIGNvdXJzZV9pZCkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIrIHNjaG9vbCArIFwiL2lkL1wiICsgY291cnNlX2lkLCBcbiAgICAgICAgIHt9LCBcbiAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IGZhbHNlLCBjb3Vyc2VfaW5mbzogcmVzcG9uc2V9KTtcbiAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG5cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Y291cnNlX2luZm86IG51bGwsIGxvYWRpbmc6IHRydWV9O1xuICB9XG59KTtcbiIsInZhciBUb2FzdCA9IHJlcXVpcmUoJy4uL3RvYXN0Jyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVmbHV4LmNyZWF0ZVN0b3JlKHtcbiAgbGlzdGVuYWJsZXM6IFtUb2FzdEFjdGlvbnNdLFxuXG4gIGNyZWF0ZVRvYXN0OiBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdC1jb250YWluZXInKTtcbiAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGNvbnRhaW5lcik7XG4gICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgPFRvYXN0IGNvbnRlbnQ9e2NvbnRlbnR9IC8+LFxuICAgICAgY29udGFpbmVyXG4gICAgKTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvdG9hc3RfYWN0aW9ucy5qcycpO1xuXG5cblRUX1NUQVRFID0ge1xuICBzY2hvb2w6IFwiamh1XCIsXG4gIHNlbWVzdGVyOiBcIlNcIixcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIHByZWZlcmVuY2VzOiB7XG4gICAgJ25vX2NsYXNzZXNfYmVmb3JlJzogZmFsc2UsXG4gICAgJ25vX2NsYXNzZXNfYWZ0ZXInOiBmYWxzZSxcbiAgICAnbG9uZ193ZWVrZW5kJzogZmFsc2UsXG4gICAgJ2dyb3VwZWQnOiBmYWxzZSxcbiAgICAnZG9fcmFua2luZyc6IGZhbHNlLFxuICAgICd0cnlfd2l0aF9jb25mbGljdHMnOiBmYWxzZVxuICB9XG59XG5cblNDSE9PTF9MSVNUID0gW1wiamh1XCIsIFwidW9mdFwiXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBsb2FkaW5nOiBmYWxzZSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBwcmVmZXJlbmNlczogVFRfU1RBVEUucHJlZmVyZW5jZXMsXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZSwgLy8gdGltZXRhYmxlcyBsb2FkaW5nXG4gICAgICBjb3Vyc2VzX2xvYWRpbmc6IGZhbHNlLFxuICAgICAgc2Nob29sOiBcIlwifTtcbiAgfSxcblxuICBzZXRTY2hvb2w6IGZ1bmN0aW9uKG5ld19zY2hvb2wpIHtcbiAgICB2YXIgc2Nob29sID0gU0NIT09MX0xJU1QuaW5kZXhPZihuZXdfc2Nob29sKSA+IC0xID8gbmV3X3NjaG9vbCA6IFwiXCI7XG4gICAgdmFyIG5ld19zdGF0ZSA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgVFRfU1RBVEUuc2Nob29sID0gc2Nob29sO1xuICAgIG5ld19zdGF0ZS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgdGhpcy50cmlnZ2VyKG5ld19zdGF0ZSk7XG4gIH0sXG4gLyoqXG4gICogVXBkYXRlIFRUX1NUQVRFIHdpdGggbmV3IGNvdXJzZSByb3N0ZXJcbiAgKiBAcGFyYW0ge29iamVjdH0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24gY29udGFpbnMgYXR0cmlidXRlZCBpZCwgc2VjdGlvbiwgcmVtb3ZpbmdcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcsIGp1c3QgdXBkYXRlcyBUVF9TVEFURVxuICAqL1xuICB1cGRhdGVDb3Vyc2VzOiBmdW5jdGlvbihuZXdfY291cnNlX3dpdGhfc2VjdGlvbikge1xuICAgIGlmICh0aGlzLmxvYWRpbmcpIHtyZXR1cm47fSAvLyBpZiBsb2FkaW5nLCBkb24ndCBwcm9jZXNzLlxuICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOnRydWV9KTtcblxuICAgIHZhciByZW1vdmluZyA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnJlbW92aW5nO1xuICAgIHZhciBuZXdfY291cnNlX2lkID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uaWQ7XG4gICAgdmFyIHNlY3Rpb24gPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9uO1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgVFRfU1RBVEUpOyAvLyBkZWVwIGNvcHkgb2YgVFRfU1RBVEVcbiAgICB2YXIgY190b19zID0gbmV3X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnM7XG4gICAgXG4gICAgaWYgKCFyZW1vdmluZykgeyAvLyBhZGRpbmcgY291cnNlXG4gICAgICBpZiAoVFRfU1RBVEUuc2Nob29sID09IFwiamh1XCIpIHtcbiAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24uc2VjdGlvbn07XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChUVF9TVEFURS5zY2hvb2wgPT0gXCJ1b2Z0XCIpIHtcbiAgICAgICAgdmFyIGxvY2tlZF9zZWN0aW9ucyA9IHsnTCc6ICcnLCAnVCc6ICcnLCAnUCc6ICcnLCAnQyc6ICcnfSAvLyB0aGlzIGlzIHdoYXQgd2Ugd2FudCB0byBzZW5kIGlmIG5vdCBsb2NraW5nXG4gICAgICAgIGlmIChzZWN0aW9uKSB7IC8vIGxvY2tpbmdcbiAgICAgICAgICBpZiAoY190b19zW25ld19jb3Vyc2VfaWRdICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxvY2tlZF9zZWN0aW9ucyA9IGNfdG9fc1tuZXdfY291cnNlX2lkXTsgLy8gY29weSB0aGUgb2xkIG1hcHBpbmdcbiAgICAgICAgICAgIC8vIGluIGNhc2Ugc29tZSBzZWN0aW9ucyB3ZXJlIGFscmVhZHkgbG9ja2VkIGZvciB0aGlzIGNvdXJzZSxcbiAgICAgICAgICAgIC8vIGFuZCBub3cgd2UncmUgYWJvdXQgdG8gbG9jayBhIG5ldyBvbmUuXG4gICAgICAgICAgfVxuICAgICAgICAgIGxvY2tlZF9zZWN0aW9uc1tzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgY190b19zW25ld19jb3Vyc2VfaWRdID0gbG9ja2VkX3NlY3Rpb25zO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHsgLy8gcmVtb3ZpbmcgY291cnNlXG4gICAgICBkZWxldGUgY190b19zW25ld19jb3Vyc2VfaWRdO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGNfdG9fcykubGVuZ3RoID09IDApIHsgLy8gcmVtb3ZlZCBsYXN0IGNvdXJzZVxuICAgICAgICAgIFRUX1NUQVRFLmNvdXJzZXNfdG9fc2VjdGlvbnMgPSB7fTtcbiAgICAgICAgICB2YXIgcmVwbGFjZWQgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpO1xuICAgICAgICAgIHJlcGxhY2VkLnNjaG9vbCA9IFRUX1NUQVRFLnNjaG9vbDtcbiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIocmVwbGFjZWQpO1xuICAgICAgICAgIHJldHVybjsgIFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KG5ld19zdGF0ZSk7XG4gIH0sXG5cbiAvKipcbiAgKiBVcGRhdGUgVFRfU1RBVEUgd2l0aCBuZXcgcHJlZmVyZW5jZXNcbiAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZmVyZW5jZTogdGhlIHByZWZlcmVuY2UgdGhhdCBpcyBiZWluZyB1cGRhdGVkXG4gICogQHBhcmFtIG5ld192YWx1ZTogdGhlIG5ldyB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHByZWZlcmVuY2VcbiAgKiBAcmV0dXJuIHt2b2lkfSBkb2Vzbid0IHJldHVybiBhbnl0aGluZywganVzdCB1cGRhdGVzIFRUX1NUQVRFXG4gICovXG4gIHVwZGF0ZVByZWZlcmVuY2VzOiBmdW5jdGlvbihwcmVmZXJlbmNlLCBuZXdfdmFsdWUpIHtcbiAgICB2YXIgbmV3X3N0YXRlID0gJC5leHRlbmQodHJ1ZSwge30sIFRUX1NUQVRFKTsgLy8gZGVlcCBjb3B5IG9mIFRUX1NUQVRFXG4gICAgbmV3X3N0YXRlLnByZWZlcmVuY2VzW3ByZWZlcmVuY2VdID0gbmV3X3ZhbHVlO1xuICAgIHRoaXMudHJpZ2dlcih7cHJlZmVyZW5jZXM6IG5ld19zdGF0ZS5wcmVmZXJlbmNlc30pO1xuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuICAvLyBNYWtlcyBhIFBPU1QgcmVxdWVzdCB0byB0aGUgYmFja2VuZCB3aXRoIFRUX1NUQVRFXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbihuZXdfc3RhdGUpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6IHRydWV9KTtcbiAgICAkLnBvc3QoJy90aW1ldGFibGUvJywgSlNPTi5zdHJpbmdpZnkobmV3X3N0YXRlKSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikgeyAvLyBlcnJvciBmcm9tIFVSTCBvciBsb2NhbCBzdG9yYWdlXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RhdGEnKTtcbiAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zID0ge307XG4gICAgICAgICAgdmFyIHJlcGxhY2VkID0gdGhpcy5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICAgICAgICByZXBsYWNlZC5zY2hvb2wgPSBUVF9TVEFURS5zY2hvb2w7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHJlcGxhY2VkKTtcbiAgICAgICAgICByZXR1cm47IC8vIHN0b3AgcHJvY2Vzc2luZyBoZXJlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3BvbnNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBUVF9TVEFURSA9IG5ld19zdGF0ZTsgLy9vbmx5IHVwZGF0ZSBzdGF0ZSBpZiBzdWNjZXNzZnVsXG4gICAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgICBpZiAobmV3X3N0YXRlLmluZGV4ICYmIG5ld19zdGF0ZS5pbmRleCA8IHJlc3BvbnNlLmxlbmd0aCkge1xuICAgICAgICAgICAgaW5kZXggPSBuZXdfc3RhdGUuaW5kZXg7XG4gICAgICAgICAgICBkZWxldGUgbmV3X3N0YXRlWydpbmRleCddO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgICB0aW1ldGFibGVzOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9uczogVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyxcbiAgICAgICAgICAgICAgY3VycmVudF9pbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9ucyAhPSB7fSkgeyAvLyBjb25mbGljdFxuICAgICAgICAgIHRoaXMudHJpZ2dlcih7XG4gICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZsaWN0X2Vycm9yOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgVG9hc3RBY3Rpb25zLmNyZWF0ZVRvYXN0KFwiVGhhdCBjb3Vyc2UgY2F1c2VkIGEgY29uZmxpY3QhIFRyeSBhZ2FpbiB3aXRoIHRoZSBBbGxvdyBDb25mbGljdHMgcHJlZmVyZW5jZSB0dXJuZWQgb24uXCIpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuXG4gIGxvYWRQcmVzZXRUaW1ldGFibGU6IGZ1bmN0aW9uKHVybF9kYXRhKSB7XG4gICAgdmFyIGNvdXJzZXMgPSB1cmxfZGF0YS5zcGxpdChcIiZcIik7XG4gICAgdmFyIHNjaG9vbCA9IGNvdXJzZXMuc2hpZnQoKTtcbiAgICB2YXIgcHJlZnMgPSBjb3Vyc2VzLnNoaWZ0KCk7XG4gICAgdmFyIHByZWZlcmVuY2VzX2FycmF5ID0gcHJlZnMuc3BsaXQoXCI7XCIpO1xuICAgIHZhciBwcmVmX29iaiA9IHt9O1xuICAgIGZvciAodmFyIGsgaW4gcHJlZmVyZW5jZXNfYXJyYXkpIHtcbiAgICAgIHZhciBwcmVmX3dpdGhfdmFsID0gcHJlZmVyZW5jZXNfYXJyYXlba10uc3BsaXQoXCI9XCIpO1xuICAgICAgdmFyIHByZWYgPSBwcmVmX3dpdGhfdmFsWzBdO1xuICAgICAgdmFyIHZhbCA9IHByZWZfd2l0aF92YWxbMV07XG4gICAgICBwcmVmX29ialtwcmVmXSA9ICh2YWwgPT09ICd0cnVlJyk7XG4gICAgfVxuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZSwgc2Nob29sOiBzY2hvb2wsIHByZWZlcmVuY2VzOnByZWZfb2JqfSk7XG4gICAgVFRfU1RBVEUucHJlZmVyZW5jZXMgPSBwcmVmX29iajtcbiAgICBUVF9TVEFURS5zY2hvb2wgPSBzY2hvb2w7XG4gICAgVFRfU1RBVEUuaW5kZXggPSBwYXJzZUludChjb3Vyc2VzLnNoaWZ0KCkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291cnNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGMgPSBwYXJzZUludChjb3Vyc2VzW2ldKTtcbiAgICAgIHZhciBjb3Vyc2VfaW5mbyA9IGNvdXJzZXNbaV0uc3BsaXQoXCIrXCIpO1xuICAgICAgY291cnNlX2luZm8uc2hpZnQoKTsgLy8gcmVtb3ZlcyBmaXJzdCBlbGVtZW50XG4gICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9O1xuICAgICAgaWYgKGNvdXJzZV9pbmZvLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb3Vyc2VfaW5mby5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gY291cnNlX2luZm9bal07XG4gICAgICAgICAgaWYgKHNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICAgICAgVFRfU1RBVEUuY291cnNlc190b19zZWN0aW9uc1tjXVtzZWN0aW9uWzBdXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHNjaG9vbCA9PSBcImpodVwiKSB7XG4gICAgICAgICAgICBUVF9TVEFURS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdWydDJ10gPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm1ha2VSZXF1ZXN0KFRUX1NUQVRFKTtcbiAgfSxcblxuICBzZXRDb3Vyc2VzTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjb3Vyc2VzX2xvYWRpbmc6IHRydWV9KTtcbiAgfSxcbiAgc2V0Q291cnNlc0RvbmVMb2FkaW5nOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRyaWdnZXIoe2NvdXJzZXNfbG9hZGluZzogZmFsc2V9KTtcbiAgfSxcblxuICBzZXRDdXJyZW50SW5kZXg6IGZ1bmN0aW9uKG5ld19pbmRleCkge1xuICAgIHRoaXMudHJpZ2dlcih7Y3VycmVudF9pbmRleDogbmV3X2luZGV4fSk7XG4gIH0sXG5cblxufSk7XG4iLCJ2YXIgU2xvdE1hbmFnZXIgPSByZXF1aXJlKCcuL3Nsb3RfbWFuYWdlcicpO1xudmFyIFBhZ2luYXRpb24gPSByZXF1aXJlKCcuL3BhZ2luYXRpb24nKTtcbnZhciBVcGRhdGVUaW1ldGFibGVzU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRpbWV0YWJsZUFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdXBkYXRlX3RpbWV0YWJsZXMnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuL2FjdGlvbnMvdG9hc3RfYWN0aW9ucycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwvdGltZXRhYmxlX3V0aWwnKTtcbnZhciBOZXdQYWdpbmF0aW9uID0gcmVxdWlyZSgnLi9uZXdfcGFnaW5hdGlvbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgbWl4aW5zOiBbUmVmbHV4LmNvbm5lY3QoVXBkYXRlVGltZXRhYmxlc1N0b3JlKV0sXG5cbiAgc2V0SW5kZXg6IGZ1bmN0aW9uKG5ld19pbmRleCkge1xuICAgIHJldHVybihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAobmV3X2luZGV4ID49IDAgJiYgbmV3X2luZGV4IDwgdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnNldEN1cnJlbnRJbmRleChuZXdfaW5kZXgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgZ2V0U2hhcmVMaW5rOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGluayA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgXCIvXCI7XG4gICAgdmFyIGRhdGEgPSB0aGlzLmdldERhdGEoKTtcbiAgICByZXR1cm4gbGluayArIGRhdGE7XG4gIH0sXG4gIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVXRpbC5nZXRMaW5rRGF0YSh0aGlzLnN0YXRlLnNjaG9vbCxcbiAgICAgIHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9ucyxcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCwgdGhpcy5zdGF0ZS5wcmVmZXJlbmNlcyk7XG4gIH0sXG4gIGdldEVuZEhvdXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIGdldHMgdGhlIGVuZCBob3VyIG9mIHRoZSBjdXJyZW50IHRpbWV0YWJsZVxuICAgIHZhciBtYXhfZW5kX2hvdXIgPSAxODtcbiAgICBpZiAoIXRoaXMuaGFzVGltZXRhYmxlcygpKSB7XG4gICAgICByZXR1cm4gbWF4X2VuZF9ob3VyO1xuICAgIH1cbiAgICB2YXIgY291cnNlcyA9IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXM7XG4gICAgZm9yICh2YXIgY291cnNlX2luZGV4IGluIGNvdXJzZXMpIHtcbiAgICAgIHZhciBjb3Vyc2UgPSBjb3Vyc2VzW2NvdXJzZV9pbmRleF07XG4gICAgICBmb3IgKHZhciBzbG90X2luZGV4IGluIGNvdXJzZS5zbG90cykge1xuICAgICAgICB2YXIgc2xvdCA9IGNvdXJzZS5zbG90c1tzbG90X2luZGV4XTtcbiAgICAgICAgdmFyIGVuZF9ob3VyID0gcGFyc2VJbnQoc2xvdC50aW1lX2VuZC5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICBtYXhfZW5kX2hvdXIgPSBNYXRoLm1heChtYXhfZW5kX2hvdXIsIGVuZF9ob3VyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1heF9lbmRfaG91cjtcblxuICB9LFxuXG4gIGdldEhvdXJSb3dzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF4X2VuZF9ob3VyID0gdGhpcy5nZXRFbmRIb3VyKCk7XG4gICAgdmFyIHJvd3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gODsgaSA8PSBtYXhfZW5kX2hvdXI7IGkrKykgeyAvLyBvbmUgcm93IGZvciBlYWNoIGhvdXIsIHN0YXJ0aW5nIGZyb20gOGFtXG4gICAgICB2YXIgdGltZSA9IGkgKyBcImFtXCI7XG4gICAgICBpZiAoaSA+PSAxMikgeyAvLyB0aGUgcG0gaG91cnNcbiAgICAgICAgdmFyIGhvdXIgPSAoaSAtIDEyKSA+IDAgPyBpIC0gMTIgOiBpO1xuICAgICAgICB0aW1lID0gaG91ciArIFwicG1cIjtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaChcbiAgICAgICAgICAoPHRyIGtleT17dGltZX0+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj57dGltZX08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICA8L3RyPilcbiAgICAgICk7ICBcbiAgICAgIC8vIGZvciB0aGUgaGFsZiBob3VyIHJvd1xuICAgICAgcm93cy5wdXNoKFxuICAgICAgICAgICg8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIiBrZXk9e3RpbWUgKyBcIi1oYWxmXCJ9PlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICA8L3RyPilcbiAgICAgICk7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gcm93cztcbiAgfSxcblxuXG4gIGhhc1RpbWV0YWJsZXM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMDtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhhc190aW1ldGFibGVzID0gdGhpcy5oYXNUaW1ldGFibGVzKCk7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gIWhhc190aW1ldGFibGVzID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGU9e3RoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgICAgICAgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0vPik7XG5cbiAgICAgIHZhciBob3VycyA9IHRoaXMuZ2V0SG91clJvd3MoKTtcbiAgICAgIHZhciBvcGFjaXR5ID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8ge29wYWNpdHk6IFwiMC41XCJ9IDoge307XG4gICAgICB2YXIgaGVpZ2h0ID0gKDU3MiArICh0aGlzLmdldEVuZEhvdXIoKSAtIDE4KSo1MikgKyBcInB4XCI7XG4gICAgICByZXR1cm4gKFxuXG4gICAgICAgICAgPGRpdiBpZD1cImNhbGVuZGFyXCIgY2xhc3NOYW1lPVwiZmMgZmMtbHRyIGZjLXVudGhlbWVkXCIgc3R5bGU9e29wYWNpdHl9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRvb2xiYXJcIj5cbiAgICAgICAgICAgICAgICA8UGFnaW5hdGlvbiBcbiAgICAgICAgICAgICAgICAgIGNvdW50PXt0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RofSBcbiAgICAgICAgICAgICAgICAgIG5leHQ9e3RoaXMuc2V0SW5kZXgodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4ICsgMSl9IFxuICAgICAgICAgICAgICAgICAgcHJldj17dGhpcy5zZXRJbmRleCh0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXggLSAxKX1cbiAgICAgICAgICAgICAgICAgIHNldEluZGV4PXt0aGlzLnNldEluZGV4fVxuICAgICAgICAgICAgICAgICAgY3VycmVudF9pbmRleD17dGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4fS8+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5IHJpZ2h0IGNhbGVuZGFyLWZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICBkYXRhLWNsaXBib2FyZC10ZXh0PXt0aGlzLmdldFNoYXJlTGluaygpfT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZ1aS1jbGlwXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLWNsZWFyXCI+PC9kaXY+XG5cblxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXZpZXctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3IGZjLWFnZW5kYVdlZWstdmlldyBmYy1hZ2VuZGEtdmlld1wiPlxuICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1yb3cgZmMtd2lkZ2V0LWhlYWRlclwiIGlkPVwiY3VzdG9tLXdpZGdldC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy13aWRnZXQtaGVhZGVyXCI+PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLW1vblwiPk1vbiA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtdHVlXCI+VHVlIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy13ZWRcIj5XZWQgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXRodVwiPlRodSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtZnJpXCI+RnJpIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuXG4gICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1kYXktZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGltZS1ncmlkLWNvbnRhaW5lciBmYy1zY3JvbGxlclwiIGlkPVwiY2FsZW5kYXItaW5uZXJcIiBzdHlsZT17e2hlaWdodDogaGVpZ2h0fX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtYmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLW1vblwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdHVlXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy13ZWRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXRodVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtZnJpXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1zbGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2hvdXJzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJ3aWRnZXQtaHJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCIgaWQ9XCJzbG90LW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nsb3RfbWFuYWdlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpcCA9IG5ldyBDbGlwYm9hcmQoJy5jYWxlbmRhci1mdW5jdGlvbicpO1xuICAgIGNsaXAub24oJ3N1Y2Nlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJMaW5rIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgaWYodHlwZW9mKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc2F2ZSBuZXdseSBnZW5lcmF0ZWQgY291cnNlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgICAgIHZhciBuZXdfZGF0YSA9IHRoaXMuZ2V0RGF0YSgpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0YScsIG5ld19kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkYXRhJyk7XG4gICAgICB9XG4gICAgfSBcblxuICB9LFxuXG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt2aXNpYmxlOiB0cnVlfTtcblx0fSxcdFx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLnN0YXRlLnZpc2libGUpIHtyZXR1cm4gbnVsbDt9XG5cdFx0cmV0dXJuIChcblx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdC13cmFwcGVyIHRvYXN0aW5nXCI+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS10b2FzdFwiPnt0aGlzLnByb3BzLmNvbnRlbnR9PC9kaXY+XG5cdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy5fcmVhY3RJbnRlcm5hbEluc3RhbmNlKSB7IC8vIGlmIG1vdW50ZWQgc3RpbGxcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7dmlzaWJsZTogZmFsc2V9KTtcblx0XHRcdH1cblx0XHR9LmJpbmQodGhpcyksIDQwMDApO1xuXHR9LFxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRMaW5rRGF0YTogZnVuY3Rpb24oc2Nob29sLCBjb3Vyc2VzX3RvX3NlY3Rpb25zLCBpbmRleCwgcHJlZmVyZW5jZXMpIHtcblx0ICAgIHZhciBkYXRhID0gc2Nob29sICsgXCImXCI7XG5cdCAgICBmb3IgKHZhciBwcmVmIGluIHByZWZlcmVuY2VzKSB7XG5cdCAgICBcdGRhdGEgKz0gcHJlZiArIFwiPVwiICsgcHJlZmVyZW5jZXNbcHJlZl0gKyBcIjtcIjtcblx0ICAgIH1cblx0ICAgIGRhdGEgPSBkYXRhLnNsaWNlKDAsIC0xKTtcblx0ICAgIGRhdGEgKz0gXCImXCIgKyBpbmRleCArIFwiJlwiO1xuXHQgICAgdmFyIGNfdG9fcyA9IGNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdCAgICBmb3IgKHZhciBjb3Vyc2VfaWQgaW4gY190b19zKSB7XG5cdCAgICAgIGRhdGEgKz0gY291cnNlX2lkO1xuXG5cdCAgICAgIHZhciBtYXBwaW5nID0gY190b19zW2NvdXJzZV9pZF07XG5cdCAgICAgIGZvciAodmFyIHNlY3Rpb25faGVhZGluZyBpbiBtYXBwaW5nKSB7IC8vIGkuZSAnTCcsICdUJywgJ1AnLCAnUydcblx0ICAgICAgICBpZiAobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddICE9IFwiXCIpIHtcblx0ICAgICAgICAgIGRhdGEgKz0gXCIrXCIgKyBtYXBwaW5nW3NlY3Rpb25faGVhZGluZ107IC8vIGRlbGltaXRlciBmb3Igc2VjdGlvbnMgbG9ja2VkXG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIGRhdGEgKz0gXCImXCI7IC8vIGRlbGltaXRlciBmb3IgY291cnNlc1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgaWYgKGRhdGEubGVuZ3RoIDwgMykge2RhdGEgPSBcIlwiO31cblxuXHQgICAgcmV0dXJuIGRhdGE7XG5cdH0sXG59XG4iXX0=
