var ControlBar = require('./control_bar');
var Timetable = require('./timetable');


    
module.exports = React.createClass({
  getInitialState:function() {
    this.getCourses("jhu", "f");

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
              <div id="modal-content">
                <div className="sk-cube-grid">
                  <div className="sk-cube sk-cube1"></div>
                  <div className="sk-cube sk-cube2"></div>
                  <div className="sk-cube sk-cube3"></div>
                  <div className="sk-cube sk-cube4"></div>
                  <div className="sk-cube sk-cube5"></div>
                  <div className="sk-cube sk-cube6"></div>
                  <div className="sk-cube sk-cube7"></div>
                  <div className="sk-cube sk-cube8"></div>
                  <div className="sk-cube sk-cube9"></div>
                </div>
              </div>
          </Modal>
        </div>
        <div id="cal-container">
          <Timetable toggleModal={this.toggleCourseModal} />
        </div>
      </div>
    );
  },
  toggleCourseModal: function() {
    return function() {
        this.refs['OutlineModal'].toggle();
    }.bind(this); 
  },
  getCourses: function(school, semester) {
    $.get("/courses/" + school + "/" + semester, 
        {}, 
        function(response) {
          courses = response;
        }.bind(this)
    );
  },

});
