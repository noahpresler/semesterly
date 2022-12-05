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

import React from "react";
import classnames from "classnames";

type CourseModalSectionProps = {
  secName: string;
  instr: string;
  enrolment: number;
  waitlist: number;
  size: number;
  locked: boolean;
  isOnActiveTimetable: boolean;
  lockOrUnlock: Function;
  hoverSection: Function;
  unHoverSection: Function;
};

const isLetter = (ch: string) => ch.length === 1 && ch.match(/[a-z]/i);

// A. MadooeiP. Simari -> A. Madooei, P. Simari
// N. Martinez-Velez -> N. Martinez-Velez
// M. O'Connor -> M. O'Connor
export const parseInstructors = (instr: string) => {
  let parsed = "";
  let currInstructor = "";
  let capitals = 0;
  let prev = "";
  for (let i = 0; i < instr.length; i++) {
    if (
      isLetter(instr[i]) &&
      prev !== "-" &&
      prev !== "'" &&
      instr[i] === instr[i].toUpperCase()
    ) {
      capitals++;
    }
    // start of new instructor
    if (capitals === 3 && isLetter(prev)) {
      parsed += currInstructor;
      parsed += ", ";
      currInstructor = instr[i];
      capitals = 1;
    } else {
      currInstructor += instr[i];
    }
    prev = instr[i];
  }
  parsed += currInstructor;
  return parsed;
};

const CourseModalSection = (props: CourseModalSectionProps) => {
  const seats = props.size - props.enrolment;
  let seatStatus = props.waitlist > 0 ? `${props.waitlist} waitlist` : `${seats} open`;
  if (seats === -1 || props.size === -1) {
    seatStatus = "Unknown";
  }
  const sizeDisplay = props.size === -1 ? "Unknown" : props.size;
  let benchmark = "green";
  if (props.waitlist > 0) {
    benchmark = "red";
  } else if (sizeDisplay === "Unknown") {
    benchmark = "green";
  } else if (seats === 0) {
    benchmark = "red";
  } else if (seats < sizeDisplay / 10) {
    benchmark = "yellow";
  }
  return (
    <div
      className={classnames("modal-section", {
        locked: props.locked,
        "on-active-timetable": props.isOnActiveTimetable,
      })}
      onMouseDown={() => props.lockOrUnlock()}
      onMouseEnter={() => props.hoverSection()}
      onMouseLeave={() => props.unHoverSection()}
    >
      <h4>
        <span>{props.secName}</span>
        <i className="fa fa-calendar-check-o" />
      </h4>
      <h5>{parseInstructors(props.instr)}</h5>
      <h6>
        <span className={benchmark}>{seatStatus}</span>
        <span> / </span>
        <span className="total-seats">{sizeDisplay} seats</span>
      </h6>
      <i className="fa fa-lock" />
    </div>
  );
};
export default CourseModalSection;
