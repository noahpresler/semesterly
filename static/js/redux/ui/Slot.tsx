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

import React, { useState } from "react";
import { useAppSelector } from "../hooks";
import { DropTarget } from "react-dnd";
import { DRAG_TYPES, HALF_HOUR_HEIGHT } from "../constants/constants";
import {
  onCustomSlotCreateDrag,
  onCustomSlotCreateDrop,
  onCustomSlotUpdateDrop,
} from "./slotUtils";
import { Classmate, SlotColorData } from "../constants/commonTypes";

const dragSlotTarget = {
  drop(props: any, monitor: any) {
    onCustomSlotUpdateDrop(props, monitor);
  },
};

function collectDragDrop(connect: any) {
  // inject props as drop target
  return {
    connectDragTarget: connect.dropTarget(),
  };
}

const createSlotTarget = {
  drop(props: any, monitor: any) {
    onCustomSlotCreateDrop(props, monitor);
  },
  hover(props: any, monitor: any) {
    onCustomSlotCreateDrag(props, monitor);
  },
};

function collectCreateDrop(connect: any) {
  // inject props as drop target
  return {
    connectCreateTarget: connect.dropTarget(),
  };
}

type SlotProps = {
  [key: string]: any;
  classmates: Classmate[];
  colourId: number;
  depth_level: number;
  fetchCourseInfo: Function;
  id: number;
  location: string;
  locked: boolean;
  meeting_section: string;
  sectionId: number;
  num_conflicts: number;
  primaryDisplayAttribute: string;
  removeCourse: Function;
  shift_index: number;
  is_short_course: boolean;
  date_end: string;
  date_start: string;
  time_end: string;
  time_start: string;
  lockOrUnlockSection: Function;
  connectCreateTarget: Function;
  connectDragTarget: Function;
  uses12HrTime: boolean;
  colorData: SlotColorData[];
};

const Slot = (props: SlotProps) => {
  const isComparingTimetables = useAppSelector(
    (state) => state.compareTimetable.isComparing
  );
  const [hovered, setHovered] = useState(false);

  const stopPropagation = (callback: Function, event: React.SyntheticEvent) => {
    event.stopPropagation();
    callback();
  };

  const onSlotHover = () => {
    setHovered(true);
    updateColours(props.colorData[props.colourId].highlight);
  };

  const onSlotUnhover = () => {
    setHovered(false);
    updateColours(props.colorData[props.colourId].background);
  };

  const getSlotStyles = () => {
    const startHour = parseInt(props.time_start.split(":")[0], 10);
    const startMinute = parseInt(props.time_start.split(":")[1], 10);
    const endHour = parseInt(props.time_end.split(":")[0], 10);
    const endMinute = parseInt(props.time_end.split(":")[1], 10);

    const top =
      (startHour - 8) * (HALF_HOUR_HEIGHT * 2 + 2) +
      startMinute * (HALF_HOUR_HEIGHT / 30);
    const bottom =
      (endHour - 8) * (HALF_HOUR_HEIGHT * 2 + 2) +
      endMinute * (HALF_HOUR_HEIGHT / 30) -
      1;
    // the cumulative width of this slot and all of the slots it is conflicting with
    const totalSlotWidth = 100 - 7 * props.depth_level;
    // the width of this particular slot
    const slotWidthPercentage = totalSlotWidth / props.num_conflicts;
    // the amount of left margin of this particular slot, in percentage
    let pushLeft = props.shift_index * slotWidthPercentage + 7 * props.depth_level;
    if (pushLeft === 50) {
      pushLeft += 0.5;
    }
    return {
      "@media print": {
        boxShadow: `inset 0 0 0 1000px ${props.colorData[props.colourId].background}`,
        backgroundColor: `${props.colorData[props.colourId].background}`,
      },
      top,
      bottom: -bottom,
      right: "0%",
      backgroundColor: props.colorData[props.colourId].background,
      color: props.colorData[props.colourId].font,
      width: `${slotWidthPercentage}%`,
      left: `${pushLeft}%`,
      zIndex: 10 * props.depth_level,
    };
  };

  const updateColours = (colour: string) => {
    // update sibling slot colours (i.e. the slots for the same course)
    $(`.slot-${props.sectionId}-${props.colourId}`).css("background-color", colour);
  };

  const removeButton = hovered ? (
    <i
      className="fa fa-times"
      onClick={(event) => stopPropagation(props.removeCourse, event)}
    />
  ) : null;

  const shortCourseDatesPanel =
    hovered && props.is_short_course ? (
      <div className="slot-shortCourseDates">
        Start Date: <b>{props.date_start}</b>
        <br />
        End Date: <b>{props.date_end}</b>
      </div>
    ) : null;

  let lockButton = null;
  const shortCourseIndicator = props.is_short_course && (
    <span>
      &nbsp;&nbsp;&nbsp;
      <img alt="Short Course" src="/static/img/short_course_icon_15x15.png" />
    </span>
  );

  if (props.locked) {
    lockButton = (
      <i
        title="Unlock this section"
        className="fa fa-lock"
        onClick={(event) => stopPropagation(props.lockOrUnlockSection, event)}
      />
    );
  } else if (hovered) {
    // not a locked section
    // show unlock icon on hover
    lockButton = (
      <i
        title="Lock this section"
        className="fa fa-unlock"
        onClick={(event) => stopPropagation(props.lockOrUnlockSection, event)}
      />
    );
  }
  const friends = props.classmates && props.classmates.length !== 0 && (
    <div className="slot-friends">
      <h3>{props.classmates.length}</h3>
      <i className="fa fa-user" />
      <span>{props.location && props.location !== "" ? " , " : null}</span>
    </div>
  );

  const convertedStart =
    props.uses12HrTime && parseInt(props.time_start.split(":")[0], 10) > 12
      ? `${parseInt(props.time_start.split(":")[0], 10) - 12} : 
    ${props.time_start.split(":")[1]}`
      : props.time_start;
  const convertedEnd =
    props.uses12HrTime && parseInt(props.time_end.split(":")[0], 10) > 12
      ? `${parseInt(props.time_end.split(":")[0], 10) - 12}:${
          props.time_end.split(":")[1]
        }`
      : props.time_end;

  const slot = props.connectCreateTarget(
    props.connectDragTarget(
      <div
        className={`fc-time-grid-event fc-event slot slot-${props.sectionId}-${props.colourId}`}
        style={getSlotStyles()}
        onClick={() => {
          props.fetchCourseInfo();
        }}
        onMouseEnter={onSlotHover}
        onMouseLeave={onSlotUnhover}
        id={`${props.id}`}
      >
        {shortCourseDatesPanel}
        <div
          className="slot-bar"
          style={{ backgroundColor: props.colorData[props.colourId].border }}
        />
        {!isComparingTimetables && removeButton}
        {!isComparingTimetables && lockButton}
        <div className="fc-content">
          <div className="fc-time">
            <span className="fc-time-name">
              {`${props[props.primaryDisplayAttribute]} `}
            </span>
            <span>{props.meeting_section}</span>
          </div>
          <div className="fc-time">
            <span>
              {convertedStart} – {convertedEnd}
            </span>
            {shortCourseIndicator}
          </div>
          <div className="fc-time">
            {friends}
            {props.location}
          </div>
        </div>
      </div>
    )
  );

  return (
    <div>
      <div className="fc-event-container">{slot}</div>
    </div>
  );
};

export default DropTarget(
  DRAG_TYPES.CREATE,
  createSlotTarget,
  collectCreateDrop
)(DropTarget(DRAG_TYPES.DRAG, dragSlotTarget, collectDragDrop)(Slot));
