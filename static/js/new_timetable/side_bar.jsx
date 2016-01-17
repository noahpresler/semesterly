var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

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

          <div className="fc-title slot-text-row">
            <i className="right fa fa-times remove-course-icon" onClick={this.removeCourse}></i>
            {this.props.name}
          </div>
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
  removeCourse: function(e) {
    TimetableActions.updateCourses({id: this.props.id, 
            section: '', 
            removing: true});
    e.stopPropagation();
  },

});

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
    var numCourses = 0;
    var totalScore = 0;
    if (this.props.timetables.length > 0 && this.props.timetables[0].courses.length > 0 ) {
      for (j=0;j<this.props.timetables[0].courses.length;j++) {
          for (k=0;k<this.props.timetables[0].courses[j].evaluations.length;k++) {
            numCourses++;
            totalScore += this.props.timetables[0].courses[j].evaluations[k].score;
          }
      }
    }
    var avgScoreContent = this.props.timetables.length > 0 && totalScore > 0  ? (
      <div className="rating-wrapper">
          <p>Average Course Rating:</p>
          <div className="sub-rating-wrapper">
            <div className="star-ratings-sprite">
              <span style={{width: 100*totalScore/(5*numCourses) + "%"}} className="rating"></span>
            </div>
          </div>
        </div>) : null;
    return (
      <div className="course-roster course-list">
        <div className="clearfix">
          {slots}
          {avgScoreContent}
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
            <div className="textbook" key={tb['id']}>
                <img height="125" src={img}/>
                <div className="module">
                  <h6 className="line-clamp">{title}</h6>
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
      <div className="course-roster textbook-list">
        <div className="clearfix">
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
      <div ref="sidebar" className="side-container">
        <div className="roster-header">
          <h4>Your Semester</h4>
        </div>
        <CourseRoster toggleModal={this.props.toggleModal} timetables={this.state.timetables}/>
        <div className="roster-header">
          <h4>Your Textbooks</h4>
        </div>
        <TextbookRoster />
      </div>
    )
  }
});