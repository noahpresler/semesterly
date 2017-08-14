/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';
import Clipboard from 'clipboard';
import PaginationContainer from './containers/pagination_container';
import SlotManagerContainer from './containers/slot_manager_container';
import CellContainer from './containers/cell_container';
import { DAYS } from '../constants/constants';
import { ShareLink } from './master_slot';

const Row = (props) => {
  const timeText = props.displayTime ? <span>{props.displayTime}</span> : null;
  const dayCells = DAYS.map(day => (<CellContainer
    day={day}
    time={props.time}
    key={day + props.time}
    loggedIn={props.isLoggedIn}
  />));
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
  );
};

Row.defaultProps = {
  displayTime: '',
};

Row.propTypes = {
  displayTime: PropTypes.string,
  isLoggedIn: PropTypes.bool.isRequired,
  time: PropTypes.string.isRequired,
};

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
    this.showShareLink = this.showShareLink.bind(this);
    this.getTimelineStyle = this.getTimelineStyle.bind(this);
    this.state = {
      shareLinkShown: false,
      timelineStyle: this.getTimelineStyle(),
    };
  }

  componentDidMount() {
    // Here, we set an interval so that the timeline position is updated once
    // every minute. (Note: 60 * 1000 milliseconds = 1 minute.)
    setInterval(() => {
      this.setState({ timelineStyle: this.getTimelineStyle() });
    }, 60000);

    // let days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
    // let d = new Date("October 13, 2014 11:13:00");
    // let selector = ".fc-" + days[d.getDay()];
    // $(selector).addClass("fc-today");
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
      this.setState({ shareLinkShown: true });
    }
  }

  getTimelineStyle() {
    const now = new Date();
    if (now.getHours() > this.props.endHour ||  // if the current time is before
        now.getHours() < 8 ||// 8am or after the schedule end
        now.getDay() === 0 || // time or if the current day is
        now.getDay() === 6    // Saturday or Sunday, then
        ) { // display no line
      return { display: 'none' };
    }
    const diff = Math.abs(new Date() - new Date().setHours(8, 0, 0));
    const mins = Math.ceil((diff / 1000) / 60);
    const top = (mins / 15.0) * 13;
    return { top, zIndex: 1 };
  }

  getCalendarRows() {
    const rows = [];
    for (let i = 8; i <= this.props.endHour; i++) { // one row for each hour, starting from 8am
      const hour = this.props.uses12HrTime && i > 12 ? i - 12 : i;
      rows.push(<Row
        displayTime={`${hour}:00`}
        time={`${i}:00`}
        isLoggedIn={this.props.isLoggedIn}
        key={i}
      />);
      rows.push(<Row time={`${i}:30`} isLoggedIn={this.props.isLoggedIn} key={i + 0.5} />);
    }

    return rows;
  }

  fetchShareTimetableLink() {
    if (this.props.shareLinkValid) {
      this.setState({ shareLinkShown: true });
    }
    else if (!this.props.isFetchingShareLink) {
      this.props.fetchShareTimetableLink();
    }
  }

  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }

  showShareLink() {
    const idEventTarget = '#clipboard-btn-timetable';
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on('success', () => {
      $(idEventTarget).addClass('clipboardSuccess').text('Copied!');
    });
  }

  render() {
    const saveIcon = this.props.saving ? <i className="fa fa-spin fa-circle-o-notch" /> :
    <i className="fa fa-floppy-o" />;

    const shareButton = (
      <div className="cal-btn-wrapper">
        <button
          onClick={this.fetchShareTimetableLink}
          className="save-timetable add-button"
          data-tip
          data-for="share-btn-tooltip"
        >
          <i
            className={classnames('fa',
                            { 'fa-share-alt': !this.props.isFetchingShareLink },
                            { 'fa-spin fa-circle-o-notch': this.props.isFetchingShareLink })}
            onClick={this.showShareLink}
          />
        </button>
        <ReactTooltip
          id="share-btn-tooltip"
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          <span>Share Calendar</span>
        </ReactTooltip>
      </div>
        );
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              link={this.props.shareLink}
              uniqueId="timetable"
              type="Calendar"
              onClickOut={this.hideShareLink}
            />) :
            null;
    const addButton = (
      <div className="cal-btn-wrapper">
        <button
          onClick={this.props.handleCreateNewTimetable}
          className="save-timetable add-button"
          data-tip
          data-for="add-btn-tooltip"
        >
          <i className="fa fa-plus" />
        </button>
        <ReactTooltip
          id="add-btn-tooltip"
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          <span>New Timetable</span>
        </ReactTooltip>
      </div>
        );
    const saveButton = (
      <div className="cal-btn-wrapper">
        <button
          className="save-timetable add-button"
          onMouseDown={this.props.saveTimetable}
          data-tip
          data-for="save-btn-tooltip"
        >
          {saveIcon}
        </button>
        <ReactTooltip
          id="save-btn-tooltip"
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          <span>Save Timetable</span>
        </ReactTooltip>
      </div>
        );
    const saveToCalendarButton = (
      <div className="cal-btn-wrapper">
        <button
          onClick={() => this.props.triggerSaveCalendarModal()}
          className="save-timetable"
          data-tip
          data-for="saveToCal-btn-tooltip"
        >
          <img src="/static/img/addtocalendar.png" alt="Add to Calendar" />
        </button>
        <ReactTooltip
          id="saveToCal-btn-tooltip"
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          <span>Save to Calendar</span>
        </ReactTooltip>
      </div>
        );
    const preferenceButton = (
      <div className="cal-btn-wrapper">
        <button
          onClick={this.props.togglePreferenceModal}
          className="save-timetable"
          data-tip
          data-for="pref-btn-tooltip"
        >
          <i className="fa fa-cog" />
        </button>
        <ReactTooltip
          id="pref-btn-tooltip"
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          <span>Preferences</span>
        </ReactTooltip>
      </div>
        );
    return (
      <div className="calendar fc fc-ltr fc-unthemed week-calendar">
        <div className="fc-toolbar no-print">
          <div className="fc-left">
            <PaginationContainer />
          </div>
          <div className="fc-right">
            { shareButton }
            { shareLink }
            { addButton }
            { saveButton }
            { saveToCalendarButton }
            { preferenceButton }
          </div>
          <div className="fc-center" />
          <div className="fc-clear" />

        </div>
        <div className="fc-view-container" style={{ position: 'relative' }}>

          <div className="fc-view fc-settimana-view fc-agenda-view">
            <table>
              <thead className="fc-head">
                <tr>
                  <td className="fc-head-container fc-widget-header">
                    <div className="fc-row fc-widget-header">
                      <table>
                        <thead>
                          <tr>
                            <th
                              className="fc-axis fc-widget-header"
                              style={{ width: 49 }}
                            />
                            <th className="fc-day-header fc-widget-header fc-mon">
                                                    Mon
                                                </th>
                            <th className="fc-day-header fc-widget-header fc-tue">
                                                    Tue
                                                </th>
                            <th className="fc-day-header fc-widget-header fc-wed">
                                                    Wed
                                                </th>
                            <th className="fc-day-header fc-widget-header fc-thu">
                                                    Thu
                                                </th>
                            <th className="fc-day-header fc-widget-header fc-fri">
                                                    Fri
                                                </th>
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
                                <td
                                  className="fc-axis fc-widget-content"
                                  style={{ width: 49 }}
                                />
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
                        <div
                          className="fc-timeline"
                          style={this.state.timelineStyle}
                        />
                        <div className="fc-content-skeleton">
                          <SlotManagerContainer days={DAYS} />
                        </div>
                        <hr
                          className="fc-divider fc-widget-header"
                          style={{ display: 'none' }}
                        />
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

}

Calendar.defaultProps = {
  shareLink: '',
};

Calendar.propTypes = {
  togglePreferenceModal: PropTypes.func.isRequired,
  triggerSaveCalendarModal: PropTypes.func.isRequired,
  isFetchingShareLink: PropTypes.bool.isRequired,
  endHour: PropTypes.number.isRequired,
  handleCreateNewTimetable: PropTypes.func.isRequired,
  shareLinkValid: PropTypes.bool.isRequired,
  fetchShareTimetableLink: PropTypes.func.isRequired,
  saveTimetable: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  shareLink: PropTypes.string,
  uses12HrTime: PropTypes.bool.isRequired,
};

export default Calendar;

