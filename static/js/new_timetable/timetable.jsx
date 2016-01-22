var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');
var Util = require('./util/timetable_util');
var NewPagination = require('./new_pagination');

module.exports = React.createClass({
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  setIndex: function(new_index) {
    return(function () {
      if (new_index >= 0 && new_index < this.state.timetables.length) {
        TimetableActions.setCurrentIndex(new_index);
      }
    }.bind(this));
  },

  getShareLink: function() {
    var link = window.location.host + "/";
    var data = this.getData();
    return link + data;
  },
  getData: function() {
  return Util.getLinkData(this.state.school,
      this.state.courses_to_sections,
      this.state.current_index, this.state.preferences);
  },
  getEndHour: function() {
    // gets the end hour of the current timetable
    var max_end_hour = 18;
    if (!this.hasTimetables()) {
      return max_end_hour;
    }
    var courses = this.state.timetables[this.state.current_index].courses;
    for (var course_index in courses) {
      var course = courses[course_index];
      for (var slot_index in course.slots) {
        var slot = course.slots[slot_index];
        var end_hour = parseInt(slot.time_end.split(":")[0]);
        max_end_hour = Math.max(max_end_hour, end_hour);
      }
    }
    return max_end_hour;

  },

  getHourRows: function() {
    var max_end_hour = this.getEndHour();
    var rows = [];
    for (var i = 8; i <= max_end_hour; i++) { // one row for each hour, starting from 8am
      var time = i + "am";
      if (i >= 12) { // the pm hours
        var hour = (i - 12) > 0 ? i - 12 : i;
        time = hour + "pm";
      }
      rows.push(
          (<tr key={time}>
              <td className="fc-axis fc-time fc-widget-content"><span>{time}</span></td>
              <td className="fc-widget-content"></td>
          </tr>)
      );  
      // for the half hour row
      rows.push(
          (<tr className="fc-minor" key={time + "-half"}>
              <td className="fc-axis fc-time fc-widget-content"></td>
              <td className="fc-widget-content"></td>
          </tr>)
      );

    }

    return rows;
  },


  hasTimetables: function() {
    return this.state.timetables.length > 0;
  },

  render: function() {
      var has_timetables = this.hasTimetables();
      var slot_manager = !has_timetables ? null :
       (<SlotManager toggleModal={this.props.toggleModal} 
                     timetable={this.state.timetables[this.state.current_index]}
                     courses_to_sections={this.state.courses_to_sections}
                     school={this.state.school}/>);

      var hours = this.getHourRows();
      var opacity = this.state.loading ? {opacity: "0.5"} : {};
      var height = (572 + (this.getEndHour() - 18)*52) + "px";
      return (

          <div id="calendar" className="fc fc-ltr fc-unthemed" style={opacity}>
              <div className="fc-toolbar">
                <NewPagination 
                  count={this.state.timetables.length} 
                  next={this.setIndex(this.state.current_index + 1)} 
                  prev={this.setIndex(this.state.current_index - 1)}
                  setIndex={this.setIndex}
                  current_index={this.state.current_index}/>
                <a className="btn btn-primary right calendar-function"
                   data-clipboard-text={this.getShareLink()}>
                  <span className="fui-clip"></span>
                </a>
                <div className="fc-clear"></div>


              </div>

              <div className="fc-view-container">
                <div className="fc-view fc-agendaWeek-view fc-agenda-view">
                  <table>
                    <thead>
                      <tr>
                        <td className="fc-widget-header">
                          <div className="fc-row fc-widget-header" id="custom-widget-header">
                            <table>
                              <thead>
                                <tr>
                                  <th className="fc-axis fc-widget-header"></th>
                                  <th className="fc-day-header fc-widget-header fc-mon">Mon </th>
                                  <th className="fc-day-header fc-widget-header fc-tue">Tue </th>
                                  <th className="fc-day-header fc-widget-header fc-wed">Wed </th>
                                  <th className="fc-day-header fc-widget-header fc-thu">Thu </th>
                                  <th className="fc-day-header fc-widget-header fc-fri">Fri </th>
                                </tr>
                              </thead>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td className="fc-widget-content">
                          <div className="fc-day-grid">
                            
                              <div className="fc-content-skeleton">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td className="fc-axis"></td>
                                      <td></td>
                                      <td></td>
                                      <td></td>
                                      <td></td>
                                      <td></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          <div className="fc-time-grid-container fc-scroller" id="calendar-inner" style={{height: height}}>
                            <div className="fc-time-grid">
                              <div className="fc-bg">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td className="fc-axis fc-widget-content"></td>
                                      <td className="fc-day fc-widget-content fc-mon"></td>
                                      <td className="fc-day fc-widget-content fc-tue"></td>
                                      <td className="fc-day fc-widget-content fc-wed"></td>
                                      <td className="fc-day fc-widget-content fc-thu"></td>
                                      <td className="fc-day fc-widget-content fc-fri"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <div className="fc-slats">
                                <table>
                                  <tbody>
                                    {hours}
                                  </tbody>
                                </table>
                              </div>
                              <hr className="fc-widget-header" id="widget-hr" />
                              <div className="fc-content-skeleton" id="slot-manager">
                                {slot_manager}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
      );
  },

  componentDidMount: function() {
    var clip = new Clipboard('.calendar-function');
    clip.on('success', function(e) {
      ToastActions.createToast("Link copied to clipboard!");
    });
  },

  componentDidUpdate: function() {
    if(Util.browserSupportsLocalStorage()) {
      if (this.state.timetables.length > 0) {
        // save newly generated courses to local storage
        var new_data = this.getData();
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});
