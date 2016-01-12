var TimetableStore = require('./stores/update_timetables.js')

var RosterSlot = React.createClass({
  render: function() {
    return (
      <div
        onClick={this.props.toggleModal(this.props.id)}
        className={"slot-outer fc-time-grid-event fc-event slot slot-" + this.props.course}>
        <div className="fc-content">
          <div className="fc-title slot-text-row">{this.props.name}</div>
        </div>
      </div>
    );
  }
})

var CourseRoster = React.createClass({

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.props.timetables.length > 0) {
      // console.log(this.props.timetables[0].courses)
      var slots = this.props.timetables[0].courses.map(function(course) {
        return <RosterSlot {...course} toggleModal={this.props.toggleModal} key={course.code}/>
      }.bind(this));
    } else {
      slots = null;
    }
    var tt = this.props.timetables.length > 0 ? this.props.timetables[0] : null;
    return (
      <div className="roster-container">
        <div className="roster-header">
          <h4>Your Semester</h4>
        </div>
        <div className="course-roster">
          {slots}
        </div>
      </div>
    )
  }
})

var TextbookRoster = React.createClass({

  render: function() {
    return (
      <div className="roster-container">
        <div className="roster-header">
          <h4>Your Textbooks</h4>
        </div>
        <div className="course-roster">
        </div>
      </div>
    )
  }
})

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    return (
      <div ref="sidebar" className="side-container side-collapsed flexzone">
        <CourseRoster toggleModal={this.props.toggleModal} timetables={this.state.timetables}/>
        <TextbookRoster />
      </div>
    )
  }
});