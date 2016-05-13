import React from 'react';
import PaginationContainer  from './containers/pagination_container.jsx';
import SlotManagerContainer from './containers/slot_manager_container.jsx';
import CellContainer from './containers/cell_container.jsx'
import { DAYS, DRAGTYPES } from '../constants.jsx';
import { DropTarget } from 'react-dnd';

const Row = (props) => {
	let timeText = props.show ? <span>{props.time}</span> : null;
	let dayCells = DAYS.map(day => <CellContainer day={day} time={props.time} key={day+props.time} />)
	return (
		<tr key={props.time}>
        <td className="fc-axis fc-time fc-widget-content cal-row">
        	{timeText}
        </td>
        <td className="fc-widget-content">
          <div className="week-col">
        	{dayCells}
          </div>
        </td>
    </tr>
	)
}

class Calendar extends React.Component {
	getCalendarRows() {
    let rows = [];
    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
      rows.push(<Row time={i + ':00'} show={true} key={i}/>);
      rows.push(<Row time={i + ':30'} show={false} key={i + 0.5}/>);
    }

  	return rows;
	}

	render() {
		let saveIcon = this.props.saving ? <i className = "fa fa-spin fa-circle-o-notch" /> :
			<i className="fa fa-floppy-o"></i>
		let saveButton = (
	        <button className="save-timetable" onMouseDown={ this.props.saveTimetable }>
	        	{saveIcon}
	        </button>
		);
		let addButton = <button
			onClick={this.props.createTimetable} className="save-timetable add-button"><i className="fa fa-plus" /></button>
		let shareButton = <button
			className="save-timetable add-button"><i className="fa fa-share-alt" /></button>
		// let downloadButton = <button
		// 	className="save-timetable add-button"><i className="fa fa-download" /></button>
    let downloadButton = null
		return (

	      <div id="calendar" className="fc fc-ltr fc-unthemed">
	        <div className="fc-toolbar">
	          <div className="fc-left">
	      		<PaginationContainer />
	      	  </div>
	          <div className="fc-right">
	          	{ downloadButton }
	          	{ shareButton }
	          	{ addButton }
	          	{ saveButton }
	          </div>
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
	    // let d = new Date("October 13, 2014 11:13:00");
	    // let selector = ".fc-" + days[d.getDay()];
	    // $(selector).addClass("fc-today");
  	}

}

export default Calendar;
