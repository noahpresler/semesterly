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
import { DragSource, DropTarget } from "react-dnd";
import tinycolor from "tinycolor2";
import { removeCustomSlot } from "../actions/timetable_actions";
import { DRAG_TYPES, HALF_HOUR_HEIGHT } from "../constants/constants";
import { useAppDispatch } from "../hooks";
import { customEventsActions } from "../state/slices/customEventsSlice";
import {
  canDropCustomSlot,
  onCustomSlotCreateDrag,
  onCustomSlotCreateDrop,
  onCustomSlotUpdateDrop,
} from "./slotUtils";

type CustomSlotProps = {
  depth_level: number;
  num_conflicts: number;
  shift_index: number;
  name: string;
  location: string;
  color: string;
  time_start: string;
  time_end: string;
  credits: string;
  id: number;
  uses12HrTime: boolean;
  preview: boolean;
  connectDragSource: Function;
  connectDragTarget: Function;
  connectCreateTarget: Function;
};

const dragSlotSource = {
  beginDrag(props: any) {
    return {
      timeStart: props.time_start,
      timeEnd: props.time_end,
      id: props.id,
    };
  },
  endDrag() {},
};

function collectDragSource(connect: any) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
  };
}

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
  canDrop(props: any, monitor: any) {
    return canDropCustomSlot(props, monitor);
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

const CustomSlot = (props: CustomSlotProps) => {
  const [hovered, setHovered] = useState(false);

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
      (startHour - 8) * (HALF_HOUR_HEIGHT * 2 + 2) +
      startMinute * (HALF_HOUR_HEIGHT / 30);
    const bottom =
      (endHour - 8) * (HALF_HOUR_HEIGHT * 2 + 2) +
      (endMinute * (HALF_HOUR_HEIGHT / 30) - 1);
    if (props.preview) {
      // don't take into account conflicts, reduce opacity, increase z-index
      return {
        top,
        bottom: -bottom,
        zIndex: 10,
        right: "0%",
        backgroundColor: "#F8F6F7",
        color: "#222",
        width: "100%",
        left: 0,
        opacity: 0.5,
      };
    }
    // the cumulative width of this slot and all of the slots it is conflicting with
    const totalSlotsWidth = 100 - 7 * props.depth_level;
    // the width of this particular slot
    const slotWidthPercentage = totalSlotsWidth / props.num_conflicts;
    // the amount of left margin of this particular slot, in percentage
    let pushLeft = props.shift_index * slotWidthPercentage + 7 * props.depth_level;
    if (pushLeft === 50) {
      pushLeft += 0.5;
    }
    const color = tinycolor(props.color).isLight() ? "#222222" : "#FFFFFF";
    return {
      top,
      bottom: -bottom,
      right: "0%",
      color,
      backgroundColor: props.color,
      width: `${slotWidthPercentage}%`,
      left: `${pushLeft}%`,
      zIndex: 10 * props.depth_level,
    };
  };

  const dispatch = useAppDispatch();
  const removeCustomButtonClicked = (event: any) => {
    event.stopPropagation();
    dispatch(removeCustomSlot(props.id));
  };

  const removeButton = hovered ? (
    <i className="fa fa-times" onClick={(event) => removeCustomButtonClicked(event)} />
  ) : null;

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

  const showModalIfNotPreview = () => {
    if (!props.preview) {
      dispatch(customEventsActions.showCustomEventsModal(props.id));
    }
  };

  const customSlot = (
    <div
      className={"fc-time-grid-event fc-event slot"}
      style={getSlotStyles()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={showModalIfNotPreview}
      id={`${props.id}`}
    >
      <div
        className="slot-bar"
        style={{ backgroundColor: tinycolor(props.color).darken(20).toString() }}
      />
      {removeButton}
      <div className="fc-content">
        <div className="fc-time">
          <span>{props.name}</span>
        </div>
        <div className="fc-time">
          <span>
            {convertedStart} – {convertedEnd}
          </span>
        </div>
        <div className="fc-time">
          <span>{props.location}</span>
        </div>
        <div className="fc-time">
          {parseFloat(props.credits) !== 0 && (
            <span>{`${
              props.credits.toString().endsWith(".0")
                ? parseInt(props.credits, 10)
                : props.credits
            } credit${parseFloat(props.credits) !== 1 ? "s" : ""}`}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fc-event-container">
      {props.connectCreateTarget(
        props.connectDragTarget(props.connectDragSource(customSlot))
      )}
    </div>
  );
};

export default DropTarget(
  DRAG_TYPES.DRAG,
  dragSlotTarget,
  collectDragDrop
)(
  DropTarget(
    DRAG_TYPES.CREATE,
    createSlotTarget,
    collectCreateDrop
  )(DragSource(DRAG_TYPES.DRAG, dragSlotSource, collectDragSource)(CustomSlot))
);
