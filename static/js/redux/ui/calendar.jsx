import React from 'react';
import SlotManagerContainer from './containers/slot_manager_container.jsx';
import { Pagination } from './pagination.jsx';

export class Calendar extends React.Component {

  	getCalendarRows() {
	    let rows = [];
	    for (let i = 8; i <= this.getMaxHour(); i++) { // one row for each hour, starting from 8am
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
	getMaxHour() {
    	// gets the end hour of the current timetable, based on the class that ends latest
	    let max_end_hour = 17;
	    if (!this.hasTimetables()) {
	      return max_end_hour;
	    }

	    let courses = this.props.items[this.props.active].courses;
	    for (let course_index in courses) {
	      let course = courses[course_index];
	      for (let slot_index in course.slots) {
	        let slot = course.slots[slot_index];
	        let end_hour = parseInt(slot.time_end.split(":")[0]);
	        max_end_hour = Math.max(max_end_hour, end_hour);
	      }
	    }
	    return max_end_hour;

  	}
  	hasTimetables() {
  		return this.props.items[this.props.active].courses.length > 0;
  	}

	render() {
		let timetables = this.props.items;
		let active = this.props.active;
		let timetable = timetables[active] || []; // First operand if it exists, second if not. #justjavascriptthings
		return (

	      <div id="calendar" className="fc fc-ltr fc-unthemed">
	      <Pagination 
	        	count={timetables.length} 
	        	active={active} 
	        	setActive={this.props.setActive}
	        />
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
	                    <hr className="fc-divider fc-widget-header" />
	                    <div className="fc-time-grid-container">
	                      <div className="fc-time-grid">
	                        <div className="fc-bg">
	                          <table>
	                            <tbody>
	                              <tr>
	                                <td className="fc-axis fc-widget-content" style={{width: 49}} />
	                                <td className="fc-day fc-widget-content fc-mon" />
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
	                          <SlotManagerContainer />
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
	    // let days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
	    // let d = new Date();
	    // let selector = ".fc-" + days[d.getDay()];
	    // $(selector).addClass("fc-today");
  	}

}
