var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var course_actions = require('./actions/course_actions');
    
module.exports = React.createClass({
  getInitialState:function() {
    this.getCourses();

    return {};
  },
  render: function() {
    var Modal = Boron['OutlineModal'];

    return (
      <div id="root">
        <div id="control-bar-container">
          <ControlBar toggleModal={this.toggleCourseModal}/>
        </div>
        <div id="modal-container">
          <Modal ref='OutlineModal' className="course-modal">
              <ModalContent />
          </Modal>
        </div>
        <div id="cal-container">
          <Timetable toggleModal={this.toggleCourseModal} />
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
