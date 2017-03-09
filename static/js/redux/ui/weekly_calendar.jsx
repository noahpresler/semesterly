import React from 'react';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';
import SlotManagerWeeklyContainer from './containers/slot_manager_weekly_container.jsx';
import CellContainer from './containers/cell_container.jsx'
import WeeklyPaginationContainer from './containers/weekly_pagination_container.jsx'
import { getSunday, isActiveDateFromSunday } from '../actions/calendar_actions.jsx';
import { DAYS_SEVEN, DRAGTYPES, DAY_ABBR, MONTHS } from '../constants.jsx';
import { DropTarget } from 'react-dnd';
import { ShareLink } from './master_slot.jsx';

const Row = (props) => {
    let timeText = props.displayTime ? <span>{props.displayTime}</span> : null;
    let dayCells = DAYS_SEVEN.map(day => <CellContainer day={day}
        time={props.time}
        key={day+props.time}
        loggedIn={props.isLoggedIn} />)
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

class WeeklyCalendar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {shareLinkShown: false};
        this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
        this.getTimelineStyle = this.getTimelineStyle.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
            this.setState({shareLinkShown: true});
        }
        if (nextProps.isModal) {
            // history.replaceState( {} , 'Semester.ly', );
            console.log('show', this.props.shareLink)
        } else {
            history.replaceState( {} , 'Semester.ly', '/dtm');
            console.log('hide')
        }
    }
    getTimelineStyle() { 
        // if ((new Date()).getHours() > this.props.endHour || (new Date()).getHours() < 8) {
        //     return {display: 'none'}
        // }
        let diff = Math.abs(new Date() - new Date().setHours(0,0,0));
        let mins = Math.ceil((diff/1000)/60);
        let top = mins/15.0 * 10.5;
        return {top: top, zIndex: 1};
    }

    getCalendarRows() {
        let rows = [];
        for (let i = 0; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
            let hour = uses12HrTime && i > 12 ? i - 12 : i;
            rows.push(<Row displayTime={hour + ':00'} time={i + ':00'} isLoggedIn={this.props.isLoggedIn} key={i}/>);
            rows.push(<Row time={i + ':30'} isLoggedIn={this.props.isLoggedIn} key={i + 0.5}/>);
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
    render() {
        let calendarHeader = DAYS_SEVEN.map((d, index) =>  (
            <h4 className="fc-day-header fc-widget-header fc-fri" key={d}>
                {DAY_ABBR[index]}<span className={(isActiveDateFromSunday(this.props.activeWeek, index) ? 'active' : '')}>{(new Date(this.props.activeWeek.getTime() + (index * 24 * 60 * 60 * 1000))).getDate()}</span>
            </h4>))
        let shareAvailabilityHeader = (this.props.isModal) ?
            <div id="share-availability-header" onClick={(e) => e.stopPropagation()}>
                <h1>Share Availability</h1>
                <p>Share this link with a friend and they will see when you're busy.  Links expire in 30 minutes</p>
                <span>{ this.props.shareLink }</span>
            </div> : null
        return (
          <div id="calendar" 
            className={"fc fc-ltr fc-unthemed week-calendar seven-days" + ((this.props.isModal) ? " fake-modal" : "")}
            onClick={this.props.hideShareAvailabilityModal}>
            { shareAvailabilityHeader }
            <div id="calendar-header" onClick={(e) => e.stopPropagation()}>
              <div className="fc-toolbar no-print">
                <div className="fc-left">
                  <h2>{ MONTHS[this.props.activeWeek.getMonth()] } <span>{this.props.activeWeek.getFullYear()}</span></h2>
                </div>
                <div className="fc-right">
                  <WeeklyPaginationContainer />
                </div>
                <div className="fc-center" />
                <div className="fc-clear" />
              </div>
              <div id="header-days">
                <h4 id="current-week-number" className={this.props.activeWeekOffset != 0 ? ' future' : ''}>W{ this.props.activeWeek.getWeekNumber() }</h4>
                { calendarHeader }
              </div>
            </div>
            <div id="calendar-body" className="fc-view-container" onClick={(e) => e.stopPropagation()}>
              <div className="fc-view fc-settimana-view fc-agenda-view">
                <table>
                  <tbody className="fc-body">
                    <tr>
                      <td className="fc-widget-content">
                        <div className="fc-time-grid-container">
                          <div className="fc-time-grid">
                            <div className="fc-bg">
                              <table>
                                <tbody>
                                  <tr>
                                    <td className="fc-axis fc-widget-content" style={{width: 49}} />
                                    <td className="fc-day fc-widget-content fc-sun" />
                                    <td className="fc-day fc-widget-content fc-mon" />
                                    <td className="fc-day fc-widget-content fc-tue" />
                                    <td className="fc-day fc-widget-content fc-wed" />
                                    <td className="fc-day fc-widget-content fc-thu" />
                                    <td className="fc-day fc-widget-content fc-fri" />
                                    <td className="fc-day fc-widget-content fc-sat" />
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
                            <div className="fc-timeline" style={this.getTimelineStyle()}/>
                            <div className="fc-content-skeleton">
                              <SlotManagerWeeklyContainer days={DAYS_SEVEN} />
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

export default WeeklyCalendar;
