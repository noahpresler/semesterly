var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var TimetableStore = require('./stores/update_timetables.js')
var course_actions = require('./actions/course_actions');
var ConflictMsg = require('./conflict_msg.jsx');
var Sidebar = require('./side_bar.jsx');
    
module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],
  sidebar_collapsed: true,

  getInitialState:function() {
    this.getCourses();

    return {};
  },
  render: function() {
    var Modal = Boron['OutlineModal'];

    return (
      <div id="root">
        <div id="semesterly-name" onClick={this.toggleSideModal}>Semester.ly</div>
        <div id="control-bar-container">
          <ControlBar toggleModal={this.toggleCourseModal}/>
        </div>
        <div id="modal-container">
          <Modal ref='OutlineModal' className="course-modal">
              <ModalContent />
          </Modal>
        </div>
        <div id="all-cols-container">
          <Sidebar toggleModal={this.toggleCourseModal}/>
          <div id="cal-container">
            <ConflictMsg visible={this.state.conflict_error}/>
            <Timetable toggleModal={this.toggleCourseModal} />
          </div>
        </div>
      </div>
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
    $('.side-container').removeClass('slide-out collapsed');
    $('.side-container').addClass('slide-in deployed');
  },

  collapseSideModal: function() {
    $('.side-container').removeClass('slide-in deployed');
    $('.side-container').addClass('slide-out collapsed');
  }


});
