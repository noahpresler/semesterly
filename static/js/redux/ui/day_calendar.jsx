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

import PropTypes from "prop-types";
import React from "react";
import classnames from "classnames";
import Swipeable from "react-swipeable";
import PaginationContainer from "./containers/pagination_container";
import SlotManagerContainer from "./containers/slot_manager_container";
import CellContainer from "./containers/cell_container";
import { DAYS } from "../constants/constants";
import { ShareLink } from "./master_slot";

const Row = (props) => {
  const timeText = props.displayTime ? <span>{props.displayTime}</span> : null;
  const dayCells = props.days.map((day) => (
    <CellContainer
      day={day}
      time={props.time}
      key={day + props.time}
      loggedIn={props.isLoggedIn}
    />
  ));
  return (
    <tr key={props.time}>
      <td className="fc-axis fc-time fc-widget-content cal-row">{timeText}</td>
      <td className="fc-widget-content">
        <div className="week-col">{dayCells}</div>
      </td>
    </tr>
  );
};

Row.defaultProps = {
  displayTime: "",
};

Row.propTypes = {
  displayTime: PropTypes.string,
  isLoggedIn: PropTypes.bool.isRequired,
  time: PropTypes.string.isRequired,
  days: PropTypes.arrayOf(PropTypes.string).isRequired,
};

class DayCalendar extends React.Component {
  constructor(props) {
    super(props);
    let d = new Date().getDay();
    if (d === 0 || d === 6) {
      // Sunday or Saturday, respectively
      d = 1; // Show Monday
    }
    const day = d - 1;
    this.state = { shareLinkShown: false, day };
    this.fetchShareTimetableLink = this.fetchShareTimetableLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
    this.swipedLeft = this.swipedLeft.bind(this);
    this.swipedRight = this.swipedRight.bind(this);
    this.getTimelineStyle = this.getTimelineStyle.bind(this);
  }

  componentDidMount() {
    $(".all-cols").scroll(() => {
      const pos = $(".all-cols").scrollTop();
      if (pos > 30) {
        $(".fc-toolbar").addClass("up");
        $("#calendar").addClass("up");
      } else {
        $(".fc-toolbar").removeClass("up");
        $("#calendar").removeClass("up");
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isFetchingShareLink && !nextProps.isFetchingShareLink) {
      this.setState({ shareLinkShown: true });
    }
  }

  getTimelineStyle() {
    const now = new Date();
    // don't show line if the current time is before 8am or after the schedule end
    if (now.getHours() > this.props.endHour || now.getHours() < 8) {
      return { display: "none" };
    }
    const diff = Math.abs(new Date() - new Date().setHours(8, 0, 0));
    const mins = Math.ceil(diff / 1000 / 60);
    const top = (mins / 15.0) * 13;
    return { top, zIndex: 1 };
  }

  getCalendarRows() {
    const rows = [];
    for (let i = 8; i <= this.props.endHour; i++) {
      // one row for each hour, starting from 8am
      const hour = this.props.uses12HrTime && i > 12 ? i - 12 : i;
      rows.push(
        <Row
          displayTime={`${hour}:00`}
          time={`${i}:00`}
          isLoggedIn={this.props.isLoggedIn}
          key={i}
          days={[DAYS[this.state.day]]}
        />
      );
      rows.push(
        <Row
          time={`${i}:30`}
          isLoggedIn={this.props.isLoggedIn}
          key={i + 0.5}
          days={[DAYS[this.state.day]]}
        />
      );
    }

    return rows;
  }

  swipedLeft() {
    let d = this.state.day + 1;
    if (d === -1 || d === 5) {
      // Sunday or Saturday, respectively
      d = 0; // Show Monday
    }
    this.setState({ day: d });
  }

  swipedRight() {
    let d = this.state.day - 1;
    if (d === -1 || d === 5) {
      // Sunday or Saturday, respectively
      d = 4; // Show Friday
    }
    this.setState({ day: d });
  }

  fetchShareTimetableLink() {
    if (this.props.shareLinkValid) {
      this.setState({ shareLinkShown: true });
    }
    if (!this.props.isFetchingShareLink) {
      this.props.fetchShareTimetableLink();
    }
  }

  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }

  render() {
    const saveIcon = this.props.saving ? (
      <i className="fa fa-spin fa-circle-o-notch" />
    ) : (
      <i className="fa fa-floppy-o" />
    );

    const shareButton = (
      <button
        onClick={this.fetchShareTimetableLink}
        className="save-timetable add-button"
      >
        <i
          className={classnames(
            "fa",
            { "fa-share-alt": !this.props.isFetchingShareLink },
            { "fa-spin fa-circle-o-notch": this.props.isFetchingShareLink }
          )}
        />
      </button>
    );
    const shareLink = this.state.shareLinkShown ? (
      <ShareLink link={this.props.shareLink} onClickOut={this.hideShareLink} />
    ) : null;
    const addButton = (
      <button
        onClick={this.props.handleCreateNewTimetable}
        className="save-timetable add-button"
      >
        <i className="fa fa-plus" />
      </button>
    );
    const saveButton = (
      <button
        className="save-timetable add-button"
        onMouseDown={this.props.saveTimetable}
      >
        {saveIcon}
      </button>
    );
    const preferenceButton = (
      <button
        onClick={() => this.props.togglePreferenceModal()}
        className="save-timetable"
      >
        <i className="fa fa-cog" />
      </button>
    );
    const dayPills = DAYS.map((day, i) => (
      <div key={day} className="day-pill" onClick={() => this.setState({ day: i })}>
        <div className={classnames("day-circle", { selected: i === this.state.day })}>
          {day === "R" ? "T" : day}
        </div>
      </div>
    ));
    const saveToCalendarButton = (
      <button
        onClick={() => this.props.triggerSaveCalendarModal()}
        className="save-timetable"
      >
        <img alt="add" src="static/img/addtocalendar.png" />
      </button>
    );
    return (
      <div className="calendar fc fc-ltr fc-unthemed day-calendar">
        <div className="fc-toolbar no-print">
          <div className="fc-left">
            <PaginationContainer />
          </div>
          <div className="fc-right">
            {shareButton}
            {shareLink}
            {addButton}
            {saveButton}
            {preferenceButton}
            {saveToCalendarButton}
          </div>
          <div className="fc-center" />
          <div className="fc-clear cf">
            <div className="day-pills">
              <div className="day-pills__wrapper">{dayPills}</div>
            </div>
          </div>
        </div>
        <Swipeable onSwipedRight={this.swipedRight} onSwipedLeft={this.swipedLeft}>
          <div className="fc-view-container" style={{}}>
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
                                  <td
                                    className="fc-axis fc-widget-content"
                                    style={{ width: 49 }}
                                  />
                                  <td className="fc-day fc-widget-content fc-mon" />
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="fc-slats">
                            <table>
                              <tbody>{this.getCalendarRows()}</tbody>
                            </table>
                          </div>
                          <div
                            className="fc-timeline"
                            style={this.getTimelineStyle()}
                          />
                          <div className="fc-content-skeleton">
                            <SlotManagerContainer days={[DAYS[this.state.day]]} />
                          </div>
                          <hr
                            className="fc-divider fc-widget-header"
                            style={{ display: "none" }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Swipeable>
      </div>
    );
  }
}

DayCalendar.defaultProps = {
  shareLink: "",
};

DayCalendar.propTypes = {
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

export default DayCalendar;
