import React from 'react';
import classnames from 'classnames';
import PaginationContainer  from './containers/pagination_container.jsx';
import SlotManagerContainer from './containers/slot_manager_container.jsx';
import CellContainer from './containers/cell_container.jsx'
import { DRAGTYPES, DAYS } from '../constants.jsx';
import { DropTarget } from 'react-dnd';
import { ShareLink } from './master_slot.jsx';
import Swipeable from 'react-swipeable'

const Row = (props) => {
	let timeText = props.displayTime ? <span>{props.displayTime}</span> : null;
	let dayCells = props.days.map(day => <CellContainer day={day}
									time={props.time}
									key={day+props.time}
									loggedIn={props.isLoggedIn} />);
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

class DayCalendar extends React.Component {
	constructor(props) {
		super(props);
		let d = (new Date()).getDay();
		if (d === 0 || d === 6) { // Sunday or Saturday, respectively
			d = 1; // Show Monday
		}
		let day = d - 1
		this.state = {shareLinkShown: false, day};
		this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
		this.hideShareLink = this.hideShareLink.bind(this);
		this.swipedLeft = this.swipedLeft.bind(this);
		this.swipedRight = this.swipedRight.bind(this);
		this.getTimelineStyle = this.getTimelineStyle.bind(this);
	}
	componentWillReceiveProps(nextProps) {
		if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
			this.setState({shareLinkShown: true});
		}
	}

	getTimelineStyle() { 
		let diff = Math.abs(new Date() - new Date().setHours(8,0,0));
		let mins = Math.ceil((diff/1000)/60);
		let top = mins/15.0 * 13 + 65;
		return {top: top};
	}

	componentDidMount() {
		$('#all-cols').scroll(function() {
		    var pos = $('#all-cols').scrollTop();
		    if (pos > 30) {
		        $('.fc-toolbar').addClass('up');
		        $('#calendar').addClass('up');
		    } else {
		        $('.fc-toolbar').removeClass('up');
		        $('#calendar').removeClass('up');
		    }
		});
	}

	swipedLeft() {
		let d = this.state.day+1
		if (d === -1 || d === 5) { // Sunday or Saturday, respectively
			d = 0; // Show Monday
		}
		this.setState({day: d})
	}

	swipedRight() {
		let d = this.state.day-1
		if (d === -1 || d === 5) { // Sunday or Saturday, respectively
			d = 4; // Show Friday
		}
		this.setState({day: d})
	}

	getCalendarRows() {
    let rows = [];
    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
      let hour = uses12HrTime && i > 12 ? i - 12 : i;
      rows.push(<Row displayTime={hour + ':00'} time={i + ':00'} isLoggedIn={this.props.isLoggedIn} key={i} days={[DAYS[this.state.day]]}/>);
      rows.push(<Row time={i + ':30'} isLoggedIn={this.props.isLoggedIn} key={i + 0.5} days={[DAYS[this.state.day]]}/>);
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
				<button onClick={this.props.handleCreateNewTimetable}
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
	    let dayPills = DAYS.map((day,i) => {
    		return <div key={i}  className="day-pill" onClick={() => this.setState({day: i})}>
    			<div className={classnames("day-circle", {"selected": i === this.state.day})}>
    				{day === 'R' ? 'T' : day}
				</div>
    		</div>
    	});
    	let saveToCalendarButton = (
	    	<button onClick={() => this.props.toggleSaveCalendarModal()}
	    					className="save-timetable">
	    		<img src="static/img/addtocalendar.png"/>
	    	</button>
		);
		return (
	      <div id="calendar" className="fc fc-ltr fc-unthemed day-calendar">
	        <div className="fc-toolbar no-print">
	          <div className="fc-left">
	      		<PaginationContainer />
	      	  </div>
	          <div className="fc-right">
	          	{ shareButton }
	          	{ shareLink }
	          	{ addButton }
	          	{ saveButton }
	          	{ preferenceButton }
	          	{ saveToCalendarButton }
	          </div>
	          <div className="fc-center" />
	          <div className="fc-clear cf">
		          	<div id="day-pills-wrapper">
				        <div id="day-pills">
				          	{dayPills}
				        </div>
				    </div>
			    </div>
	        </div>
    		<Swipeable
		        onSwipedRight={this.swipedRight}
		        onSwipedLeft={this.swipedLeft}>
		        <div className="fc-view-container" style={{}}>
		          <div className="fc-timeline" style={this.getTimelineStyle()}/>
		          <div className="fc-view fc-settimana-view fc-agenda-view">
		            <table>
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
		                          <SlotManagerContainer days={[DAYS[this.state.day]]} />
		                        </div>
		                        <hr className="fc-divider fc-widget-header" style={{display: 'none'}} />
		                      </div>
		                    </div>
		                  </td>
		                </tr>
		              </tbody>
		            </table>
		          </div>
		          <p className="data-last-updated no-print">Data last updated: { this.props.dataLastUpdated && this.props.dataLastUpdated.length && this.props.dataLastUpdated !== "null" ? this.props.dataLastUpdated : null }</p>
		        </div>
	        </Swipeable>
	      </div>
    	);
  	}


}

export default DayCalendar;
