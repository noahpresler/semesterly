import React from 'react';
import PaginationContainer  from './containers/pagination_container.jsx';
import SlotManagerContainer from './containers/slot_manager_container.jsx';
import { DAYS, DRAGTYPES } from '../constants.jsx';
import { DropTarget } from 'react-dnd';

function convertToHalfHours(str) {
	let start = parseInt(str.split(':')[0])
	return str.split(':')[1] == '30' ? start*2 + 1 : start * 2;
}

function convertToStr(halfHours) {
	let num_hours = Math.floor(halfHours/2)
	return halfHours % 2 ? num_hours + ':30' : num_hours + ':00' 
}

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
  };
}

const dragCellTarget = {
	drop(props, monitor) {
		let { timeStart, timeEnd, id } = monitor.getItem();

    let startHalfhour = convertToHalfHours(timeStart)
    let endHalfhour = convertToHalfHours(timeEnd)

    let newStartHour = convertToHalfHours(props.time)
    let newEndHour = newStartHour + (endHalfhour - startHalfhour)

    // console.log(props.time, convertToStr(newEndHour))
		props.moveCustomSlot(props.time, convertToStr(newEndHour), props.day, id);
	}
}

// TODO: separate into container and UI
class Row extends React.Component {
	moveSlotToHere(clickEvent) {
		let calOffset = clickEvent.clientX - $(".week-col").offset().left
		let dayWidth = $(".week-col").width()/5;
		let clickedDay = DAYS[Math.floor(calOffset/dayWidth)]
		let withinBounds = true // TODO
		if (withinBounds) {
			this.props.moveCustomSlot('10:00', '12:00', clickedDay, 0)
		}
	}

	render() {
		let timeText = this.props.show ? <span>{this.props.time}</span> : null;
		let dayCells = DAYS.map(day => <Cell day={day} time={this.props.time} moveCustomSlot={this.props.moveCustomSlot} key={day+this.props.time} />)
		return (
			<tr key={this.props.time}>
	        <td className="fc-axis fc-time fc-widget-content cal-row">
	        	{timeText}
	        </td>
	        <td className="fc-widget-content week-col" 
	        		onClick={(event) => this.moveSlotToHere(event)}>
	        		{dayCells}
	        </td>
	    </tr>
		)
	}
}

const Cell = DropTarget(DRAGTYPES.DRAG, dragCellTarget, collect)((props) => props.connectDropTarget(<div className='cal-cell'></div>))
// const Cell = (props) => {
// 	console.log(props)
// 	return props.connectDropTarget(<div className='cal-cell'></div>)
// }

class Calendar extends React.Component {
	getCalendarRows() {
    let rows = [];
    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
      rows.push(<Row time={i + ':00'} show={true} moveCustomSlot={this.props.moveCustomSlot} />);
      rows.push(<Row time={i + ':30'} show={false} moveCustomSlot={this.props.moveCustomSlot} />);
      // rows.push(
      //     ( <tr key={time}>
      //             <td className="fc-axis fc-time fc-widget-content cal-row">
      //             	<span>{time}</span>
      //             </td>
      //             <td className="fc-widget-content" />
      //         </tr>)
      // );  
      // // for the half hour row
      // rows.push(
      //     (<tr key={time + ".5"} className="fc-minor">
      //       	<td className="fc-axis fc-time fc-widget-content cal-row"/>
      //       	<td className="fc-widget-content" />
      //   	  </tr>)
      // );
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
		let downloadButton = null;
		// let customSlotButton = (
		// 		<button className="save-timetable add-button" 
		// 						onClick={this.props.addCustomSlot}>
		// 			<i className="fa fa-futbol-o" />
		// 		</button>
		// )
		let customSlotButton = null;
		return (

	      <div id="calendar" className="fc fc-ltr fc-unthemed">
	        <div className="fc-toolbar">
	          <div className="fc-left">
	      		<PaginationContainer />
	      	  </div>
	          <div className="fc-right">
	          	{ customSlotButton }
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
