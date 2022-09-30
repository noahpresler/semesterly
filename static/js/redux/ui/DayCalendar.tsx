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

// @ts-ignore ts-migrate(2349)
import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { Swipeable } from "react-swipeable";
import PaginationContainer from "./containers/pagination_container";
import SlotManager from "./SlotManager";
import CellContainer from "./containers/cell_container";
import { DAYS } from "../constants/constants";
import { ShareLink } from "./MasterSlot";
import { useAppSelector } from "../hooks";
import { ShowWeekendsButton } from "./Calendar";

type RowProps = {
  isLoggedIn: boolean;
  time: string;
  displayTime?: string;
  days: string[];
};

const Row = (props: RowProps) => {
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

type DayCalendarProps = {
  triggerSaveCalendarModal: Function;
  isFetchingShareLink: boolean;
  endHour: number;
  handleCreateNewTimetable: Function;
  shareLinkValid: boolean;
  fetchShareTimetableLink: Function;
  saveTimetable: Function;
  isLoggedIn: boolean;
  saving: boolean;
  shareLink?: string;
  uses12HrTime: boolean;
};

const DayCalendar = (props: DayCalendarProps) => {
  const [shareLinkShown, setShareLinkShown] = useState(false);
  const [currentDay, setCurrentDay] = useState(new Date().getDay());

  useEffect(() => {
    // @ts-ignore
    $(".all-cols").scroll(() => {
      // @ts-ignore
      const pos = $(".all-cols").scrollTop();
      if (pos > 30) {
        // @ts-ignore
        $(".fc-toolbar").addClass("up");
        // @ts-ignore
        $("#calendar").addClass("up");
      } else {
        // @ts-ignore
        $(".fc-toolbar").removeClass("up");
        // @ts-ignore
        $("#calendar").removeClass("up");
      }
    });
  }, []);

  const showWeekend = useAppSelector((state) => state.preferences.showWeekend);

  useEffect(() => {
    if (currentDay === 5 && !showWeekend) {
      setCurrentDay(4);
    } else if (currentDay === 6 && !showWeekend) {
      setCurrentDay(0);
    }
  }, [currentDay, showWeekend]);

  const mod = (n: number, m: number) => ((n % m) + m) % m;

  const swipedLeft = () => {
    setCurrentDay((prev) => (showWeekend ? mod(prev + 1, 7) : mod(prev + 1, 5)));
  };

  const swipedRight = () => {
    setCurrentDay((prev) => (showWeekend ? mod(prev - 1, 7) : mod(prev - 1, 5)));
  };

  const getTimelineStyle = () => {
    const now = new Date();
    // don't show line if the current time is before 8am or after the schedule end
    if (now.getHours() > props.endHour || now.getHours() < 8) {
      return { display: "none" };
    }
    const diff = Math.abs(
      new Date().valueOf() - new Date().setHours(8, 0, 0).valueOf()
    );
    const mins = Math.ceil(diff / 1000 / 60);
    const top = (mins / 15.0) * 13;
    return { top, zIndex: 1 };
  };

  const getCalendarRows = () => {
    const rows = [];
    for (let i = 8; i <= props.endHour; i++) {
      // one row for each hour, starting from 8am
      const hour = props.uses12HrTime && i > 12 ? i - 12 : i;
      rows.push(
        <Row
          displayTime={`${hour}:00`}
          time={`${i}:00`}
          isLoggedIn={props.isLoggedIn}
          key={i}
          days={[DAYS[currentDay]]}
        />
      );
      rows.push(
        <Row
          time={`${i}:30`}
          isLoggedIn={props.isLoggedIn}
          key={i + 0.5}
          days={[DAYS[currentDay]]}
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

  const saveIcon = props.saving ? (
    <i className="fa fa-spin fa-circle-o-notch" />
  ) : (
    <i className="fa fa-floppy-o" />
  );

  const shareButton = (
    <button onClick={fetchShareTimetableLink} className="save-timetable add-button">
      <i
        className={classnames(
          "fa",
          { "fa-share-alt": !props.isFetchingShareLink },
          { "fa-spin fa-circle-o-notch": props.isFetchingShareLink }
        )}
      />
    </button>
  );

  const shareLink = shareLinkShown ? (
    <ShareLink
      link={props.shareLink ? props.shareLink : ""}
      type="Calendar"
      onClickOut={() => setShareLinkShown(false)}
    />
  ) : null;
  const addButton = (
    <button
      onClick={() => props.handleCreateNewTimetable()}
      className="save-timetable add-button"
    >
      <i className="fa fa-plus" />
    </button>
  );

  const saveButton = (
    <button
      className="save-timetable add-button"
      onMouseDown={() => props.saveTimetable()}
    >
      {saveIcon}
    </button>
  );

  const days = showWeekend ? DAYS : DAYS.slice(0, 5);
  const dayPills = days.map((day, i) => (
    <div
      key={day}
      className="day-pill"
      onClick={() => setCurrentDay(i)}
      style={{ width: showWeekend ? "14%" : "20%" }}
    >
      <div className={classnames("day-circle", { selected: i === currentDay })}>
        {day === "R" && "Th"}
        {day === "U" && "Su"}
        {day !== "R" && day !== "U" && day}
      </div>
    </div>
  ));

  const saveToCalendarButton = (
    <button onClick={() => props.triggerSaveCalendarModal()} className="save-timetable">
      <img alt="add" src="static/img/addtocalendar.png" />
    </button>
  );

  const toolbar = (
    <>
      {shareButton}
      {shareLink}
      {addButton}
      {saveButton}
      {saveToCalendarButton}
      <ShowWeekendsButton isMobile={true} />
    </>
  );

  return (
    <div className="calendar fc fc-ltr fc-unthemed day-calendar">
      <div className="fc-toolbar no-print">
        <div className="fc-left">
          <PaginationContainer />
        </div>
        <div className="fc-right">{toolbar}</div>
        <div className="fc-center" />
        <div className="fc-clear cf">
          <div className="day-pills">
            <div className="day-pills__wrapper">{dayPills}</div>
          </div>
        </div>
      </div>
      <Swipeable onSwipedRight={swipedRight} onSwipedLeft={swipedLeft}>
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
                            <tbody>{getCalendarRows()}</tbody>
                          </table>
                        </div>
                        <div className="fc-timeline" style={getTimelineStyle()} />
                        <div className="fc-content-skeleton">
                          <SlotManager days={[DAYS[currentDay]]} />
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
};

export default DayCalendar;
