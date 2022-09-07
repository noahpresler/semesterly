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

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import classnames from "classnames";
import ReactTooltip from "react-tooltip";
import Clipboard from "clipboard";
import PaginationContainer from "./containers/pagination_container";
import SlotManager from "./SlotManager";
import CellContainer from "./containers/cell_container";
import { DAYS } from "../constants/constants";
import { ShareLink } from "./MasterSlot";
import { signupModalActions } from "../state/slices/signupModalSlice";
import { useAppSelector } from "../hooks";

type RowProps = {
  isLoggedIn: boolean;
  time: string;
  displayTime?: string;
  customEventModeOn: boolean;
};

const Row = (props: RowProps) => {
  const showWeekend = useAppSelector((state) => state.preferences.showWeekend);
  const days = showWeekend ? DAYS : DAYS.slice(0, 5);
  const timeText = props.displayTime ? <span>{props.displayTime}</span> : null;
  const dayCells = days.map((day) => (
    <CellContainer
      day={day}
      time={props.time}
      key={day + props.time}
      loggedIn={props.isLoggedIn}
      customEventModeOn={props.customEventModeOn}
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

type CalendarProps = {
  showPreferenceModal: Function;
  triggerSaveCalendarModal: Function;
  isFetchingShareLink: boolean;
  endHour: number;
  handleCreateNewTimetable: Function;
  shareLinkValid: boolean;
  fetchSISTimetableData: Function;
  fetchShareTimetableLink: Function;
  isLoggedIn: boolean;
  uses12HrTime: boolean;
  registrarSupported: boolean;
  shareLink?: string;
};

const Calendar = (props: CalendarProps) => {
  const [shareLinkShown, setShareLinkShown] = useState(false);
  const [customEventModeOn, setCustomEventModeOn] = useState(false);

  const getTimelineStyle = () => {
    const now = new Date();
    if (
      now.getHours() > props.endHour || // if the current time is before
      now.getHours() < 8 || // 8am or after the schedule end
      now.getDay() === 0 || // time or if the current day is
      now.getDay() === 6 // Saturday or Sunday, then
    ) {
      // display no line
      return { display: "none" };
    }
    const diff = Math.abs(
      new Date().valueOf() - new Date().setHours(8, 0, 0).valueOf()
    );
    const mins = Math.ceil(diff / 1000 / 60);
    const top = (mins / 15.0) * 13;
    return { top, zIndex: 1 };
  };
  const [timelineStyle, setTimelineStyle] = useState(getTimelineStyle());

  useEffect(() => {
    setInterval(() => {
      setTimelineStyle(getTimelineStyle());
    }, 60 * 1000);
  }, []);

  const getCalendarRows = () => {
    const rows = [];
    for (let i = 8; i <= props.endHour; i++) {
      // one row for each hour, starting from 8am
      const hour = props.uses12HrTime && i > 12 ? i - 12 : i;
      rows.push(
        <Row
          key={i}
          isLoggedIn={props.isLoggedIn}
          time={`${i}:00`}
          displayTime={`${hour}:00`}
          customEventModeOn={customEventModeOn}
        />
      );
      rows.push(
        <Row
          key={i + 0.5}
          isLoggedIn={props.isLoggedIn}
          time={`${i}:30`}
          customEventModeOn={customEventModeOn}
        />
      );
    }
    return rows;
  };

  const fetchShareTimetableLink = () => {
    if (props.shareLinkValid) {
      setShareLinkShown(true);
    } else if (!props.isFetchingShareLink) {
      setShareLinkShown(true);
      props.fetchShareTimetableLink();
    }
  };
  const showShareLink = () => {
    const idEventTarget = "#clipboard-btn-timetable";
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on("success", () => {
      // @ts-ignore
      $(idEventTarget).addClass("clipboardSuccess").text("Copied!");
    });
  };

  const sisButtonClicked = () => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "https://sis.jhu.edu/sswf/go/";
    form.encType = "application/x-www-form-urlencoded";
    document.body.appendChild(form);
    const input = document.createElement("input");
    input.name = "data";
    input.type = "hidden";
    input.value = JSON.stringify(props.fetchSISTimetableData());
    form.appendChild(input);
    form.submit();
  };

  const dispatch = useDispatch();
  const customEventModeButtonClicked = () => {
    if (props.isLoggedIn) {
      setCustomEventModeOn((previous) => !previous);
    } else {
      dispatch(signupModalActions.showSignupModal());
    }
  };

  const customEventDescription = customEventModeOn ? (
    <h4 className="custom-instructions">
      Click, drag, and release to create your custom event
    </h4>
  ) : null;

  const addSISButton = props.registrarSupported ? (
    <div className="cal-btn-wrapper">
      <button
        type="submit"
        form="form1"
        className="save-timetable add-button"
        data-for="sis-btn-tooltip"
        data-tip
        onClick={sisButtonClicked}
      >
        <img src="/static/img/addtosis.png" alt="SIS" style={{ marginTop: "2px" }} />
      </button>
      <ReactTooltip
        id="sis-btn-tooltip"
        class="tooltip"
        type="dark"
        place="bottom"
        effect="solid"
      >
        <span>SIS Add to Cart</span>
      </ReactTooltip>
    </div>
  ) : null;

  const shareButton = (
    <div className="cal-btn-wrapper">
      <button
        onClick={fetchShareTimetableLink}
        className="save-timetable add-button"
        data-tip
        data-for="share-btn-tooltip"
      >
        <i
          className={classnames(
            "fa",
            { "fa-share-alt": !props.isFetchingShareLink },
            { "fa-spin fa-circle-o-notch": props.isFetchingShareLink }
          )}
          onClick={showShareLink}
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

  const shareLink = shareLinkShown ? (
    <ShareLink
      link={props.shareLink ? props.shareLink : ""}
      type="Calendar"
      onClickOut={() => setShareLinkShown(false)}
    />
  ) : null;

  const addNewTimetableButton = (
    <div className="cal-btn-wrapper">
      <button
        onClick={() => props.handleCreateNewTimetable()}
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

  const toggleCustomEventModeButton = (
    <div className="cal-btn-wrapper">
      <button
        className="save-timetable add-button"
        onMouseDown={() => customEventModeButtonClicked()}
        data-tip
        data-for="save-btn-tooltip"
      >
        <i
          className={classnames("fa fa-pencil", {
            addingCustomSlot: customEventModeOn,
          })}
        />
      </button>
      <ReactTooltip
        id="save-btn-tooltip"
        class="tooltip"
        type="dark"
        place="bottom"
        effect="solid"
      >
        <span>Add Custom Event</span>
      </ReactTooltip>
    </div>
  );

  const saveToCalendarButton = (
    <div className="cal-btn-wrapper">
      <button
        onClick={() => props.triggerSaveCalendarModal()}
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
        onClick={() => props.showPreferenceModal()}
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

  const isComparingTimetables = useAppSelector(
    (state) => state.compareTimetable.isComparing
  );
  const toolbar = isComparingTimetables ? (
    <>{preferenceButton}</>
  ) : (
    <>
      {addSISButton}
      {toggleCustomEventModeButton}
      {shareButton}
      {shareLink}
      {addNewTimetableButton}
      {saveToCalendarButton}
      {preferenceButton}
    </>
  );

  const showWeekend = useAppSelector((state) => state.preferences.showWeekend);

  return (
    <div
      className={classnames("calendar fc fc-ltr fc-unthemed week-calendar", {
        hoverCustomSlot: customEventModeOn,
      })}
    >
      <div className="fc-toolbar no-print">
        <div className="fc-left">
          {!customEventModeOn ? <PaginationContainer /> : null}
          {customEventDescription}
        </div>
        <div className="fc-right">{toolbar}</div>
        <div className="fc-center" />
        <div className="fc-clear" />
      </div>
      <div className="fc-view-container" style={{ position: "relative" }}>
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
                          <th className="fc-day-header fc-widget-header fc-mon">Mon</th>
                          <th className="fc-day-header fc-widget-header fc-tue">Tue</th>
                          <th className="fc-day-header fc-widget-header fc-wed">Wed</th>
                          <th className="fc-day-header fc-widget-header fc-thu">Thu</th>
                          <th className="fc-day-header fc-widget-header fc-fri">Fri</th>
                          {showWeekend && (
                            <th className="fc-day-header fc-widget-header fc-sat">
                              Sat
                            </th>
                          )}
                          {showWeekend && (
                            <th className="fc-day-header fc-widget-header fc-sun">
                              Sun
                            </th>
                          )}
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
                              {showWeekend && (
                                <td className="fc-day fc-widget-content fc-sat" />
                              )}
                              {showWeekend && (
                                <td className="fc-day fc-widget-content fc-sun" />
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="fc-slats">
                        <table>
                          <tbody>{getCalendarRows()}</tbody>
                        </table>
                      </div>
                      <div className="fc-timeline" style={timelineStyle} />
                      <div className="fc-content-skeleton">
                        <SlotManager days={showWeekend ? DAYS : DAYS.slice(0, 5)} />
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
    </div>
  );
};

export default Calendar;
