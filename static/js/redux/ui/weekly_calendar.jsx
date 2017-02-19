import React from 'react';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';
import SlotManagerWeeklyContainer from './containers/slot_manager_weekly_container.jsx';
import CellContainer from './containers/cell_container.jsx'
import WeeklyPaginationContainer from './containers/weekly_pagination_container.jsx'
import { getSunday } from '../actions/calendar_actions.jsx';
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

class Calendar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {shareLinkShown: false};
        this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
        this.hideShareLink = this.hideShareLink.bind(this);
        this.getTimelineStyle = this.getTimelineStyle.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
            this.setState({shareLinkShown: true});
        }
    }
    getTimelineStyle() { 
        if ((new Date()).getHours() > this.props.endHour || (new Date()).getHours() < 8) {
            return {display: 'none'}
        }
        let diff = Math.abs(new Date() - new Date().setHours(8,0,0));
        let mins = Math.ceil((diff/1000)/60);
        let top = mins/15.0 * 13;
        return {top: top, zIndex: 1};
    }

    getCalendarRows() {
    let rows = [];
    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
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

    hideShareLink() {
        this.setState({shareLinkShown: false});
    }

    render() {
        let calendarHeader = DAYS_SEVEN.map((d, index) =>  (
            <th className="fc-day-header fc-widget-header fc-fri" key={d}>
                {DAY_ABBR[index]} {this.props.activeWeek.getDate() + index}
            </th>))
        return (
          <div id="calendar" className="fc fc-ltr fc-unthemed week-calendar seven-days">
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
            <div className="fc-view-container" style={{position: 'relative'}}>
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
                                { calendarHeader }
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
              <p className="data-last-updated no-print">Data last updated: { this.props.dataLastUpdated && this.props.dataLastUpdated.length && this.props.dataLastUpdated !== "null" ? this.props.dataLastUpdated : null }</p>
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
