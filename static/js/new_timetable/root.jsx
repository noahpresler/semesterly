var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');
var Sidebar = require('./side_bar');
var SimpleModal = require('./simple_modal');
var SchoolList = require('./school_list');
var TimetableActions = require('./actions/update_timetables');
var CodeToIdStore = require('./stores/code_to_id');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore), Reflux.connect(CodeToIdStore)],
  sidebar_collapsed: 'neutral',


  render: function() {
    var Modal = Boron['OutlineModal'];
    var loader = !(this.state.loading || this.state.courses_loading) ? null :
      (  <div className="spinner">
            <div className="rect1"></div>
            <div className="rect2"></div>
            <div className="rect3"></div>
            <div className="rect4"></div>
            <div className="rect5"></div>
        </div>);
    var school_selector = (
      <SimpleModal header="Semester.ly | Welcome"
                   key="school"
                   ref="school_modal"
                   allow_disable={false}
                   styles={{backgroundColor: "#FDF5FF", color: "#000"}} 
                   content={<SchoolList setSchool={this.setSchool}/> }/>);
    return (
      <div id="root">
        {loader}
        {school_selector}

        <div id="toast-container"></div>
        <div id="control-bar-container">
          <div id="semesterly-name">Semester.ly</div>
          <img id="semesterly-logo" src="/static/img/logo2.0.png"/>
          <ControlBar toggleModal={this.toggleCourseModal}/>
        </div>
        <div id="navicon" onClick={this.toggleSideModal}>
          <span></span><span></span><span></span>
        </div>
        <div id="modal-container">
          <Modal closeOnClick={true} ref='OutlineModal' className="course-modal">
              <ModalContent school={this.state.school} 
                            courses_to_sections={this.state.courses_to_sections} 
                            hide={this.hideCourseModal} />
          </Modal>
        </div>
        <div className="all-cols-container">
          <Sidebar toggleModal={this.toggleCourseModal}/>
          <div className="cal-container">
            <Timetable toggleModal={this.toggleCourseModal} />
          </div>
        </div>
      </div>
    );
  },

  componentDidMount: function() {
    if (this.props.data == "load-course") {

    }
    else if (this.props.data != null) {
      TimetableActions.loadPresetTimetable(this.props.data);
    }
    else if (this.state.school == "") {
      this.showSchoolModal();
    }
  },

  componentWillUpdate: function(new_props, new_state) {

    if (this.props.data == "load-course" && this.state.school == "" && new_state.school != "") {
        this.refs['OutlineModal'].toggle();
        course_actions.getCourseInfo(new_state.school, this.props.initial_course_id);
    }

  },

  componentDidUpdate: function() {

    if (this.state.school != "") {
      this.hideSchoolModal();
    }
  },

  toggleCourseModal: function(course_id) {
    return function() {
        this.refs['OutlineModal'].toggle();
        course_actions.getCourseInfo(school, course_id);
    }.bind(this); 
  },

  hideCourseModal: function() {
    this.refs['OutlineModal'].hide();
  },

  showSchoolModal: function() {
      this.refs.school_modal.show();
  },
  hideSchoolModal: function() {
      this.refs.school_modal.hide();
  },

  toggleSideModal: function(){
    if (this.sidebar_collapsed == 'neutral') {
      var bodyw = $(window).width();
      if (bodyw > 999) {
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
