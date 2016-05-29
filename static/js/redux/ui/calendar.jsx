import React from 'react';
import classnames from 'classnames';
import PaginationContainer  from './containers/pagination_container.jsx';
import SlotManagerContainer from './containers/slot_manager_container.jsx';
import CellContainer from './containers/cell_container.jsx'
import { DAYS, DRAGTYPES } from '../constants.jsx';
import { DropTarget } from 'react-dnd';
import { ShareLink } from './master_slot.jsx';

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
	constructor(props) {
		super(props);
		this.state = {shareLinkShown: false};
		this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
		this.hideShareLink = this.hideShareLink.bind(this);
	}
	componentWillReceiveProps(nextProps) {
		if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
			this.setState({shareLinkShown: true});
		}
	}

	getCalendarRows() {
	    let rows = [];
	    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
	      rows.push(<Row time={i + ':00'} show={true} key={i}/>);
	      rows.push(<Row time={i + ':30'} show={false} key={i + 0.5}/>);
	    }

	  	return rows;
	}
	fetchShareTimetableLink() {
		if (this.props.shareLinkValid) {
			this.setState({shareLinkShown: true});
		}
		if (!this.props.isFetchingShareLink) {
			this.props.fetchShareTimetableLink();
		}
	}

	hideShareLink() {
		this.setState({shareLinkShown: false});
	}

	render() {
		let saveIcon = this.props.saving ? <i className = "fa fa-spin fa-circle-o-notch" /> :
			<i className="fa fa-floppy-o"></i>

		let shareButton = (
			<button onClick={this.fetchShareTimetableLink}
							className="save-timetable add-button">
				<i className={classnames("fa",  
					{"fa-share-alt": !this.props.isFetchingShareLink}, 
					{"fa-spin fa-circle-o-notch": this.props.isFetchingShareLink})} />
			</button>
		)
		let shareLink = this.state.shareLinkShown ? 
        <ShareLink 
            link={this.props.shareLink}
            onClickOut={this.hideShareLink} /> : 
        null;
  	let addButton = (
			<button onClick={this.props.createTimetable} 
							className="save-timetable add-button">
				<i className="fa fa-plus" />
			</button>
		)
		let saveButton = (
      <button className="save-timetable add-button" onMouseDown={ this.props.saveTimetable }>
      	{saveIcon}
      </button>
		);
    let preferenceButton = (
    	<button onClick={this.props.togglePreferenceModal}
    					className="save-timetable">
    		<i className="fa fa-cog" />
    	</button>
    )

		return (
	      <div id="calendar" className="fc fc-ltr fc-unthemed">
	        <div className="fc-toolbar">
	          <div className="fc-left">
	      		<PaginationContainer />
	      	  </div>
	          <div className="fc-right">
	          	{ shareButton }
	          	{ shareLink }
	          	{ addButton }
	          	{ saveButton }
	          	{ preferenceButton }
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
	          <p className="data-last-updated">{ this.props.dataLastUpdated.length && this.props.dataLastUpdated !== "null" ? "Data last updated: " + this.props.dataLastUpdated : null }</p>
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
