var SlotManager = require('./slot_manager');

module.exports = React.createClass({

  render: function() {
      return (
          <div id="calendar" className="fc fc-ltr fc-unthemed">
              <div className="fc-toolbar">
                <div className="fc-center">
                  <h2 className="light">Fall 2016</h2>
                </div>
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
                                 <SlotManager toggleModal={this.props.toggleModal} />
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

});
