import React from 'react';

export class Calendar extends React.Component {
	getInitialState() {
		return {};
	}
  	getCalendarRows() {

	                              
	    let rows = [];
	    for (let i = 8; i <= 20; i++) { // one row for each hour, starting from 8am
	      let time = i + ":00";
	      rows.push(
	          ( <tr key={time}>
                    <td className="fc-axis fc-time fc-widget-content cal-row">
                    	<span>{time}</span>
                    </td>
                    <td className="fc-widget-content" />
                </tr>)
	      );  

	      // for the half hour row
	      rows.push(
	          (<tr key={time + ".5"} className="fc-minor">
	            	<td className="fc-axis fc-time fc-widget-content cal-row"/>
	            	<td className="fc-widget-content" />
          	  </tr>)
	      );

	    }

    	return rows;
  	}

	render() { 
		return (

	      <div id="calendar" className="fc fc-ltr fc-unthemed">
	        <div className="fc-toolbar">
	          <div className="fc-left" />
	          <div className="fc-right" />
	          <div className="fc-center" />
	          <div className="fc-clear" />
	        </div>
	        <div className="fc-view-container" style={{}}>
	          <div className="fc-view fc-settimana-view fc-agenda-view">
	            <table>
	              <thead className="fc-head">
	                <tr>
	                  <td className="fc-head-container fc-widget-header">
	                    <div className="fc-row fc-widget-header">
	                      <table>
	                        <thead>
	                          <tr>
	                            <th className="fc-axis fc-widget-header" style={{width: 49}} />
	                            <th className="fc-day-header fc-widget-header fc-mon">Mon</th>
	                            <th className="fc-day-header fc-widget-header fc-tue">Tue</th>
	                            <th className="fc-day-header fc-widget-header fc-wed">Wed</th>
	                            <th className="fc-day-header fc-widget-header fc-thu">Thu</th>
	                            <th className="fc-day-header fc-widget-header fc-fri">Fri</th>
	                          </tr>
	                        </thead>
	                      </table>
	                    </div>
	                  </td>
	                </tr>
	              </thead>
	              <tbody className="fc-body">
	                <tr>
	                  <td className="fc-widget-content">
	                    <div className="fc-day-grid">
	                      <div className="fc-row fc-week fc-widget-content">
	                        <div className="fc-bg">
	                          <table>
	                            <tbody>
	                              <tr>
	                                <td className="fc-axis fc-widget-content" style={{width: 49}}>
	                                	<span></span>
	                                </td>
	                                <td className="fc-day fc-widget-content fc-mon" />
	                                <td className="fc-day fc-widget-content fc-tue" />
	                                <td className="fc-day fc-widget-content fc-wed" />
	                                <td className="fc-day fc-widget-content fc-thu" />
	                                <td className="fc-day fc-widget-content fc-fri" />
	                              </tr>
	                            </tbody>
	                          </table>
	                        </div>
	                        <div className="fc-content-skeleton">
	                          <table>
	                            <tbody>
	                              <tr>
	                                <td className="fc-axis" style={{width: 49}} />
	                                <td />
	                                <td />
	                                <td />
	                                <td />
	                                <td />
	                              </tr>
	                            </tbody>
	                          </table>
	                        </div>
	                      </div>
	                    </div>
	                    <hr className="fc-divider fc-widget-header" />
	                    <div className="fc-time-grid-container">
	                      <div className="fc-time-grid">
	                        <div className="fc-bg">
	                          <table>
	                            <tbody>
	                              <tr>
	                                <td className="fc-axis fc-widget-content" style={{width: 49}} />
	                                <td className="fc-day fc-widget-content fc-mon fc-past" />
	                                <td className="fc-day fc-widget-content fc-tue" />
	                                <td className="fc-day fc-widget-content fc-wed" />
	                                <td className="fc-day fc-widget-content fc-thu" />
	                                <td className="fc-day fc-widget-content fc-fri" />
	                              </tr>
	                            </tbody>
	                          </table>
	                        </div>
	                        <div className="fc-slats">
	                          <table>
	                            <tbody>
	                              {this.getCalendarRows()}
	                            </tbody>
	                          </table>
	                        </div>
	                        <div className="fc-content-skeleton">
	                          <table>
	                            <tbody>
	                              <tr>
	                                <td className="fc-axis" style={{width: 49}} />
	                                <td>
	                                  <div className="fc-content-col">
	                                    <div className="fc-event-container fc-helper-container" />
	                                    <div className="fc-event-container" />
	                                    <div className="fc-highlight-container" />
	                                    <div className="fc-bgevent-container" />
	                                    <div className="fc-business-container" />
	                                  </div>
	                                </td>
	                                <td>
	                                  <div className="fc-content-col">
	                                    <div className="fc-event-container fc-helper-container" />
	                                    <div className="fc-event-container" />
	                                    <div className="fc-highlight-container" />
	                                    <div className="fc-bgevent-container" />
	                                    <div className="fc-business-container" />
	                                  </div>
	                                </td>
	                                <td>
	                                  <div className="fc-content-col">
	                                    <div className="fc-event-container fc-helper-container" />
	                                    <div className="fc-event-container" />
	                                    <div className="fc-highlight-container" />
	                                    <div className="fc-bgevent-container" />
	                                    <div className="fc-business-container" />
	                                  </div>
	                                </td>
	                                <td>
	                                  <div className="fc-content-col">
	                                    <div className="fc-event-container fc-helper-container" />
	                                    <div className="fc-event-container" />
	                                    <div className="fc-highlight-container" />
	                                    <div className="fc-bgevent-container" />
	                                    <div className="fc-business-container" />
	                                  </div>
	                                </td>
	                                <td>
	                                  <div className="fc-content-col">
	                                    <div className="fc-event-container fc-helper-container" />
	                                    <div className="fc-event-container" />
	                                    <div className="fc-highlight-container" />
	                                    <div className="fc-bgevent-container" />
	                                    <div className="fc-business-container" />
	                                  </div>
	                                </td>
	                              </tr>
	                            </tbody>
	                          </table>
	                        </div>
	                        <hr className="fc-divider fc-widget-header" style={{display: 'none'}} />
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
  	}

  	componentDidMount() {
	    // var days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
	    // var d = new Date();
	    // var selector = ".fc-" + days[d.getDay()];
	    // $(selector).addClass("fc-today");
  	}

}



