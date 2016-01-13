var ControlBar = require('./control_bar');
var Timetable = require('./timetable');
var ModalContent = require('./modal_content');
var ToastStore = require('./stores/toast_store.js');
var TimetableStore = require('./stores/update_timetables.js');
var course_actions = require('./actions/course_actions');
var Sidebar = require('./side_bar');
var SimpleModal = require('./simple_modal');
var SchoolList = require('./school_list');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore), Reflux.connect(ToastStore)],
  sidebar_collapsed: false,


  render: function() {
    var Modal = Boron['OutlineModal'];
    var school_selector = null;

    if (this.state.school == "") {
      school_selector = (
      <SimpleModal header={"Semester.ly | Welcome"}
                   styles={{backgroundColor: "#FDF5FF", color: "#000"}} 
                   content={<SchoolList setSchool={this.setSchool}/> }/>
      );}
    return (
      <div id="root">
        {school_selector}
        <div id="toast-container"></div>
        <div id="semesterly-name">Semester.ly</div>
        <div id="control-bar-container">
          <ControlBar toggleModal={this.toggleCourseModal}/>
        </div>
        <div id="navicon" onClick={this.toggleSideModal}>
          <span></span><span></span><span></span>
        </div>
        <div id="modal-container">
          <Modal closeOnClick={true} ref='OutlineModal' className="course-modal">
              <ModalContent school={this.state.school}/>
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
    $('.cal-container').removeClass('full-cal');
    $('.side-container').removeClass('full-cal');
  },

  collapseSideModal: function() {
    $('.side-container').addClass('full-cal');
    $('.cal-container').addClass('full-cal');
  }


});
