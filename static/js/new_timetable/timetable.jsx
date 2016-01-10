var SlotManager = require('./slot_manager');
var Pagination = require('./pagination');
var UpdateTimetablesStore = require('./stores/update_timetables');
var TimetableActions = require('./actions/update_timetables');
var ToastActions = require('./actions/toast_actions');
var Util = require('./util/timetable_util');

module.exports = React.createClass({
  mixins: [Reflux.connect(UpdateTimetablesStore)],

  nextTimetable: function() {
    if (this.state.current_index + 1 < this.state.timetables.length) {
      this.setState({current_index: this.state.current_index + 1});
    }
  },

  prevTimetable: function() {
    if (this.state.current_index > 0) {
      this.setState({current_index: this.state.current_index - 1});
    }    
  },

  setIndex: function(new_index) {
    return(function () {
      this.setState({current_index: new_index});
    }.bind(this));
  },

  getShareLink: function() {
    var link = window.location.host + "/";
    var data = Util.getLinkData(this.state.courses_to_sections,
      this.state.current_index);
    return link + data;
  },


  render: function() {
      var slot_manager = this.state.timetables.length == 0 ? null :
       (<SlotManager toggleModal={this.props.toggleModal} 
                     timetable={this.state.timetables[this.state.current_index]}
                     courses_to_sections={this.state.courses_to_sections}/>);
      var loader = !this.state.loading ? null :
      (  <div className="spinner">
            <div className="rect1"></div>
            <div className="rect2"></div>
            <div className="rect3"></div>
            <div className="rect4"></div>
            <div className="rect5"></div>
        </div>)
      return (

          <div id="calendar" className="fc fc-ltr fc-unthemed">
              {loader}
              <div className="fc-toolbar">
                <Pagination 
                  count={this.state.timetables.length} 
                  next={this.nextTimetable} 
                  prev={this.prevTimetable}
                  setIndex={this.setIndex}
                  current_index={this.state.current_index}/>
                  {/*<h2 className="light semester-display">Fall 2016</h2>*/}
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
                          <div className="fc-time-grid-container fc-scroller" id="calendar-inner">
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
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>8am</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>9am</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>10am</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>11am</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>12pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>1pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>2pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>3pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>4pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>5pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>6pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>7pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>8pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>9pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>10pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr>
                                      <td className="fc-axis fc-time fc-widget-content"><span>11pm</span></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
                                    <tr className="fc-minor">
                                      <td className="fc-axis fc-time fc-widget-content"></td>
                                      <td className="fc-widget-content"></td>
                                    </tr>
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
    if(typeof(Storage) !== "undefined") {
      if (this.state.timetables.length > 0) {
        // save newly generated courses to local storage
        var new_data = Util.getLinkData(this.state.courses_to_sections, 
          this.state.current_index);
        localStorage.setItem('data', new_data);
      } else {
        localStorage.removeItem('data');
      }
    } 

  },


});
