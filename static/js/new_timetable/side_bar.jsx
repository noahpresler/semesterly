var TimetableStore = require('./stores/update_timetables.js')

var RosterSlot = React.createClass({
  render: function() {
    var styles={backgroundColor: this.props.colour, borderColor: this.props.colour};
    return (
      <div
        onClick={this.props.toggleModal(this.props.id)}
        style={styles}
        onMouseEnter={this.highlightSiblings}
        onMouseLeave={this.unhighlightSiblings}
        className={"slot-outer fc-time-grid-event fc-event slot slot-" + this.props.id}>
        <div className="fc-content">
          <div className="fc-title slot-text-row">{this.props.name}</div>
        </div>
      </div>
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

var CourseRoster = React.createClass({

  render: function() {
    // use the timetable for slots because it contains the most information
    if (this.props.timetables.length > 0) {
      var slots = this.props.timetables[0].courses.map(function(course) {
        var colour =  COURSE_TO_COLOUR[course.code];

        return <RosterSlot {...course} toggleModal={this.props.toggleModal} key={course.code} colour={colour}/>
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
          return ( 
            <div className="textbook" key={tb['id']}>
                <img height="125" src={tb['image_url']}/>
                <div className="module">
                  <h6 className="line-clamp">{tb['title']}</h6>
                  </div>
                <a href={tb['detail_url']} target="_blank">
                  <img src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif" width="120" height="28" border="0"/>
                </a>
            </div>);
       }.bind(this));
    } else {
      var tb_elements = null;
    }
    return (
      <div className="roster-container">
        <div className="roster-header">
          <h4>Your Textbooks</h4>
        </div>
        <div className="course-roster">
            {tb_elements}
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