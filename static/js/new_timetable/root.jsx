var ControlBar = require('./control_bar');
var Timetable = require('./timetable');


    
module.exports = React.createClass({

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


});
