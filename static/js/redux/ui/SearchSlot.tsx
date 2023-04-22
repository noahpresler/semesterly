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

import React, { useEffect } from "react";
import { HALF_HOUR_HEIGHT } from "../constants/constants";
import { useAppSelector } from "../hooks";
import { selectTheme } from "../state/slices/themeSlice";
import tinycolor from "tinycolor2";

type SearchSlotProps = {
  depth_level: number;
  num_conflicts: number;
  shift_index: number;
  name: string;
  color: string;
  time_start: string;
  time_end: string;
  id: number;
  uses12HrTime: boolean;
};

/**
 * This component renders custom events in the timetable, and also handles the
 * semi-created state when a student is dragging a custom event to create it. It uses
 * React-DND containers to handle drag and drop events.
 */
const SearchSlot = (props: SearchSlotProps) => {
  useEffect(() => {
    // @ts-ignore
    $(`#${props.id} .fc-time input`).on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        // @ts-ignore
        $(`#${props.id} .fc-time input`).blur();
      }
    });
  }, []);

  const getSlotStyles = () => {
    const startHour = parseInt(props.time_start.split(":")[0], 10);
    const startMinute = parseInt(props.time_start.split(":")[1], 10);
    const endHour = parseInt(props.time_end.split(":")[0], 10);
    const endMinute = parseInt(props.time_end.split(":")[1], 10);

    const top =
      startHour * (HALF_HOUR_HEIGHT * 2 + 2) + startMinute * (HALF_HOUR_HEIGHT / 30);
    const bottom =
      endHour * (HALF_HOUR_HEIGHT * 2 + 2) + (endMinute * (HALF_HOUR_HEIGHT / 30) - 1);
    // the cumulative width of this slot and all of the slots it is conflicting with
    const totalSlotsWidth = 100 - 7 * props.depth_level;
    // the width of this particular slot
    const slotWidthPercentage = totalSlotsWidth / props.num_conflicts;
    // the amount of left margin of this particular slot, in percentage
    let pushLeft = props.shift_index * slotWidthPercentage + 7 * props.depth_level;
    if (pushLeft === 50) {
      pushLeft += 0.5;
    }
    return {
      top,
      bottom: -bottom,
      right: "0%",
      backgroundColor: theme == "light" ? "#ADB3AE" : "#343835",
      width: `${slotWidthPercentage}%`,
      left: `${pushLeft}%`,
      zIndex: 10 * props.depth_level,
    };
  };

  const convertedStart =
    props.uses12HrTime && parseInt(props.time_start.split(":")[0], 10) > 12
      ? `${parseInt(props.time_start.split(":")[0], 10) - 12}:${
          props.time_start.split(":")[1]
        }`
      : props.time_start;

  const convertedEnd =
    props.uses12HrTime && parseInt(props.time_end.split(":")[0], 10) > 12
      ? `${parseInt(props.time_end.split(":")[0], 10) - 12} :${
          props.time_end.split(":")[1]
        }`
      : props.time_end;

  const theme = useAppSelector(selectTheme).name;
  const color = (theme == "light") ? "#000000" : "#adb3ae";
  const coloredSpan = (text: string, color: string) => <span style={{ color }}>{text}</span>;

  //#343835 when dark
  //#adb3ae when light, change text color to black
  const customSlot = (
    <div
      className={`fc-time-grid-event fc-event slot`}
      style={getSlotStyles()}
      id={`${props.id}`}
    >
      <div
        className="slot-bar"
        style={{
          backgroundColor: (theme == "light") 
          ? tinycolor(color).darken(20).toString()
          : tinycolor(color).lighten(10).toString(),
        }}
      />
      <div className="fc-content">
        <div className="fc-saerching">{coloredSpan("Searching between...", color)}</div>
        <div className="fc-time">{coloredSpan(props.name, color)}</div>
        <div className="fc-time">
          {coloredSpan(`${convertedStart} – ${convertedEnd}`, color)}
        </div>
      </div>
    </div>
  );

  return <div className="fc-event-container">{customSlot}</div>;
};

export default SearchSlot;
