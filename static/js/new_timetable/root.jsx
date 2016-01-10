var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],

  getInitialState:function() {
    this.getCourses();

    return {};
  },
  render: function() {
    var Modal = Boron['OutlineModal'];

    return (
      <div id="root">
        <div id="toast-container"></div>
        <div id="semesterly-name">Semester.ly</div>
        <div id="control-bar-container">
          <ControlBar toggleModal={this.toggleCourseModal}/>
        </div>
        <div id="modal-container">
          <Modal ref='OutlineModal' className="course-modal">
              <ModalContent />
          </Modal>
        </div>
        <div id="all-cols-container">
          <div id="side-container">Side div</div>
            <div id="cal-container">
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

});
