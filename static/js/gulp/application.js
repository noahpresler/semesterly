(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/course_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["getCourseInfo"]
);

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/toast_actions.js":[function(require,module,exports){
module.exports = Reflux.createActions(
  ["createToast"]
);

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/app.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./root":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/root.jsx"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/control_bar.jsx":[function(require,module,exports){
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

},{"./preference_menu":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/preference_menu.jsx","./search_bar":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/search_bar.jsx"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/evaluations.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/loader.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/modal_content.jsx":[function(require,module,exports){
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
		console.log(this.state)
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

},{"./actions/course_actions":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/course_actions.js","./actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./evaluations.jsx":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/evaluations.jsx","./loader":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/loader.jsx","./section_slot.jsx":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/section_slot.jsx","./stores/course_info":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/course_info.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/new_pagination.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/pagination.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/preference_menu.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/root.jsx":[function(require,module,exports){
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
  sidebar_collapsed: false,


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
    $('.cal-container, .side-container').removeClass('full-cal').addClass('less-cal');
  },

  collapseSideModal: function() {
    $('.cal-container, .side-container').removeClass('less-cal').addClass('full-cal');
  }


});

},{"./actions/course_actions":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/course_actions.js","./control_bar":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/control_bar.jsx","./modal_content":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/modal_content.jsx","./school_list":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/school_list.jsx","./side_bar":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/side_bar.jsx","./simple_modal":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/simple_modal.jsx","./stores/toast_store.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/toast_store.js","./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js","./timetable":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/timetable.jsx"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/school_list.jsx":[function(require,module,exports){
TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({displayName: "exports",

	render: function() {
		return 	(
			React.createElement("div", {className: "school-list"}, 
				React.createElement("div", {className: "school-picker school-jhu"}, 
					React.createElement("img", {src: "/static/img/school_logos/jhu_logo.png", 
						className: "school-logo", 
			             onClick: this.setSchool("jhu")})
				), 
				React.createElement("div", {className: "school-picker school-uoft"}, 
					React.createElement("img", {src: "/static/img/school_logos/uoft_logo.png", 
						className: "school-logo", 
			             onClick: this.setSchool("uoft")})
				)
			));
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

},{"./actions/update_timetables":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/search_bar.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/section_slot.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/side_bar.jsx":[function(require,module,exports){
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

},{"./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/simple_modal.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/slot_manager.jsx":[function(require,module,exports){
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

},{"./actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./stores/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/course_info.js":[function(require,module,exports){
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

},{"../actions/course_actions.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/course_actions.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/toast_store.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/toast_actions.js","../toast":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/toast.jsx"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js":[function(require,module,exports){
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

},{"../actions/toast_actions.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/toast_actions.js","../actions/update_timetables.js":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/timetable.jsx":[function(require,module,exports){
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

},{"./actions/toast_actions":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/toast_actions.js","./actions/update_timetables":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/actions/update_timetables.js","./new_pagination":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/new_pagination.jsx","./pagination":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/pagination.jsx","./slot_manager":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/slot_manager.jsx","./stores/update_timetables":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/stores/update_timetables.js","./util/timetable_util":"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/util/timetable_util.js"}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/toast.jsx":[function(require,module,exports){
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

},{}],"/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/util/timetable_util.js":[function(require,module,exports){
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

},{}]},{},["/Users/maxwellyeo/Documents/Github/semesterly/static/js/new_timetable/app.jsx"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcyIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMiLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcyIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9hcHAuanN4IiwiL1VzZXJzL21heHdlbGx5ZW8vRG9jdW1lbnRzL0dpdGh1Yi9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL2NvbnRyb2xfYmFyLmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9ldmFsdWF0aW9ucy5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvbG9hZGVyLmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9tb2RhbF9jb250ZW50LmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9uZXdfcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcGFnaW5hdGlvbi5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvcHJlZmVyZW5jZV9tZW51LmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9yb290LmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zY2hvb2xfbGlzdC5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VhcmNoX2Jhci5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2VjdGlvbl9zbG90LmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zaWRlX2Jhci5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc2ltcGxlX21vZGFsLmpzeCIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zbG90X21hbmFnZXIuanN4IiwiL1VzZXJzL21heHdlbGx5ZW8vRG9jdW1lbnRzL0dpdGh1Yi9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3N0b3Jlcy9jb3Vyc2VfaW5mby5qcyIsIi9Vc2Vycy9tYXh3ZWxseWVvL0RvY3VtZW50cy9HaXRodWIvc2VtZXN0ZXJseS9zdGF0aWMvanMvbmV3X3RpbWV0YWJsZS9zdG9yZXMvdG9hc3Rfc3RvcmUuanMiLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzLmpzIiwiL1VzZXJzL21heHdlbGx5ZW8vRG9jdW1lbnRzL0dpdGh1Yi9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3RpbWV0YWJsZS5qc3giLCIvVXNlcnMvbWF4d2VsbHllby9Eb2N1bWVudHMvR2l0aHViL3NlbWVzdGVybHkvc3RhdGljL2pzL25ld190aW1ldGFibGUvdG9hc3QuanN4IiwiL1VzZXJzL21heHdlbGx5ZW8vRG9jdW1lbnRzL0dpdGh1Yi9zZW1lc3Rlcmx5L3N0YXRpYy9qcy9uZXdfdGltZXRhYmxlL3V0aWwvdGltZXRhYmxlX3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhO0VBQ25DLENBQUMsZUFBZSxDQUFDO0NBQ2xCLENBQUM7OztBQ0ZGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkMsQ0FBQyxhQUFhLENBQUM7Q0FDaEI7OztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDbkM7RUFDQSxlQUFlO0VBQ2YsbUJBQW1CO0VBQ25CLHFCQUFxQjtFQUNyQixXQUFXO0VBQ1gsWUFBWTtFQUNaLGdCQUFnQjtFQUNoQixpQkFBaUI7R0FDaEI7Q0FDRixDQUFDOzs7QUNWRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUM5RCxTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUVoQixRQUFRLENBQUMsTUFB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QU0sRUFBQSxJQUFDLEVBQUE7a0NBQ0wsb0JBQUEsT0FBTSxFQUFBLElBQUMsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLE1BQVcsQ0FBSyxDQUFBLEVBQUE7c0NBQ3hFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxFQUFBLEtBQVUsQ0FBSyxDQUFBLEVBQUE7c0NBQ3ZFLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUJBQW9CLENBQUssQ0FBQTtvQ0FDcEMsQ0FBQSxFQUFBO29DQUNMLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsVUFBVyxDQUFBLEVBQUE7c0NBQ3ZCLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUssQ0FBQSxFQUFBO3NDQUN2RCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLG1CQUFvQixDQUFLLENBQUE7b0NBQ3BDLENBQUEsRUFBQTtvQ0FDTCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO3NDQUNGLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMsbUNBQW9DLENBQUEsRUFBQSxvQkFBQSxNQUFLLEVBQUEsSUFBQyxF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LElBQUksSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1VBQ3hDO1FBQ0Y7T0FDRCxJQUFJLElBQUksR0FBRyxDQUFDO01BQ2I7S0FDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN6QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0tBQ2pDLE9BQU8sSUFBSSxDQUFDO0VBQ2Y7Q0FDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVBY3Rpb25zKFxuICBbXCJnZXRDb3Vyc2VJbmZvXCJdXG4pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1wiY3JlYXRlVG9hc3RcIl1cbik7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlQWN0aW9ucyhcbiAgW1xuICBcInVwZGF0ZUNvdXJzZXNcIixcbiAgXCJ1cGRhdGVQcmVmZXJlbmNlc1wiLFxuICBcImxvYWRQcmVzZXRUaW1ldGFibGVcIixcbiAgXCJzZXRTY2hvb2xcIixcbiAgXCJzZXRMb2FkaW5nXCIsXG4gIFwic2V0RG9uZUxvYWRpbmdcIixcbiAgXCJzZXRDdXJyZW50SW5kZXhcIixcbiAgXVxuKTtcbiIsInZhciBSb290ID0gcmVxdWlyZSgnLi9yb290Jyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xuX1NFTUVTVEVSID0gXCJTXCI7XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFJvb3QgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlJylcbik7XG5cbnZhciBkYXRhID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN1YnN0cmluZygxKTsgLy8gbG9hZGluZyB0aW1ldGFibGUgZGF0YSBmcm9tIHVybFxuaWYgKCFkYXRhICYmIHR5cGVvZihTdG9yYWdlKSAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBkaWRuJ3QgZmluZCBpbiBVUkwsIHRyeSBsb2NhbCBzdG9yYWdlXG4gICAgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRhJyk7XG59IFxuaWYgKGRhdGEpIHtcblx0VGltZXRhYmxlQWN0aW9ucy5sb2FkUHJlc2V0VGltZXRhYmxlKGRhdGEpO1xufVxuIiwidmFyIFNlYXJjaEJhciA9IHJlcXVpcmUoJy4vc2VhcmNoX2JhcicpO1xudmFyIFByZWZlcmVuY2VNZW51ID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlX21lbnUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cImNvbnRyb2wtYmFyXCI+XG4gICAgICAgIDxkaXYgaWQ9XCJzZWFyY2gtYmFyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxTZWFyY2hCYXIgdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8UHJlZmVyZW5jZU1lbnUgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgKTtcbiAgfSxcbn0pO1xuIiwidmFyIEV2YWx1YXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLnNlbGVjdGVkID8gXCJldmFsLWl0ZW0gc2VsZWN0ZWRcIiA6IFwiZXZhbC1pdGVtXCJcblx0XHR2YXIgZGV0YWlscyA9ICF0aGlzLnByb3BzLnNlbGVjdGVkID8gbnVsbCA6IChcblx0XHRcdDxkaXYgaWQ9XCJkZXRhaWxzXCI+e3RoaXMucHJvcHMuZXZhbF9kYXRhLnN1bW1hcnkucmVwbGFjZSgvXFx1MDBhMC9nLCBcIiBcIil9PC9kaXY+XG5cdFx0XHQpXG5cdFx0dmFyIHByb2YgPSAhdGhpcy5wcm9wcy5zZWxlY3RlZCA/IG51bGwgOiAoXG5cdFx0XHQ8ZGl2IGlkPVwicHJvZlwiPlByb2Zlc3Nvcjoge3RoaXMucHJvcHMuZXZhbF9kYXRhLnByb2Zlc3Nvcn08L2Rpdj5cblx0XHRcdClcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNlbGVjdGlvbkNhbGxiYWNrfSA+XG5cdFx0XHQ8ZGl2IGlkPVwiZXZhbC13cmFwcGVyXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwieWVhclwiPnt0aGlzLnByb3BzLmV2YWxfZGF0YS55ZWFyfTwvZGl2PlxuXHRcdFx0XHR7cHJvZn1cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyYXRpbmctd3JhcHBlclwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic3Rhci1yYXRpbmdzLXNwcml0ZVwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gc3R5bGU9e3t3aWR0aDogMTAwKnRoaXMucHJvcHMuZXZhbF9kYXRhLnNjb3JlLzUgKyBcIiVcIn19IGNsYXNzTmFtZT1cInJhdGluZ1wiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm51bWVyaWMtcmF0aW5nXCI+e1wiKFwiICsgdGhpcy5wcm9wcy5ldmFsX2RhdGEuc2NvcmUgKyBcIilcIn08L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdHtkZXRhaWxzfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbmRleF9zZWxlY3RlZDogbnVsbFxuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIGV2YWxzID0gdGhpcy5wcm9wcy5ldmFsX2luZm8ubWFwKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGkrKztcblx0XHRcdHZhciBzZWxlY3RlZCA9IGkgPT0gdGhpcy5zdGF0ZS5pbmRleF9zZWxlY3RlZDtcblx0XHRcdHJldHVybiAoPEV2YWx1YXRpb24gZXZhbF9kYXRhPXtlfSBrZXk9e2UuaWR9IHNlbGVjdGlvbkNhbGxiYWNrPXt0aGlzLmNoYW5nZVNlbGVjdGVkKGkpfSBzZWxlY3RlZD17c2VsZWN0ZWR9IC8+KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBjbGlja19ub3RpY2UgPSB0aGlzLnByb3BzLmV2YWxfaW5mby5sZW5ndGggPT0gMCA/ICg8ZGl2IGlkPVwiZW1wdHktaW50cm9cIj5ObyBjb3Vyc2UgZXZhbHVhdGlvbnMgZm9yIHRoaXMgY291cnNlIHlldDwvZGl2PikgOiAoPGRpdiBpZD1cImNsaWNrLWludHJvXCI+Q2xpY2sgYW4gZXZhbHVhdGlvbiBpdGVtIGFib3ZlIHRvIHJlYWQgdGhlIGNvbW1lbnRzPC9kaXY+KTtcblx0XHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1ldmFsdWF0aW9uc1wiPlxuXHRcdFx0PGg2PkNvdXJzZSBFdmFsdWF0aW9uczo8L2g2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJldmFsLXdyYXBwZXJcIj5cblx0XHRcdFx0e2V2YWxzfVxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Y2xpY2tfbm90aWNlfVxuXHRcdDwvZGl2Pik7XG5cdH0sXG5cblx0Y2hhbmdlU2VsZWN0ZWQ6IGZ1bmN0aW9uKGVfaW5kZXgpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuc3RhdGUuaW5kZXhfc2VsZWN0ZWQgPT0gZV9pbmRleCkgXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBudWxsfSk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2luZGV4X3NlbGVjdGVkOiBlX2luZGV4fSk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBpZD1cImxvYWRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUtZ3JpZFwiPlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmUxXCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTJcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlM1wiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU0XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZTVcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlNlwiPjwvZGl2PlxuXHQgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzay1jdWJlIHNrLWN1YmU3XCI+PC9kaXY+XG5cdCAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNrLWN1YmUgc2stY3ViZThcIj48L2Rpdj5cblx0ICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2stY3ViZSBzay1jdWJlOVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+KTtcblx0fSxcbn0pO1xuXG4iLCJ2YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbnZhciBDb3Vyc2VJbmZvU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9jb3Vyc2VfaW5mbycpO1xudmFyIEV2YWx1YXRpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9ldmFsdWF0aW9ucy5qc3gnKTtcbnZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgQ291cnNlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNlY3Rpb25TbG90ID0gcmVxdWlyZSgnLi9zZWN0aW9uX3Nsb3QuanN4JylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdG1peGluczogW1JlZmx1eC5jb25uZWN0KENvdXJzZUluZm9TdG9yZSldLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxvYWRlciA9IHRoaXMuc3RhdGUubG9hZGluZyA/IDxMb2FkZXIgLz4gOiBudWxsO1xuXHRcdHZhciBoZWFkZXIgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRIZWFkZXIoKVxuXHRcdHZhciBkZXNjcmlwdGlvbiA9IHRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldERlc2NyaXB0aW9uKClcblx0XHR2YXIgZXZhbHVhdGlvbnMgPSB0aGlzLnN0YXRlLmxvYWRpbmcgPyBudWxsIDogdGhpcy5nZXRFdmFsdWF0aW9ucygpXG5cdFx0dmFyIHJlY29tZW5kYXRpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0UmVjb21lbmRhdGlvbnMoKVxuXHRcdHZhciB0ZXh0Ym9va3MgPXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOiB0aGlzLmdldFRleHRib29rcygpXG5cdFx0dmFyIHNlY3Rpb25zID0gdGhpcy5zdGF0ZS5sb2FkaW5nID8gbnVsbCA6IHRoaXMuZ2V0U2VjdGlvbnMoKVxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPVwibW9kYWwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHtsb2FkZXJ9XG4gICAgICAgICAgICAgICAge2hlYWRlcn1cbiAgICAgICAgICAgICAgICB7ZGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAge2V2YWx1YXRpb25zfVxuICAgICAgICAgICAgICAgIHtzZWN0aW9uc31cbiAgICAgICAgICAgICAgICB7dGV4dGJvb2tzfVxuICAgICAgICAgICAgICAgIHtyZWNvbWVuZGF0aW9uc31cbiAgICAgICAgICAgIDwvZGl2Pik7XG5cdH0sXG5cblx0Z2V0SGVhZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVhZGVyID0gKDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtaGVhZGVyXCI+XG5cdFx0XHQ8ZGl2IGlkPVwiY291cnNlLWluZm8td3JhcHBlclwiPlxuXHRcdFx0XHQ8ZGl2IGlkPVwibmFtZVwiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLm5hbWV9PC9kaXY+XG5cdFx0XHRcdDxkaXYgaWQ9XCJjb2RlXCI+e3RoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZX08L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiY291cnNlLWFjdGlvbiBmdWktcGx1c1wiIG9uQ2xpY2s9e3RoaXMuYWRkQ291cnNlKCl9Lz5cblx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGhlYWRlclxuXHR9LFxuXG5cdGFkZENvdXJzZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMuc3RhdGUuY291cnNlX2luZm8uaWQsIHNlY3Rpb246ICcnLCByZW1vdmluZzogZmFsc2V9KTtcblx0XHR9LmJpbmQodGhpcykpO1xuXHR9LFxuXG5cdG9wZW5SZWNvbWVuZGF0aW9uOiBmdW5jdGlvbihjb3Vyc2VfaWQpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0Q291cnNlQWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMucHJvcHMuc2Nob29sLCBjb3Vyc2VfaWQpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblx0Z2V0RGVzY3JpcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXNjcmlwdGlvbiA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS1kZXNjcmlwdGlvblwiPlxuXHRcdFx0XHQ8aDY+RGVzY3JpcHRpb246PC9oNj5cblx0XHRcdFx0e3RoaXMuc3RhdGUuY291cnNlX2luZm8uZGVzY3JpcHRpb259XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIGRlc2NyaXB0aW9uO1xuXHR9LFxuXG5cdGdldEV2YWx1YXRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gPEV2YWx1YXRpb25NYW5hZ2VyIGV2YWxfaW5mbz17dGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5ldmFsX2luZm99IC8+XG5cdH0sXG5cblx0Z2V0UmVjb21lbmRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZWxhdGVkID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5yZWxhdGVkX2NvdXJzZXMuc2xpY2UoMCwzKS5tYXAoZnVuY3Rpb24ocmMpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwicmVjb21tZW5kYXRpb25cIiBvbkNsaWNrPXt0aGlzLm9wZW5SZWNvbWVuZGF0aW9uKHJjLmlkKX0ga2V5PXtyYy5pZH0+XG4gICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjZW50ZXItd3JhcHBlclwiPlxuXHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJyZWMtd3JhcHBlclwiPlxuXHRcdCAgICAgICAgICAgIFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5hbWVcIj57cmMubmFtZX08L2Rpdj5cblx0XHQgICAgICAgICAgICBcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2RlXCI+e3JjLmNvZGV9PC9kaXY+XG5cdFx0ICAgICAgICAgICAgXHQ8L2Rpdj5cblx0XHQgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFx0PC9kaXY+KVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXHRcdHZhciByZWNvbWVuZGF0aW9ucyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8ucmVsYXRlZF9jb3Vyc2VzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG5cdFx0XHQoPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1lbnRyeVwiPlxuXHRcdFx0XHQ8aDY+Q291cnNlcyBZb3UgTWlnaHQgTGlrZTo8L2g2PlxuXHRcdFx0XHQ8ZGl2IGlkPVwiY291cnNlLXJlY29tZW5kYXRpb25zXCI+XG5cdFx0XHRcdFx0e3JlbGF0ZWR9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KVxuXHRcdHJldHVybiByZWNvbWVuZGF0aW9uc1xuXHR9LFxuXG5cdGV4cGFuZFJlY29tZW5kYXRpb25zOiBmdW5jdGlvbigpIHtcblxuXHR9LFxuXG5cdGdldFRleHRib29rczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRleHRib29rX2VsZW1lbnRzID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby50ZXh0Ym9va19pbmZvWzBdLnRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBcdDxkaXYgY2xhc3NOYW1lPVwidGV4dGJvb2tcIiBrZXk9e3RiLmlkfT5cbiAgICAgICAgICAgIFx0XHQ8aW1nIGhlaWdodD1cIjEyNVwiIHNyYz17dGIuaW1hZ2VfdXJsfS8+XG4gICAgICAgICAgICBcdFx0PGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGIudGl0bGV9PC9oNj5cbiAgICAgICAgICAgIFx0XHQ8ZGl2Pnt0Yi5hdXRob3J9PC9kaXY+XG4gICAgICAgICAgICBcdFx0PGRpdj5JU0JOOnt0Yi5pc2JufTwvZGl2PlxuICAgICAgICAgICAgXHRcdDxhIGhyZWY9e3RiLmRldGFpbF91cmx9IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgXHRcdFx0PGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgIFx0XHQ8L2E+XG4gICAgICAgICAgICBcdDwvZGl2Pik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cdFx0dmFyIHRleHRib29rcyA9IHRoaXMuc3RhdGUuY291cnNlX2luZm8udGV4dGJvb2tfaW5mb1swXS50ZXh0Ym9va3MubGVuZ3RoID09IDAgPyAoPGRpdiBpZD1cImVtcHR5LWludHJvXCI+Tm8gdGV4dGJvb2tzIHlldCBmb3IgdGhpcyBjb3Vyc2U8L2Rpdj4pIDpcblx0XHRcdFx0KDxkaXYgaWQ9XCJ0ZXh0Ym9va3NcIj5cblx0ICAgICAgICAgICAgXHR7dGV4dGJvb2tfZWxlbWVudHN9XG5cdCAgICAgICAgICAgIDwvZGl2Pik7XG5cdFx0dmFyIHJldCA9IFxuXHRcdFx0KDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZW50cnlcIiBpZD1cImNvdXJzZS10ZXh0Ym9va3NcIj5cblx0XHRcdFx0PGg2PlRleHRib29rczo8L2g2PlxuXHRcdFx0XHR7dGV4dGJvb2tzfVxuXHRcdFx0PC9kaXY+KTtcblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGdldFNlY3Rpb25zOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyh0aGlzLnN0YXRlKVxuXHRcdHZhciBGID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX0Zfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdHZhciBTID0gdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19TLm1hcChmdW5jdGlvbihzKXtcblx0XHRcdHJldHVybiAoPFNlY3Rpb25TbG90IGtleT17cy5pZH0gYWxsX3NlY3Rpb25zPXt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1Nfb2Jqc30gc2VjdGlvbj17c30vPilcblx0XHR9LmJpbmQodGhpcykpO1xuXHRcdGlmICh0aGlzLnN0YXRlLnNob3dfc2VjdGlvbnMgPT09IHRoaXMuc3RhdGUuY291cnNlX2luZm8uY29kZSkge1xuXHRcdFx0dmFyIHNlY19kaXNwbGF5ID0gKFxuXHRcdFx0XHQ8ZGl2IGlkPVwiYWxsLXNlY3Rpb25zLXdyYXBwZXJcIj5cblx0XHRcdFx0XHR7Rn1cblx0XHRcdFx0XHR7U31cblx0XHRcdFx0PC9kaXY+KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgc2VjX2Rpc3BsYXkgPSAoPGRpdiBpZD1cIm51bVNlY3Rpb25zXCIgb25DbGljaz17dGhpcy5zZXRTaG93U2VjdGlvbnModGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5jb2RlKX0+VGhpcyBjb3Vyc2UgaGFzIDxiPnt0aGlzLnN0YXRlLmNvdXJzZV9pbmZvLnNlY3Rpb25zX1MubGVuZ3RoICsgdGhpcy5zdGF0ZS5jb3Vyc2VfaW5mby5zZWN0aW9uc19GLmxlbmd0aH08L2I+IHNlY3Rpb25zLiBDbGljayB0byB2aWV3IHRoZW0uPC9kaXY+KVxuXHRcdH1cblx0XHR2YXIgc2VjdGlvbnMgPSBcblx0XHRcdCg8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWVudHJ5XCIgaWQ9XCJjb3Vyc2Utc2VjdGlvbnNcIj5cblx0XHRcdFx0PGg2PkNvdXJzZSBTZWN0aW9uczo8L2g2PlxuXHRcdFx0XHR7c2VjX2Rpc3BsYXl9XG5cdFx0XHQ8L2Rpdj4pXG5cdFx0cmV0dXJuIHNlY3Rpb25zXG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd19zZWN0aW9uczogMFxuXHRcdH07XG5cdH0sXG5cblx0c2V0U2hvd1NlY3Rpb25zOiBmdW5jdGlvbihpZCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtzaG93X3NlY3Rpb25zOiBpZH0pO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cblxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICAgIFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIFx0dmFyIG9wdGlvbnMgPSBbXSwgY291bnQgPSB0aGlzLnByb3BzLmNvdW50LCBjdXJyZW50ID0gdGhpcy5wcm9wcy5jdXJyZW50X2luZGV4O1xuICAgIFx0aWYgKGNvdW50IDw9IDEpIHsgcmV0dXJuIG51bGw7IH0gLy8gZG9uJ3QgZGlzcGxheSBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHNjaGVkdWxlc1xuICAgIFx0dmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgXHR2YXIgbGltaXQgPSBNYXRoLm1pbihmaXJzdCArIDksIGNvdW50KTtcbiAgICBcdGZvciAodmFyIGkgPSBmaXJzdDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgXHQgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBcdFx0b3B0aW9ucy5wdXNoKFxuICAgICAgICBcdFx0PGxpIGtleT17aX0gY2xhc3NOYW1lPXtcInNlbS1wYWdlIFwiICsgY2xhc3NOYW1lfSBvbkNsaWNrPXt0aGlzLnByb3BzLnNldEluZGV4KGkpfT5cbiAgICAgICAgICAgICBcdFx0IHtpICsgMX1cbiAgICAgICBcdFx0XHQ8L2xpPik7XG4gIFx0XHR9XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VtLXBhZ2luYXRpb25cIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXYgbmF2LWRvdWJsZSBuYXYtZG91YmxlLXByZXZcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtbGVmdCBzZW0tcGFnaW5hdGlvbi1wcmV2IHNlbS1wYWdpbmF0aW9uLWljb25cIiAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLnByZXZ9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWxlZnQgc2VtLXBhZ2luYXRpb24tcHJldiBzZW0tcGFnaW5hdGlvbi1pY29uXCIgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxvbCBjbGFzc05hbWU9XCJzZW0tcGFnZXNcIj5cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0PC9vbD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tcGFnaW5hdGlvbi1uYXZcIiBvbkNsaWNrPXt0aGlzLnByb3BzLm5leHR9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlbS1wYWdpbmF0aW9uLW5hdiBuYXYtZG91YmxlIG5hdi1kb3VibGUtbmV4dFwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtYW5nbGUtZG91YmxlLXJpZ2h0IHNlbS1wYWdpbmF0aW9uLW5leHQgc2VtLXBhZ2luYXRpb24taWNvblwiIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fSxcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zmlyc3RfZGlzcGxheWVkOiAwfTtcbiAgfSxcblxuICBjaGFuZ2VQYWdlOiBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICB2YXIgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCxcbiAgICAgICAgICAgY291bnQgPSB0aGlzLnByb3BzLmNvdW50O1xuICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGZpcnN0X2Rpc3BsYXllZCBidXR0b24gKHRpbWV0YWJsZSlcbiAgICAgICB2YXIgbmV3X2ZpcnN0ID0gY3VycmVudCArICg5KmRpcmVjdGlvbikgLSAoY3VycmVudCAlIDkpO1xuICAgICAgIGlmIChuZXdfZmlyc3QgPj0gMCAmJiBuZXdfZmlyc3QgPCBjb3VudCkge1xuICAgICAgICB0aGlzLnByb3BzLnNldEluZGV4KG5ld19maXJzdCkoKTtcbiAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcHRpb25zID0gW10sIGNvdW50ID0gdGhpcy5wcm9wcy5jb3VudCwgY3VycmVudCA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleDtcbiAgICBpZiAoY291bnQgPD0gMSkgeyByZXR1cm4gbnVsbDsgfSAvLyBkb24ndCBkaXNwbGF5IGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggc2NoZWR1bGVzXG4gICAgdmFyIGZpcnN0ID0gY3VycmVudCAtIChjdXJyZW50ICUgOSk7IC8vIHJvdW5kIGRvd24gdG8gbmVhcmVzdCBtdWx0aXBsZSBvZiA5XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4oZmlyc3QgKyA5LCBjb3VudCk7XG4gICAgZm9yICh2YXIgaSA9IGZpcnN0OyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY3VycmVudF9pbmRleCA9PSBpID8gXCJhY3RpdmVcIiA6IFwiXCI7XG4gICAgICBvcHRpb25zLnB1c2goXG4gICAgICAgIDxsaSBrZXk9e2l9IGNsYXNzTmFtZT17Y2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgPGEgb25DbGljaz17dGhpcy5wcm9wcy5zZXRJbmRleChpKX0+e2kgKyAxfTwvYT5cbiAgICAgICAgPC9saT4pO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbiBwYWdpbmF0aW9uLW1pbmltYWxcIj5cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwicHJldi1kb3VibGVcIiBvbkNsaWNrPXt0aGlzLmNoYW5nZVBhZ2UoLTEpfT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdpbmF0aW9uLWJ0blwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJwcmV2aW91c1wiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctbGVmdCBwYWdpbmF0aW9uLWJ0blwiIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMucHJldn0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIHtvcHRpb25zfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibmV4dFwiPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJmdWktYXJyb3ctcmlnaHQgcGFnaW5hdGlvbi1idG5cIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMubmV4dH0+PC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJuZXh0LWRvdWJsZVwiIG9uQ2xpY2s9e3RoaXMuY2hhbmdlUGFnZSgxKX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnaW5hdGlvbi1idG5cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hbmdsZS1kb3VibGUtcmlnaHRcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG4gIFxuXG59KTsiLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxudmFyIEJpbmFyeVByZWZlcmVuY2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdG9nZ2xlX2xhYmVsID0gXCJjbW4tdG9nZ2xlLVwiICsgdGhpcy5wcm9wcy50b2dnbGVfaWQ7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS1pdGVtXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHJlZmVyZW5jZS10ZXh0XCI+XG4gICAgICAgICAgPGxpPiB7dGhpcy5wcm9wcy50ZXh0fSA8L2xpPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVmZXJlbmNlLXRvZ2dsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoXCI+XG4gICAgICAgICAgICA8aW5wdXQgcmVmPVwiY2hlY2tib3hfZWxlbVwiIGlkPXt0b2dnbGVfbGFiZWx9IFxuICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNtbi10b2dnbGUgY21uLXRvZ2dsZS1yb3VuZFwiIHR5cGU9XCJjaGVja2JveFwiIFxuICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMudG9nZ2xlUHJlZmVyZW5jZX0vPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9e3RvZ2dsZV9sYWJlbH0+PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIHRvZ2dsZVByZWZlcmVuY2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdfdmFsdWUgPSB0aGlzLnJlZnMuY2hlY2tib3hfZWxlbS5jaGVja2VkO1xuICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlUHJlZmVyZW5jZXModGhpcy5wcm9wcy5uYW1lLCBuZXdfdmFsdWUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGN1cnJlbnRfdG9nZ2xlX2lkOiAwLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzTmFtZT1cImNvbGxhcHNlXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2YmFyLWNvbGxhcHNlXCIgPlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJuYXYgbmF2YmFyLW5hdlwiIGlkPVwibWVudVwiPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPEJpbmFyeVByZWZlcmVuY2UgdGV4dD1cIkF2b2lkIGVhcmx5IGNsYXNzZXNcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lPVwibm9fY2xhc3Nlc19iZWZvcmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQXZvaWQgbGF0ZSBjbGFzc2VzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cIm5vX2NsYXNzZXNfYWZ0ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZV9pZD17dGhpcy5nZXRfbmV4dF90b2dnbGVfaWQoKX0gLz5cbiAgICAgICAgICAgICAgICA8QmluYXJ5UHJlZmVyZW5jZSB0ZXh0PVwiQWxsb3cgY29uZmxpY3RzXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT1cInRyeV93aXRoX2NvbmZsaWN0c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlX2lkPXt0aGlzLmdldF9uZXh0X3RvZ2dsZV9pZCgpfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0X25leHRfdG9nZ2xlX2lkOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmN1cnJlbnRfdG9nZ2xlX2lkICs9IDFcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50X3RvZ2dsZV9pZDtcbiAgfVxuXG59KTsiLCJ2YXIgQ29udHJvbEJhciA9IHJlcXVpcmUoJy4vY29udHJvbF9iYXInKTtcbnZhciBUaW1ldGFibGUgPSByZXF1aXJlKCcuL3RpbWV0YWJsZScpO1xudmFyIE1vZGFsQ29udGVudCA9IHJlcXVpcmUoJy4vbW9kYWxfY29udGVudCcpO1xudmFyIFRvYXN0U3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy90b2FzdF9zdG9yZS5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcbnZhciBjb3Vyc2VfYWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucycpO1xudmFyIFNpZGViYXIgPSByZXF1aXJlKCcuL3NpZGVfYmFyJyk7XG52YXIgU2ltcGxlTW9kYWwgPSByZXF1aXJlKCcuL3NpbXBsZV9tb2RhbCcpO1xudmFyIFNjaG9vbExpc3QgPSByZXF1aXJlKCcuL3NjaG9vbF9saXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSksIFJlZmx1eC5jb25uZWN0KFRvYXN0U3RvcmUpXSxcbiAgc2lkZWJhcl9jb2xsYXBzZWQ6IGZhbHNlLFxuXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgTW9kYWwgPSBCb3JvblsnT3V0bGluZU1vZGFsJ107XG4gICAgdmFyIHNjaG9vbF9zZWxlY3RvciA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5zY2hvb2wgPT0gXCJcIikge1xuICAgICAgc2Nob29sX3NlbGVjdG9yID0gKFxuICAgICAgPFNpbXBsZU1vZGFsIGhlYWRlcj17XCJTZW1lc3Rlci5seSB8IFdlbGNvbWVcIn1cbiAgICAgICAgICAgICAgICAgICBzdHlsZXM9e3tiYWNrZ3JvdW5kQ29sb3I6IFwiI0ZERjVGRlwiLCBjb2xvcjogXCIjMDAwXCJ9fSBcbiAgICAgICAgICAgICAgICAgICBjb250ZW50PXs8U2Nob29sTGlzdCBzZXRTY2hvb2w9e3RoaXMuc2V0U2Nob29sfS8+IH0vPlxuICAgICAgKTt9XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9XCJyb290XCI+XG4gICAgICAgIHtzY2hvb2xfc2VsZWN0b3J9XG4gICAgICAgIDxkaXYgaWQ9XCJ0b2FzdC1jb250YWluZXJcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cInNlbWVzdGVybHktbmFtZVwiPlNlbWVzdGVyLmx5PC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJjb250cm9sLWJhci1jb250YWluZXJcIj5cbiAgICAgICAgICA8Q29udHJvbEJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cIm5hdmljb25cIiBvbkNsaWNrPXt0aGlzLnRvZ2dsZVNpZGVNb2RhbH0+XG4gICAgICAgICAgPHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwibW9kYWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgPE1vZGFsIGNsb3NlT25DbGljaz17dHJ1ZX0gcmVmPSdPdXRsaW5lTW9kYWwnIGNsYXNzTmFtZT1cImNvdXJzZS1tb2RhbFwiPlxuICAgICAgICAgICAgICA8TW9kYWxDb250ZW50IHNjaG9vbD17dGhpcy5zdGF0ZS5zY2hvb2x9Lz5cbiAgICAgICAgICA8L01vZGFsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhbGwtY29scy1jb250YWluZXJcIj5cbiAgICAgICAgICA8U2lkZWJhciB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0vPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2FsLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgPFRpbWV0YWJsZSB0b2dnbGVNb2RhbD17dGhpcy50b2dnbGVDb3Vyc2VNb2RhbH0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG5cblxuICB0b2dnbGVDb3Vyc2VNb2RhbDogZnVuY3Rpb24oY291cnNlX2lkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlZnNbJ091dGxpbmVNb2RhbCddLnRvZ2dsZSgpO1xuICAgICAgICBjb3Vyc2VfYWN0aW9ucy5nZXRDb3Vyc2VJbmZvKHRoaXMuc3RhdGUuc2Nob29sLCBjb3Vyc2VfaWQpO1xuICAgIH0uYmluZCh0aGlzKTsgXG4gIH0sXG5cblxuICB0b2dnbGVTaWRlTW9kYWw6IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kU2lkZU1vZGFsKCk7XG4gICAgICB0aGlzLnNpZGViYXJfY29sbGFwc2VkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2VTaWRlTW9kYWwoKTtcbiAgICAgIHRoaXMuc2lkZWJhcl9jb2xsYXBzZWQgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBleHBhbmRTaWRlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICQoJy5jYWwtY29udGFpbmVyLCAuc2lkZS1jb250YWluZXInKS5yZW1vdmVDbGFzcygnZnVsbC1jYWwnKS5hZGRDbGFzcygnbGVzcy1jYWwnKTtcbiAgfSxcblxuICBjb2xsYXBzZVNpZGVNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgJCgnLmNhbC1jb250YWluZXIsIC5zaWRlLWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCdsZXNzLWNhbCcpLmFkZENsYXNzKCdmdWxsLWNhbCcpO1xuICB9XG5cblxufSk7XG4iLCJUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFx0KFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzY2hvb2wtbGlzdFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLWpodVwiPlxuXHRcdFx0XHRcdDxpbWcgc3JjPVwiL3N0YXRpYy9pbWcvc2Nob29sX2xvZ29zL2podV9sb2dvLnBuZ1wiIFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwic2Nob29sLWxvZ29cIlxuXHRcdFx0ICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuc2V0U2Nob29sKFwiamh1XCIpfS8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNjaG9vbC1waWNrZXIgc2Nob29sLXVvZnRcIj5cblx0XHRcdFx0XHQ8aW1nIHNyYz1cIi9zdGF0aWMvaW1nL3NjaG9vbF9sb2dvcy91b2Z0X2xvZ28ucG5nXCIgXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJzY2hvb2wtbG9nb1wiXG5cdFx0XHQgICAgICAgICAgICAgb25DbGljaz17dGhpcy5zZXRTY2hvb2woXCJ1b2Z0XCIpfS8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+KTtcblx0fSxcblxuXHRzZXRTY2hvb2w6IGZ1bmN0aW9uKG5ld19zY2hvb2wpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0VGltZXRhYmxlQWN0aW9ucy5zZXRTY2hvb2wobmV3X3NjaG9vbCk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblxufSk7XG5cbiIsInZhciBUaW1ldGFibGVBY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVGltZXRhYmxlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xuXG52YXIgU2VhcmNoUmVzdWx0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaV9jbGFzcyA9IFwic2VhcmNoLXJlc3VsdFwiLCBpY29uX2NsYXNzID0gXCJmdWktcGx1c1wiO1xuICAgIGlmICh0aGlzLnByb3BzLmluX3Jvc3Rlcikge1xuICAgICAgbGlfY2xhc3MgKz0gXCIgdG9kby1kb25lXCI7XG4gICAgICBpY29uX2NsYXNzID0gXCJmdWktY2hlY2tcIjtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxsaSBjbGFzc05hbWU9e2xpX2NsYXNzfSBvbk1vdXNlRG93bj17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmlkKX0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidG9kby1jb250ZW50XCI+XG4gICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRvZG8tbmFtZVwiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMuY29kZX1cbiAgICAgICAgICA8L2g0PlxuICAgICAgICAgIHt0aGlzLnByb3BzLm5hbWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9e1wic2VhcmNoLXJlc3VsdC1hY3Rpb24gXCIgKyBpY29uX2NsYXNzfSBcbiAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy50b2dnbGVDb3Vyc2V9PlxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2xpPlxuICAgICk7XG4gIH0sXG5cbiAgdG9nZ2xlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHJlbW92aW5nID0gdGhpcy5wcm9wcy5pbl9yb3N0ZXI7XG4gICAgVGltZXRhYmxlQWN0aW9ucy51cGRhdGVDb3Vyc2VzKHtpZDogdGhpcy5wcm9wcy5pZCwgc2VjdGlvbjogJycsIHJlbW92aW5nOiByZW1vdmluZ30pO1xuICAgIGUucHJldmVudERlZmF1bHQoKTsgIC8vIHN0b3AgaW5wdXQgZnJvbSB0cmlnZ2VyaW5nIG9uQmx1ciBhbmQgdGh1cyBoaWRpbmcgcmVzdWx0c1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIHN0b3AgcGFyZW50IGZyb20gb3BlbmluZyBtb2RhbFxuICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY291cnNlczpbXSxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgZm9jdXNlZDogZmFsc2UsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlOiBmdW5jdGlvbihuZXdfcHJvcHMsIG5ld19zdGF0ZSkge1xuICAgIGlmIChuZXdfc3RhdGUuc2Nob29sICE9IHRoaXMuc3RhdGUuc2Nob29sKSB7XG4gICAgICB0aGlzLmdldENvdXJzZXMobmV3X3N0YXRlLnNjaG9vbCk7XG4gICAgfVxuXG4gIH0sXG4gIGdldENvdXJzZXM6IGZ1bmN0aW9uKHNjaG9vbCkge1xuICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0TG9hZGluZygpO1xuICAgICQuZ2V0KFwiL2NvdXJzZXMvXCIgKyBzY2hvb2wgKyBcIi9cIiArIF9TRU1FU1RFUiwgXG4gICAgICAgIHt9LCBcbiAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjb3Vyc2VzOiByZXNwb25zZX0pO1xuICAgICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0RG9uZUxvYWRpbmcoKTtcblxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlYXJjaF9yZXN1bHRzX2RpdiA9IHRoaXMuZ2V0U2VhcmNoUmVzdWx0c0NvbXBvbmVudCgpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPVwic2VhcmNoLWJhclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlucHV0LWNvbWJpbmVcIj5cbiAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgY29kZSwgdGl0bGUsIGRlc2NyaXB0aW9uLCBwcm9mZXNzb3IsIGRlZ3JlZVwiIFxuICAgICAgICAgICAgaWQ9XCJzZWFyY2gtaW5wdXRcIiBcbiAgICAgICAgICAgIHJlZj1cImlucHV0XCIgXG4gICAgICAgICAgICBvbkZvY3VzPXt0aGlzLmZvY3VzfSBvbkJsdXI9e3RoaXMuYmx1cn0gXG4gICAgICAgICAgICBvbklucHV0PXt0aGlzLnF1ZXJ5Q2hhbmdlZH0vPlxuICAgICAgICAgIDxidXR0b24gZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI21lbnUtY29udGFpbmVyXCIgaWQ9XCJtZW51LWJ0blwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNsaWRlcnNcIj5cbiAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3hcIj48L2Rpdj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJveFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm94XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIHtzZWFyY2hfcmVzdWx0c19kaXZ9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWFyY2hSZXN1bHRzQ29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZm9jdXNlZCB8fCB0aGlzLnN0YXRlLnJlc3VsdHMubGVuZ3RoID09IDApIHtyZXR1cm4gbnVsbDt9XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzZWFyY2hfcmVzdWx0cyA9IHRoaXMuc3RhdGUucmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgaSsrO1xuICAgICAgdmFyIGluX3Jvc3RlciA9IHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9uc1tyLmlkXSAhPSBudWxsO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlYXJjaFJlc3VsdCB7Li4ucn0ga2V5PXtpfSBpbl9yb3N0ZXI9e2luX3Jvc3Rlcn0gdG9nZ2xlTW9kYWw9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWx9Lz5cbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD1cInNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRvZG8gbXJtXCI+XG4gICAgICAgICAgICA8dWwgaWQ9XCJzZWFyY2gtcmVzdWx0c1wiPlxuICAgICAgICAgICAgICB7c2VhcmNoX3Jlc3VsdHN9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Zm9jdXNlZDogdHJ1ZX0pO1xuICB9LFxuXG4gIGJsdXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe2ZvY3VzZWQ6IGZhbHNlfSk7XG4gIH0sXG5cbiAgcXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBxdWVyeSA9IGV2ZW50LnRhcmdldC52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBmaWx0ZXJlZCA9IHF1ZXJ5Lmxlbmd0aCA8PSAxID8gW10gOiB0aGlzLmZpbHRlckNvdXJzZXMocXVlcnkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHM6IGZpbHRlcmVkfSk7XG4gIH0sXG5cbiAgaXNTdWJzZXF1ZW5jZTogZnVuY3Rpb24ocmVzdWx0LHF1ZXJ5KSB7XG4gICAgICByZXN1bHQgPSBxdWVyeS5zcGxpdChcIiBcIikuZXZlcnkoZnVuY3Rpb24ocykge1xuICAgICAgICAgIGlmIChyZXN1bHQuaW5kZXhPZihzKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIGZpbHRlckNvdXJzZXM6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgdmFyIG9wdF9xdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoXCJpbnRyb1wiLFwiaW50cm9kdWN0aW9uXCIpXG4gICAgdGhhdCA9IHRoaXNcbiAgICB2YXIgcmVzdWx0cyA9IHRoaXMuc3RhdGUuY291cnNlcy5maWx0ZXIoZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuICh0aGF0LmlzU3Vic2VxdWVuY2UoYy5uYW1lLnRvTG93ZXJDYXNlKCkscXVlcnkpIHx8IFxuICAgICAgICAgICAgIHRoYXQuaXNTdWJzZXF1ZW5jZShjLm5hbWUudG9Mb3dlckNhc2UoKSxvcHRfcXVlcnkpIHx8XG4gICAgICAgICAgICAgYy5jb2RlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihvcHRfcXVlcnkpID4gLTEgfHxcbiAgICAgICAgICAgICBjLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKG9wdF9xdWVyeSkgPiAtMSB8fFxuICAgICAgICAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkpID4gLTEpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9LFxuXG5cblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG52YXIgZGF5X3RvX2xldHRlciA9IHtcbiAgICAnTSc6ICAnTScsIFxuICAgICdUJzogICdUJywgXG4gICAgJ1cnOiAgJ1cnLFxuICAgICdSJzogJ1RoJyxcbiAgICAnRic6ICAnRicsXG4gICAgJ1MnOiAnU2EnLFxuICAgICdVJzogJ1MnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29zID0gdGhpcy5nZXRSZWxhdGVkQ291cnNlT2ZmZXJpbmdzKCk7XG4gICAgICAgIHZhciBkYXlBbmRUaW1lcyA9IHRoaXMuZ2V0RGF5c0FuZFRpbWVzKGNvcyk7XG4gICAgICAgIHZhciBzZWN0ID0gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInNlY3Rpb24tbnVtXCI+e2Nvc1swXS5tZWV0aW5nX3NlY3Rpb259PC9kaXY+O1xuICAgICAgICB2YXIgcHJvZiA9IDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJwcm9mc1wiPntjb3NbMF0uaW5zdHJ1Y3RvcnN9PC9kaXY+O1xuICAgICAgICB2YXIgc2VjdF9wcm9mID0gPGRpdiBrZXk9e3RoaXMucHJvcHMua2V5fSBpZD1cInNlY3QtcHJvZlwiPntzZWN0fXtwcm9mfTwvZGl2PjtcbiAgICAgICAgcmV0dXJuIDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJzZWN0aW9uLXdyYXBwZXJcIj57c2VjdF9wcm9mfXtkYXlBbmRUaW1lc308L2Rpdj47XG4gICAgfSxcblxuICAgIGdldFJlbGF0ZWRDb3Vyc2VPZmZlcmluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb19vYmplY3RzID0gW11cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BzLmFsbF9zZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSB0aGlzLnByb3BzLmFsbF9zZWN0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChvLm1lZXRpbmdfc2VjdGlvbiA9PSB0aGlzLnByb3BzLnNlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb19vYmplY3RzLnB1c2gobyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvX29iamVjdHM7XG4gICAgfSxcblxuICAgIGdldERheXNBbmRUaW1lczogZnVuY3Rpb24oY29zKSB7XG4gICAgICAgIHZhciBkYXlBbmRUaW1lcyA9IGNvcy5tYXAoZnVuY3Rpb24obykge1xuICAgICAgICAgICAgcmV0dXJuICg8ZGl2IGtleT17dGhpcy5wcm9wcy5rZXl9IGlkPVwiZGF5LXRpbWVcIiBrZXk9e28uaWR9PntkYXlfdG9fbGV0dGVyW28uZGF5XSArIFwiIFwiICsgby50aW1lX3N0YXJ0ICsgXCItXCIgKyBvLnRpbWVfZW5kfTwvZGl2Pik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiAoIDxkaXYga2V5PXt0aGlzLnByb3BzLmtleX0gaWQ9XCJkdC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICB7ZGF5QW5kVGltZXN9XG4gICAgICAgICAgICA8L2Rpdj4gKVxuICAgIH1cbn0pO1xuIiwidmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKVxuXG52YXIgUm9zdGVyU2xvdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzPXtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMuY29sb3VyLCBib3JkZXJDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXJ9O1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIG9uQ2xpY2s9e3RoaXMucHJvcHMudG9nZ2xlTW9kYWwodGhpcy5wcm9wcy5pZCl9XG4gICAgICAgIHN0eWxlPXtzdHlsZXN9XG4gICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLnVuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmlkfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMubmFtZX08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgfSxcbiAgaGlnaGxpZ2h0U2libGluZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKENPTE9VUl9UT19ISUdITElHSFRbdGhpcy5wcm9wcy5jb2xvdXJdKTtcbiAgfSxcbiAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNvbG91cnModGhpcy5wcm9wcy5jb2xvdXIpO1xuICB9LFxuICB1cGRhdGVDb2xvdXJzOiBmdW5jdGlvbihjb2xvdXIpIHtcbiAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmlkKVxuICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG91cilcbiAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gIH0sXG5cbn0pXG5cbnZhciBDb3Vyc2VSb3N0ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAvLyB1c2UgdGhlIHRpbWV0YWJsZSBmb3Igc2xvdHMgYmVjYXVzZSBpdCBjb250YWlucyB0aGUgbW9zdCBpbmZvcm1hdGlvblxuICAgIGlmICh0aGlzLnByb3BzLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHNsb3RzID0gdGhpcy5wcm9wcy50aW1ldGFibGVzWzBdLmNvdXJzZXMubWFwKGZ1bmN0aW9uKGNvdXJzZSkge1xuICAgICAgICB2YXIgY29sb3VyID0gIENPVVJTRV9UT19DT0xPVVJbY291cnNlLmNvZGVdO1xuXG4gICAgICAgIHJldHVybiA8Um9zdGVyU2xvdCB7Li4uY291cnNlfSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtjb3Vyc2UuY29kZX0gY29sb3VyPXtjb2xvdXJ9Lz5cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNsb3RzID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHR0ID0gdGhpcy5wcm9wcy50aW1ldGFibGVzLmxlbmd0aCA+IDAgPyB0aGlzLnByb3BzLnRpbWV0YWJsZXNbMF0gOiBudWxsO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgU2VtZXN0ZXI8L2g0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb3Vyc2Utcm9zdGVyXCI+XG4gICAgICAgICAge3Nsb3RzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxudmFyIFRleHRib29rUm9zdGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChUaW1ldGFibGVTdG9yZSldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgIGlmICh0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGV4dGJvb2tzID0gW11cbiAgICAgICBmb3IgKGk9MDsgaSA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXMubGVuZ3RoOyBpKyspICB7XG4gICAgICAgICAgZm9yKGo9MDsgaiA8IHRoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdLmNvdXJzZXNbaV0udGV4dGJvb2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0ZXh0Ym9va3MucHVzaCh0aGlzLnN0YXRlLnRpbWV0YWJsZXNbdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4XS5jb3Vyc2VzW2ldLnRleHRib29rc1tqXSlcbiAgICAgICAgICB9XG4gICAgICAgfVxuICAgICAgIHZhciB0Yl9lbGVtZW50cyA9IHRleHRib29rcy5tYXAoZnVuY3Rpb24odGIpIHtcbiAgICAgICAgICBpZiAodGJbJ2ltYWdlX3VybCddID09PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gJy9zdGF0aWMvaW1nL2RlZmF1bHRfY292ZXIuanBnJ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gdGJbJ2ltYWdlX3VybCddXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YlsndGl0bGUnXSA9PSBcIkNhbm5vdCBiZSBmb3VuZFwiKSB7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBcIiNcIiArICB0YlsnaXNibiddXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IHRiWyd0aXRsZSddXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0Ym9va1wiIGtleT17dGJbJ2lkJ119PlxuICAgICAgICAgICAgICAgIDxpbWcgaGVpZ2h0PVwiMTI1XCIgc3JjPXtpbWd9Lz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZHVsZVwiPlxuICAgICAgICAgICAgICAgICAgPGg2IGNsYXNzTmFtZT1cImxpbmUtY2xhbXBcIj57dGl0bGV9PC9oNj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxhIGhyZWY9e3RiWydkZXRhaWxfdXJsJ119IHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2ltYWdlcy1uYS5zc2wtaW1hZ2VzLWFtYXpvbi5jb20vaW1hZ2VzL0cvMDEvYXNzb2NpYXRlcy9yZW1vdGUtYnV5LWJveC9idXk1Ll9WMTkyMjA3NzM5Xy5naWZcIiB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjI4XCIgYm9yZGVyPVwiMFwiLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB0Yl9lbGVtZW50cyA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvc3Rlci1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3N0ZXItaGVhZGVyXCI+XG4gICAgICAgICAgPGg0PllvdXIgVGV4dGJvb2tzPC9oND5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY291cnNlLXJvc3RlclwiPlxuICAgICAgICAgICAge3RiX2VsZW1lbnRzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG1peGluczogW1JlZmx1eC5jb25uZWN0KFRpbWV0YWJsZVN0b3JlKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9XCJzaWRlYmFyXCIgY2xhc3NOYW1lPVwic2lkZS1jb250YWluZXIgc2lkZS1jb2xsYXBzZWQgZmxleHpvbmVcIj5cbiAgICAgICAgPENvdXJzZVJvc3RlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gdGltZXRhYmxlcz17dGhpcy5zdGF0ZS50aW1ldGFibGVzfS8+XG4gICAgICAgIDxUZXh0Ym9va1Jvc3RlciAvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHQgXHQ8ZGl2IGlkPVwiZGltLXNjcmVlblwiPjwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbFwiIHN0eWxlPXt0aGlzLnByb3BzLnN0eWxlc30+XG5cdFx0XHRcdFx0PGg2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1oZWFkZXJcIj57dGhpcy5wcm9wcy5oZWFkZXJ9PC9oNj5cblx0XHRcdFx0XHQ8aHIgY2xhc3NOYW1lPVwic2ltcGxlLW1vZGFsLXNlcGFyYXRvclwiLz5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNpbXBsZS1tb2RhbC1jb250ZW50XCI+XG5cdFx0XHRcdFx0XHR7dGhpcy5wcm9wcy5jb250ZW50fVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0KTtcblx0fSxcblxufSk7XG4iLCJ2YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcy5qcycpO1xudmFyIFRpbWV0YWJsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvdXBkYXRlX3RpbWV0YWJsZXMuanMnKTtcblxuXG4vLyBtYXBzIGJhc2UgY29sb3VyIG9mIHNsb3QgdG8gY29sb3VyIG9uIGhpZ2hsaWdodFxuQ09MT1VSX1RPX0hJR0hMSUdIVCA9IHtcbiAgICBcIiNGRDc0NzNcIiA6IFwiI0UyNkE2QVwiLFxuICAgIFwiIzQ0QkJGRlwiIDogXCIjMjhBNEVBXCIsXG4gICAgXCIjNENENEIwXCIgOiBcIiMzREJCOUFcIixcbiAgICBcIiM4ODcwRkZcIiA6IFwiIzcwNTlFNlwiLFxuICAgIFwiI0Y5QUU3NFwiIDogXCIjRjc5NTRBXCIsXG4gICAgXCIjRDREQkM4XCIgOiBcIiNCNUJGQTNcIixcbiAgICBcIiNFN0Y3NkRcIiA6IFwiI0M0RDQ0RFwiLFxuICAgIFwiI0YxODJCNFwiIDogXCIjREU2OTlEXCIsXG4gICAgXCIjNzQ5OUEyXCIgOiBcIiM2NjhCOTRcIixcbn0gLy8gY29uc2lkZXIgI0NGMDAwRiwgI2U4ZmFjM1xuQ09VUlNFX1RPX0NPTE9VUiA9IHt9XG4vLyBob3cgYmlnIGEgc2xvdCBvZiBoYWxmIGFuIGhvdXIgd291bGQgYmUsIGluIHBpeGVsc1xudmFyIEhBTEZfSE9VUl9IRUlHSFQgPSAzMDtcblxudmFyIFNsb3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtzaG93X2J1dHRvbnM6IGZhbHNlfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBpbiA9IG51bGwsIHJlbW92ZV9idXR0b24gPSBudWxsO1xuICAgICAgICB2YXIgc2xvdF9zdHlsZSA9IHRoaXMuZ2V0U2xvdFN0eWxlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2hvd19idXR0b25zKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1sb2NrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICAgICAgcmVtb3ZlX2J1dHRvbiA9ICggPGRpdiBjbGFzc05hbWU9XCJzbG90LWlubmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmRcIiBvbkNsaWNrPXt0aGlzLnJlbW92ZUNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS10aW1lcyByZW1vdmVcIj48L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvcHMucGlubmVkKSB7XG4gICAgICAgICAgICBwaW4gPSAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNsb3QtaW5uZXIgYm90dG9tXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidXR0b24tc3Vycm91bmQgcGlubmVkXCIgb25DbGljaz17dGhpcy51bnBpbkNvdXJzZX0gPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1sb2NrXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5wcm9wcy50b2dnbGVNb2RhbCh0aGlzLnByb3BzLmNvdXJzZSl9XG4gICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuaGlnaGxpZ2h0U2libGluZ3N9XG4gICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMudW5oaWdobGlnaHRTaWJsaW5nc31cbiAgICAgICAgICAgIGNsYXNzTmFtZT17XCJzbG90LW91dGVyIGZjLXRpbWUtZ3JpZC1ldmVudCBmYy1ldmVudCBzbG90IHNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZX0gXG4gICAgICAgICAgICBzdHlsZT17c2xvdF9zdHlsZX0+XG4gICAgICAgICAgICB7cmVtb3ZlX2J1dHRvbn1cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudFwiPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWVcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dGhpcy5wcm9wcy50aW1lX3N0YXJ0fSDigJMge3RoaXMucHJvcHMudGltZV9lbmR9PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aXRsZSBzbG90LXRleHQtcm93XCI+e3RoaXMucHJvcHMuY29kZSArIFwiIFwiICsgdGhpcy5wcm9wcy5tZWV0aW5nX3NlY3Rpb259PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdGl0bGUgc2xvdC10ZXh0LXJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtwaW59ICAgICAgICAgICAgXG4gICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgIC8qKlxuICAgICogUmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIHN0eWxlIG9mIGEgc3BlY2lmaWMgc2xvdC4gU2hvdWxkIHNwZWNpZnkgYXRcbiAgICAqIGxlYXN0IHRoZSB0b3AgeS1jb29yZGluYXRlIGFuZCBoZWlnaHQgb2YgdGhlIHNsb3QsIGFzIHdlbGwgYXMgYmFja2dyb3VuZENvbG9yXG4gICAgKiB3aGlsZSB0YWtpbmcgaW50byBhY2NvdW50IGlmIHRoZXJlJ3MgYW4gb3ZlcmxhcHBpbmcgY29uZmxpY3RcbiAgICAqL1xuICAgIGdldFNsb3RTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydF9ob3VyICAgPSBwYXJzZUludCh0aGlzLnByb3BzLnRpbWVfc3RhcnQuc3BsaXQoXCI6XCIpWzBdKSxcbiAgICAgICAgICAgIHN0YXJ0X21pbnV0ZSA9IHBhcnNlSW50KHRoaXMucHJvcHMudGltZV9zdGFydC5zcGxpdChcIjpcIilbMV0pLFxuICAgICAgICAgICAgZW5kX2hvdXIgICAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMF0pLFxuICAgICAgICAgICAgZW5kX21pbnV0ZSAgID0gcGFyc2VJbnQodGhpcy5wcm9wcy50aW1lX2VuZC5zcGxpdChcIjpcIilbMV0pO1xuXG4gICAgICAgIHZhciB0b3AgPSAoc3RhcnRfaG91ciAtIDgpKjUyICsgKHN0YXJ0X21pbnV0ZSkqKDI2LzMwKTtcbiAgICAgICAgdmFyIGJvdHRvbSA9IChlbmRfaG91ciAtIDgpKjUyICsgKGVuZF9taW51dGUpKigyNi8zMCkgLSAxO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wIC0gMjtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5udW1fY29uZmxpY3RzID4gMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5wcm9wcy50aW1lX3N0YXJ0LCB0aGlzLnByb3BzLnRpbWVfZW5kLCB0aGlzLnByb3BzLm51bV9jb25mbGljdHMpXG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhlIGN1bXVsYXRpdmUgd2lkdGggb2YgdGhpcyBzbG90IGFuZCBhbGwgb2YgdGhlIHNsb3RzIGl0IGlzIGNvbmZsaWN0aW5nIHdpdGhcbiAgICAgICAgdmFyIHRvdGFsX3Nsb3Rfd2lkdGhzID0gOTggLSAoNSAqIHRoaXMucHJvcHMuZGVwdGhfbGV2ZWwpO1xuICAgICAgICAvLyB0aGUgd2lkdGggb2YgdGhpcyBwYXJ0aWN1bGFyIHNsb3RcbiAgICAgICAgdmFyIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSA9IHRvdGFsX3Nsb3Rfd2lkdGhzIC8gdGhpcy5wcm9wcy5udW1fY29uZmxpY3RzO1xuICAgICAgICAvLyB0aGUgYW1vdW50IG9mIGxlZnQgbWFyZ2luIG9mIHRoaXMgcGFydGljdWxhciBzbG90LCBpbiBwZXJjZW50YWdlXG4gICAgICAgIHZhciBwdXNoX2xlZnQgPSAodGhpcy5wcm9wcy5zaGlmdF9pbmRleCAqIHNsb3Rfd2lkdGhfcGVyY2VudGFnZSkgKyA1ICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IHNsb3Rfd2lkdGhfcGVyY2VudGFnZSArIFwiJVwiLFxuICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy5jb2xvdXIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiICsgdGhpcy5wcm9wcy5jb2xvdXIsXG4gICAgICAgICAgICBsZWZ0OiBwdXNoX2xlZnQgKyBcIiVcIixcbiAgICAgICAgICAgIHpJbmRleDogMTAwICogdGhpcy5wcm9wcy5kZXB0aF9sZXZlbFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBoaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogdHJ1ZX0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG91cnMoQ09MT1VSX1RPX0hJR0hMSUdIVFt0aGlzLnByb3BzLmNvbG91cl0pO1xuICAgIH0sXG4gICAgdW5oaWdobGlnaHRTaWJsaW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dfYnV0dG9uczogZmFsc2V9KTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvdXJzKHRoaXMucHJvcHMuY29sb3VyKTtcbiAgICB9LFxuICAgIHBpbkNvdXJzZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBUaW1ldGFibGVBY3Rpb25zLnVwZGF0ZUNvdXJzZXMoe2lkOiB0aGlzLnByb3BzLmNvdXJzZSwgXG4gICAgICAgICAgICBzZWN0aW9uOiB0aGlzLnByb3BzLm1lZXRpbmdfc2VjdGlvbiwgXG4gICAgICAgICAgICByZW1vdmluZzogZmFsc2V9KTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIHVucGluQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiBmYWxzZX0pO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgcmVtb3ZlQ291cnNlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMudXBkYXRlQ291cnNlcyh7aWQ6IHRoaXMucHJvcHMuY291cnNlLCBcbiAgICAgICAgICAgIHNlY3Rpb246ICcnLCBcbiAgICAgICAgICAgIHJlbW92aW5nOiB0cnVlfSk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbG91cnM6IGZ1bmN0aW9uKGNvbG91cikge1xuICAgICAgICAkKFwiLnNsb3QtXCIgKyB0aGlzLnByb3BzLmNvdXJzZSlcbiAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3VyKVxuICAgICAgICAgIC5jc3MoJ2JvcmRlci1jb2xvcicsIGNvbG91cik7XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheXMgPSBbXCJNXCIsIFwiVFwiLCBcIldcIiwgXCJSXCIsIFwiRlwiXTtcbiAgICAgICAgdmFyIHNsb3RzX2J5X2RheSA9IHRoaXMuZ2V0U2xvdHNCeURheSgpO1xuICAgICAgICB2YXIgYWxsX3Nsb3RzID0gZGF5cy5tYXAoZnVuY3Rpb24oZGF5KSB7XG4gICAgICAgICAgICB2YXIgZGF5X3Nsb3RzID0gc2xvdHNfYnlfZGF5W2RheV0ubWFwKGZ1bmN0aW9uKHNsb3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMuaXNQaW5uZWQoc2xvdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxTbG90IHsuLi5zbG90fSB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0ga2V5PXtzbG90LmlkfSBwaW5uZWQ9e3B9Lz5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtkYXl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1ldmVudC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF5X3Nsb3RzfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICApO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXNcIj48L3RkPlxuICAgICAgICAgICAgICAgICAge2FsbF9zbG90c31cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICApO1xuICAgIH0sXG4gICBcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXlzID0gezE6ICdtb24nLCAyOiAndHVlJywgMzogJ3dlZCcsIDQ6ICd0aHUnLCA1OiAnZnJpJ307XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gXCIuZmMtXCIgKyBkYXlzW2QuZ2V0RGF5KCldO1xuICAgICAgICAvLyAkKHNlbGVjdG9yKS5hZGRDbGFzcyhcImZjLXRvZGF5XCIpO1xuICAgIH0sXG5cbiAgICBpc1Bpbm5lZDogZnVuY3Rpb24oc2xvdCkge1xuICAgICAgICB2YXIgY29tcGFyYXRvciA9IHRoaXMucHJvcHMuY291cnNlc190b19zZWN0aW9uc1tzbG90LmNvdXJzZV1bJ0MnXTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5wcm9wcy5jb3Vyc2VzX3RvX3NlY3Rpb25zW3Nsb3QuY291cnNlXVtzbG90Lm1lZXRpbmdfc2VjdGlvblswXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXBhcmF0b3IgPT0gc2xvdC5tZWV0aW5nX3NlY3Rpb247XG4gICAgfSxcblxuICAgIGdldFNsb3RzQnlEYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2xvdHNfYnlfZGF5ID0ge1xuICAgICAgICAgICAgJ00nOiBbXSxcbiAgICAgICAgICAgICdUJzogW10sXG4gICAgICAgICAgICAnVyc6IFtdLFxuICAgICAgICAgICAgJ1InOiBbXSxcbiAgICAgICAgICAgICdGJzogW11cbiAgICAgICAgfTtcbiAgICAgICAgQ09VUlNFX1RPX0NPTE9VUiA9IHt9O1xuICAgICAgICBmb3IgKHZhciBjb3Vyc2UgaW4gdGhpcy5wcm9wcy50aW1ldGFibGUuY291cnNlcykge1xuICAgICAgICAgICAgdmFyIGNycyA9IHRoaXMucHJvcHMudGltZXRhYmxlLmNvdXJzZXNbY291cnNlXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNsb3RfaWQgaW4gY3JzLnNsb3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNsb3QgPSBjcnMuc2xvdHNbc2xvdF9pZF07XG4gICAgICAgICAgICAgICAgdmFyIGNvbG91ciA9IE9iamVjdC5rZXlzKENPTE9VUl9UT19ISUdITElHSFQpW2NvdXJzZV07XG4gICAgICAgICAgICAgICAgc2xvdFtcImNvbG91clwiXSA9IGNvbG91cjtcbiAgICAgICAgICAgICAgICBzbG90W1wiY29kZVwiXSA9IGNycy5jb2RlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBzbG90W1wibmFtZVwiXSA9IGNycy5uYW1lO1xuICAgICAgICAgICAgICAgIHNsb3RzX2J5X2RheVtzbG90LmRheV0ucHVzaChzbG90KTtcbiAgICAgICAgICAgICAgICBDT1VSU0VfVE9fQ09MT1VSW2Nycy5jb2RlXSA9IGNvbG91cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2xvdHNfYnlfZGF5O1xuICAgIH0sXG5cbn0pO1xuIiwidmFyIGNvdXJzZV9hY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb3Vyc2VfYWN0aW9ucy5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbY291cnNlX2FjdGlvbnNdLFxuXG4gIGdldENvdXJzZUluZm86IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlX2lkKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgJC5nZXQoXCIvY291cnNlcy9cIisgc2Nob29sICsgXCIvaWQvXCIgKyBjb3Vyc2VfaWQsIFxuICAgICAgICAge30sIFxuICAgICAgICAgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2UsIGNvdXJzZV9pbmZvOiByZXNwb25zZX0pO1xuICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcblxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtjb3Vyc2VfaW5mbzogbnVsbCwgbG9hZGluZzogdHJ1ZX07XG4gIH1cbn0pO1xuIiwidmFyIFRvYXN0ID0gcmVxdWlyZSgnLi4vdG9hc3QnKTtcbnZhciBUb2FzdEFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3RvYXN0X2FjdGlvbnMuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWZsdXguY3JlYXRlU3RvcmUoe1xuICBsaXN0ZW5hYmxlczogW1RvYXN0QWN0aW9uc10sXG5cbiAgY3JlYXRlVG9hc3Q6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvYXN0LWNvbnRhaW5lcicpO1xuICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoY29udGFpbmVyKTtcbiAgICBSZWFjdERPTS5yZW5kZXIoXG4gICAgICA8VG9hc3QgY29udGVudD17Y29udGVudH0gLz4sXG4gICAgICBjb250YWluZXJcbiAgICApO1xuICB9LFxuXG5cbn0pO1xuIiwidmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zL3VwZGF0ZV90aW1ldGFibGVzLmpzJyk7XG52YXIgVG9hc3RBY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy90b2FzdF9hY3Rpb25zLmpzJyk7XG5cblxudmFyIHR0X3N0YXRlID0ge1xuICBzY2hvb2w6IFwiamh1XCIsXG4gIHNlbWVzdGVyOiBcIlNcIixcbiAgY291cnNlc190b19zZWN0aW9uczoge30sXG4gIHByZWZlcmVuY2VzOiB7XG4gICAgJ25vX2NsYXNzZXNfYmVmb3JlJzogZmFsc2UsXG4gICAgJ25vX2NsYXNzZXNfYWZ0ZXInOiBmYWxzZSxcbiAgICAnbG9uZ193ZWVrZW5kJzogZmFsc2UsXG4gICAgJ2dyb3VwZWQnOiBmYWxzZSxcbiAgICAnZG9fcmFua2luZyc6IGZhbHNlLFxuICAgICd0cnlfd2l0aF9jb25mbGljdHMnOiBmYWxzZVxuICB9XG59XG5cblNDSE9PTF9MSVNUID0gW1wiamh1XCIsIFwidW9mdFwiXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmx1eC5jcmVhdGVTdG9yZSh7XG4gIGxpc3RlbmFibGVzOiBbYWN0aW9uc10sXG4gIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHt9LFxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1ldGFibGVzOiBbXSwgXG4gICAgICBjb3Vyc2VzX3RvX3NlY3Rpb25zOiB7fSwgXG4gICAgICBjdXJyZW50X2luZGV4OiAtMSwgXG4gICAgICBjb25mbGljdF9lcnJvcjogZmFsc2UsXG4gICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgIHNjaG9vbDogXCJcIn07XG4gIH0sXG5cbiAgc2V0U2Nob29sOiBmdW5jdGlvbihuZXdfc2Nob29sKSB7XG4gICAgdmFyIHNjaG9vbCA9IFNDSE9PTF9MSVNULmluZGV4T2YobmV3X3NjaG9vbCkgPiAtMSA/IG5ld19zY2hvb2wgOiBcIlwiO1xuICAgIHZhciBuZXdfc3RhdGUgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpO1xuICAgIHR0X3N0YXRlLnNjaG9vbCA9IHNjaG9vbDtcbiAgICBuZXdfc3RhdGUuc2Nob29sID0gc2Nob29sO1xuICAgIHRoaXMudHJpZ2dlcihuZXdfc3RhdGUpO1xuICB9LFxuIC8qKlxuICAqIFVwZGF0ZSB0dF9zdGF0ZSB3aXRoIG5ldyBjb3Vyc2Ugcm9zdGVyXG4gICogQHBhcmFtIHtvYmplY3R9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uIGNvbnRhaW5zIGF0dHJpYnV0ZWQgaWQsIHNlY3Rpb24sIHJlbW92aW5nXG4gICogQHJldHVybiB7dm9pZH0gZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgdHRfc3RhdGVcbiAgKi9cbiAgdXBkYXRlQ291cnNlczogZnVuY3Rpb24obmV3X2NvdXJzZV93aXRoX3NlY3Rpb24pIHtcbiAgICB0aGlzLnRyaWdnZXIoe2xvYWRpbmc6dHJ1ZX0pO1xuXG4gICAgdmFyIHJlbW92aW5nID0gbmV3X2NvdXJzZV93aXRoX3NlY3Rpb24ucmVtb3Zpbmc7XG4gICAgdmFyIG5ld19jb3Vyc2VfaWQgPSBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5pZDtcbiAgICB2YXIgc2VjdGlvbiA9IG5ld19jb3Vyc2Vfd2l0aF9zZWN0aW9uLnNlY3Rpb247XG4gICAgdmFyIG5ld19zdGF0ZSA9ICQuZXh0ZW5kKHRydWUsIHt9LCB0dF9zdGF0ZSk7IC8vIGRlZXAgY29weSBvZiB0dF9zdGF0ZVxuICAgIHZhciBjX3RvX3MgPSBuZXdfc3RhdGUuY291cnNlc190b19zZWN0aW9ucztcbiAgICBcbiAgICBpZiAoIXJlbW92aW5nKSB7IC8vIGFkZGluZyBjb3Vyc2VcbiAgICAgIGlmICh0dF9zdGF0ZS5zY2hvb2wgPT0gXCJqaHVcIikge1xuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiBuZXdfY291cnNlX3dpdGhfc2VjdGlvbi5zZWN0aW9ufTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR0X3N0YXRlLnNjaG9vbCA9PSBcInVvZnRcIikge1xuICAgICAgICB2YXIgbG9ja2VkX3NlY3Rpb25zID0geydMJzogJycsICdUJzogJycsICdQJzogJycsICdDJzogJyd9IC8vIHRoaXMgaXMgd2hhdCB3ZSB3YW50IHRvIHNlbmQgaWYgbm90IGxvY2tpbmdcbiAgICAgICAgaWYgKHNlY3Rpb24pIHsgLy8gbG9ja2luZ1xuICAgICAgICAgIGlmIChjX3RvX3NbbmV3X2NvdXJzZV9pZF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgbG9ja2VkX3NlY3Rpb25zID0gY190b19zW25ld19jb3Vyc2VfaWRdOyAvLyBjb3B5IHRoZSBvbGQgbWFwcGluZ1xuICAgICAgICAgICAgLy8gaW4gY2FzZSBzb21lIHNlY3Rpb25zIHdlcmUgYWxyZWFkeSBsb2NrZWQgZm9yIHRoaXMgY291cnNlLFxuICAgICAgICAgICAgLy8gYW5kIG5vdyB3ZSdyZSBhYm91dCB0byBsb2NrIGEgbmV3IG9uZS5cbiAgICAgICAgICB9XG4gICAgICAgICAgbG9ja2VkX3NlY3Rpb25zW3NlY3Rpb25bMF1dID0gc2VjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjX3RvX3NbbmV3X2NvdXJzZV9pZF0gPSBsb2NrZWRfc2VjdGlvbnM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmluZyBjb3Vyc2VcbiAgICAgIGRlbGV0ZSBjX3RvX3NbbmV3X2NvdXJzZV9pZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY190b19zKS5sZW5ndGggPT0gMCkgeyAvLyByZW1vdmVkIGxhc3QgY291cnNlXG4gICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gdHRfc3RhdGUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAgXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QobmV3X3N0YXRlKTtcbiAgfSxcblxuIC8qKlxuICAqIFVwZGF0ZSB0dF9zdGF0ZSB3aXRoIG5ldyBwcmVmZXJlbmNlc1xuICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmZXJlbmNlOiB0aGUgcHJlZmVyZW5jZSB0aGF0IGlzIGJlaW5nIHVwZGF0ZWRcbiAgKiBAcGFyYW0gbmV3X3ZhbHVlOiB0aGUgbmV3IHZhbHVlIG9mIHRoZSBzcGVjaWZpZWQgcHJlZmVyZW5jZVxuICAqIEByZXR1cm4ge3ZvaWR9IGRvZXNuJ3QgcmV0dXJuIGFueXRoaW5nLCBqdXN0IHVwZGF0ZXMgdHRfc3RhdGVcbiAgKi9cbiAgdXBkYXRlUHJlZmVyZW5jZXM6IGZ1bmN0aW9uKHByZWZlcmVuY2UsIG5ld192YWx1ZSkge1xuICAgIHZhciBuZXdfc3RhdGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdHRfc3RhdGUpOyAvLyBkZWVwIGNvcHkgb2YgdHRfc3RhdGVcbiAgICBuZXdfc3RhdGUucHJlZmVyZW5jZXNbcHJlZmVyZW5jZV0gPSBuZXdfdmFsdWU7XG4gICAgdGhpcy5tYWtlUmVxdWVzdChuZXdfc3RhdGUpO1xuICB9LFxuXG4gIC8vIE1ha2VzIGEgUE9TVCByZXF1ZXN0IHRvIHRoZSBiYWNrZW5kIHdpdGggdHRfc3RhdGVcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uKG5ld19zdGF0ZSkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICAgICQucG9zdCgnL3RpbWV0YWJsZS8nLCBKU09OLnN0cmluZ2lmeShuZXdfc3RhdGUpLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHsgLy8gZXJyb3IgZnJvbSBVUkwgb3IgbG9jYWwgc3RvcmFnZVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkYXRhJyk7XG4gICAgICAgICAgdHRfc3RhdGUuY291cnNlc190b19zZWN0aW9ucyA9IHt9O1xuICAgICAgICAgIHZhciByZXBsYWNlZCA9IHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgcmVwbGFjZWQuc2Nob29sID0gdHRfc3RhdGUuc2Nob29sO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcihyZXBsYWNlZCk7XG4gICAgICAgICAgcmV0dXJuOyAvLyBzdG9wIHByb2Nlc3NpbmcgaGVyZVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdHRfc3RhdGUgPSBuZXdfc3RhdGU7IC8vb25seSB1cGRhdGUgc3RhdGUgaWYgc3VjY2Vzc2Z1bFxuICAgICAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICAgICAgaWYgKG5ld19zdGF0ZS5pbmRleCAmJiBuZXdfc3RhdGUuaW5kZXggPCByZXNwb25zZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGluZGV4ID0gbmV3X3N0YXRlLmluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIG5ld19zdGF0ZVsnaW5kZXgnXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgdGltZXRhYmxlczogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIGNvdXJzZXNfdG9fc2VjdGlvbnM6IHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMgIT0ge30pIHsgLy8gY29uZmxpY3RcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe1xuICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBjb25mbGljdF9lcnJvcjogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIFRvYXN0QWN0aW9ucy5jcmVhdGVUb2FzdChcIlRoYXQgY291cnNlIGNhdXNlZCBhIGNvbmZsaWN0ISBUcnkgYWdhaW4gd2l0aCB0aGUgQWxsb3cgQ29uZmxpY3RzIHByZWZlcmVuY2UgdHVybmVkIG9uLlwiKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cblxuICBsb2FkUHJlc2V0VGltZXRhYmxlOiBmdW5jdGlvbih1cmxfZGF0YSkge1xuICAgIHZhciBjb3Vyc2VzID0gdXJsX2RhdGEuc3BsaXQoXCImXCIpO1xuICAgIHZhciBzY2hvb2wgPSBjb3Vyc2VzLnNoaWZ0KCk7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiB0cnVlLCBzY2hvb2w6IHNjaG9vbH0pO1xuICAgIHR0X3N0YXRlLnNjaG9vbCA9IHNjaG9vbDtcbiAgICB0dF9zdGF0ZS5pbmRleCA9IHBhcnNlSW50KGNvdXJzZXMuc2hpZnQoKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3Vyc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IHBhcnNlSW50KGNvdXJzZXNbaV0pO1xuICAgICAgdmFyIGNvdXJzZV9pbmZvID0gY291cnNlc1tpXS5zcGxpdChcIitcIik7XG4gICAgICBjb3Vyc2VfaW5mby5zaGlmdCgpOyAvLyByZW1vdmVzIGZpcnN0IGVsZW1lbnRcbiAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbY10gPSB7J0wnOiAnJywgJ1QnOiAnJywgJ1AnOiAnJywgJ0MnOiAnJ307XG4gICAgICBpZiAoY291cnNlX2luZm8ubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvdXJzZV9pbmZvLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHNlY3Rpb24gPSBjb3Vyc2VfaW5mb1tqXTtcbiAgICAgICAgICBpZiAoc2Nob29sID09IFwidW9mdFwiKSB7XG4gICAgICAgICAgICB0dF9zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zW2NdW3NlY3Rpb25bMF1dID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc2Nob29sID09IFwiamh1XCIpIHtcbiAgICAgICAgICAgIHR0X3N0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnNbY11bJ0MnXSA9IHNlY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVJlcXVlc3QodHRfc3RhdGUpO1xuICB9LFxuXG4gIHNldExvYWRpbmc6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudHJpZ2dlcih7bG9hZGluZzogdHJ1ZX0pO1xuICB9LFxuICBzZXREb25lTG9hZGluZzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50cmlnZ2VyKHtsb2FkaW5nOiBmYWxzZX0pO1xuICB9LFxuXG4gIHNldEN1cnJlbnRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgdGhpcy50cmlnZ2VyKHtjdXJyZW50X2luZGV4OiBuZXdfaW5kZXh9KTtcbiAgfSxcblxuXG59KTtcbiIsInZhciBTbG90TWFuYWdlciA9IHJlcXVpcmUoJy4vc2xvdF9tYW5hZ2VyJyk7XG52YXIgUGFnaW5hdGlvbiA9IHJlcXVpcmUoJy4vcGFnaW5hdGlvbicpO1xudmFyIFVwZGF0ZVRpbWV0YWJsZXNTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL3VwZGF0ZV90aW1ldGFibGVzJyk7XG52YXIgVGltZXRhYmxlQWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy91cGRhdGVfdGltZXRhYmxlcycpO1xudmFyIFRvYXN0QWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucy90b2FzdF9hY3Rpb25zJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC90aW1ldGFibGVfdXRpbCcpO1xudmFyIE5ld1BhZ2luYXRpb24gPSByZXF1aXJlKCcuL25ld19wYWdpbmF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBtaXhpbnM6IFtSZWZsdXguY29ubmVjdChVcGRhdGVUaW1ldGFibGVzU3RvcmUpXSxcblxuICBzZXRJbmRleDogZnVuY3Rpb24obmV3X2luZGV4KSB7XG4gICAgcmV0dXJuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChuZXdfaW5kZXggPj0gMCAmJiBuZXdfaW5kZXggPCB0aGlzLnN0YXRlLnRpbWV0YWJsZXMubGVuZ3RoKSB7XG4gICAgICAgIFRpbWV0YWJsZUFjdGlvbnMuc2V0Q3VycmVudEluZGV4KG5ld19pbmRleCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBnZXRTaGFyZUxpbms6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5rID0gd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIjtcbiAgICB2YXIgZGF0YSA9IFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsXG4gICAgICB0aGlzLnN0YXRlLmNvdXJzZXNfdG9fc2VjdGlvbnMsXG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXgpO1xuICAgIHJldHVybiBsaW5rICsgZGF0YTtcbiAgfSxcblxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2xvdF9tYW5hZ2VyID0gdGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA9PSAwID8gbnVsbCA6XG4gICAgICAgKDxTbG90TWFuYWdlciB0b2dnbGVNb2RhbD17dGhpcy5wcm9wcy50b2dnbGVNb2RhbH0gXG4gICAgICAgICAgICAgICAgICAgICB0aW1ldGFibGU9e3RoaXMuc3RhdGUudGltZXRhYmxlc1t0aGlzLnN0YXRlLmN1cnJlbnRfaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgY291cnNlc190b19zZWN0aW9ucz17dGhpcy5zdGF0ZS5jb3Vyc2VzX3RvX3NlY3Rpb25zfVxuICAgICAgICAgICAgICAgICAgICAgc2Nob29sPXt0aGlzLnN0YXRlLnNjaG9vbH0vPik7XG4gICAgICB2YXIgbG9hZGVyID0gIXRoaXMuc3RhdGUubG9hZGluZyA/IG51bGwgOlxuICAgICAgKCAgPGRpdiBjbGFzc05hbWU9XCJzcGlubmVyXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QxXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QyXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3QzXCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q0XCI+PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlY3Q1XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PilcbiAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2FsZW5kYXJcIiBjbGFzc05hbWU9XCJmYyBmYy1sdHIgZmMtdW50aGVtZWRcIj5cbiAgICAgICAgICAgICAge2xvYWRlcn1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgPFBhZ2luYXRpb24gXG4gICAgICAgICAgICAgICAgICBjb3VudD17dGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aH0gXG4gICAgICAgICAgICAgICAgICBuZXh0PXt0aGlzLnNldEluZGV4KHRoaXMuc3RhdGUuY3VycmVudF9pbmRleCArIDEpfSBcbiAgICAgICAgICAgICAgICAgIHByZXY9e3RoaXMuc2V0SW5kZXgodGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4IC0gMSl9XG4gICAgICAgICAgICAgICAgICBzZXRJbmRleD17dGhpcy5zZXRJbmRleH1cbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRfaW5kZXg9e3RoaXMuc3RhdGUuY3VycmVudF9pbmRleH0vPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSByaWdodCBjYWxlbmRhci1mdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgZGF0YS1jbGlwYm9hcmQtdGV4dD17dGhpcy5nZXRTaGFyZUxpbmsoKX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmdWktY2xpcFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jbGVhclwiPjwvZGl2PlxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy12aWV3LWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtdmlldyBmYy1hZ2VuZGFXZWVrLXZpZXcgZmMtYWdlbmRhLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtcm93IGZjLXdpZGdldC1oZWFkZXJcIiBpZD1cImN1c3RvbS13aWRnZXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWhlYWRlclwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy1tb25cIj5Nb24gPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLXR1ZVwiPlR1ZSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJmYy1kYXktaGVhZGVyIGZjLXdpZGdldC1oZWFkZXIgZmMtd2VkXCI+V2VkIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cImZjLWRheS1oZWFkZXIgZmMtd2lkZ2V0LWhlYWRlciBmYy10aHVcIj5UaHUgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwiZmMtZGF5LWhlYWRlciBmYy13aWRnZXQtaGVhZGVyIGZjLWZyaVwiPkZyaSA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cblxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtZGF5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtY29udGVudC1za2VsZXRvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpc1wiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZjLXRpbWUtZ3JpZC1jb250YWluZXIgZmMtc2Nyb2xsZXJcIiBpZD1cImNhbGVuZGFyLWlubmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy10aW1lLWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmMtYmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLW1vblwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtdHVlXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWRheSBmYy13aWRnZXQtY29udGVudCBmYy13ZWRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtZGF5IGZjLXdpZGdldC1jb250ZW50IGZjLXRodVwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1kYXkgZmMtd2lkZ2V0LWNvbnRlbnQgZmMtZnJpXCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1zbGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlhbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMGFtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExYW08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MTJwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+MnBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjNwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj40cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+NXBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjZwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj43cG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PHNwYW4+OHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjlwbTwvc3Bhbj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJmYy1taW5vclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtYXhpcyBmYy10aW1lIGZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48c3Bhbj4xMHBtPC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImZjLW1pbm9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy1heGlzIGZjLXRpbWUgZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZmMtd2lkZ2V0LWNvbnRlbnRcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjxzcGFuPjExcG08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLXdpZGdldC1jb250ZW50XCI+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiZmMtbWlub3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImZjLWF4aXMgZmMtdGltZSBmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJmYy13aWRnZXQtY29udGVudFwiPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxociBjbGFzc05hbWU9XCJmYy13aWRnZXQtaGVhZGVyXCIgaWQ9XCJ3aWRnZXQtaHJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYy1jb250ZW50LXNrZWxldG9uXCIgaWQ9XCJzbG90LW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nsb3RfbWFuYWdlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpcCA9IG5ldyBDbGlwYm9hcmQoJy5jYWxlbmRhci1mdW5jdGlvbicpO1xuICAgIGNsaXAub24oJ3N1Y2Nlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICBUb2FzdEFjdGlvbnMuY3JlYXRlVG9hc3QoXCJMaW5rIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgaWYodHlwZW9mKFN0b3JhZ2UpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS50aW1ldGFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gc2F2ZSBuZXdseSBnZW5lcmF0ZWQgY291cnNlcyB0byBsb2NhbCBzdG9yYWdlXG4gICAgICAgIHZhciBuZXdfZGF0YSA9IFV0aWwuZ2V0TGlua0RhdGEodGhpcy5zdGF0ZS5zY2hvb2wsIFxuICAgICAgICAgIHRoaXMuc3RhdGUuY291cnNlc190b19zZWN0aW9ucywgXG4gICAgICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50X2luZGV4KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2RhdGEnLCBuZXdfZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGF0YScpO1xuICAgICAgfVxuICAgIH0gXG5cbiAgfSxcblxuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7dmlzaWJsZTogdHJ1ZX07XG5cdH0sXHRcdFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5zdGF0ZS52aXNpYmxlKSB7cmV0dXJuIG51bGw7fVxuXHRcdHJldHVybiAoXG5cdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3Qtd3JhcHBlciB0b2FzdGluZ1wiPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZW0tdG9hc3RcIj57dGhpcy5wcm9wcy5jb250ZW50fTwvZGl2PlxuXHRcdDwvZGl2PlxuXHRcdCk7XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoaXMuX3JlYWN0SW50ZXJuYWxJbnN0YW5jZSkgeyAvLyBpZiBtb3VudGVkIHN0aWxsXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3Zpc2libGU6IGZhbHNlfSk7XG5cdFx0XHR9XG5cdFx0fS5iaW5kKHRoaXMpLCA0MDAwKTtcblx0fSxcblxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0TGlua0RhdGE6IGZ1bmN0aW9uKHNjaG9vbCwgY291cnNlc190b19zZWN0aW9ucywgaW5kZXgpIHtcblx0ICAgIHZhciBkYXRhID0gc2Nob29sICsgXCImXCIgKyBpbmRleCArIFwiJlwiO1xuXHQgICAgdmFyIGNfdG9fcyA9IGNvdXJzZXNfdG9fc2VjdGlvbnM7XG5cdCAgICBmb3IgKHZhciBjb3Vyc2VfaWQgaW4gY190b19zKSB7XG5cdCAgICAgIGRhdGEgKz0gY291cnNlX2lkO1xuXG5cdCAgICAgIHZhciBtYXBwaW5nID0gY190b19zW2NvdXJzZV9pZF07XG5cdCAgICAgIGZvciAodmFyIHNlY3Rpb25faGVhZGluZyBpbiBtYXBwaW5nKSB7IC8vIGkuZSAnTCcsICdUJywgJ1AnLCAnUydcblx0ICAgICAgICBpZiAobWFwcGluZ1tzZWN0aW9uX2hlYWRpbmddICE9IFwiXCIpIHtcblx0ICAgICAgICAgIGRhdGEgKz0gXCIrXCIgKyBtYXBwaW5nW3NlY3Rpb25faGVhZGluZ107IC8vIGRlbGltaXRlciBmb3Igc2VjdGlvbnMgbG9ja2VkXG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIGRhdGEgKz0gXCImXCI7IC8vIGRlbGltaXRlciBmb3IgY291cnNlc1xuXHQgICAgfVxuXHQgICAgZGF0YSA9IGRhdGEuc2xpY2UoMCwgLTEpO1xuXHQgICAgaWYgKGRhdGEubGVuZ3RoIDwgMykge2RhdGEgPSBcIlwiO31cblx0ICAgIHJldHVybiBkYXRhO1xuXHR9LFxufVxuIl19
