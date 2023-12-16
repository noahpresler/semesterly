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

import React, { useState, useEffect, useCallback } from "react";
import classNames from "classnames";
// @ts-ignore no available type
import ClickOutHandler from "react-onclickout";
import MasterSlot from "./MasterSlot";
import TimetableNameInput from "./TimetableNameInput";
import CreditTicker from "./CreditTicker";
import { alertsActions } from "../state/slices";
import { getNextAvailableColour } from "../util";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  getActiveTimetable,
  getActiveTimetableCourses,
  getCoursesFromSlots,
  getCurrentSemester,
} from "../state";
import { getCourseShareLink } from "../constants/endpoints";
import {
  addOrRemoveCourse,
  duplicateTimetable,
  fetchCourseInfo,
  loadTimetable,
} from "../actions";
import { Timetable } from "../constants/commonTypes";
import { startComparingTimetables } from "../state/slices/compareTimetableSlice";
import AvgCourseRating from "./AvgCourseRating";
import { selectSlotColorData, selectTheme } from "../state/slices/themeSlice";
import { peerModalActions } from "../state/slices/peerModalSlice";

/**
 * This component displays the timetable name, allows you to switch between timetables,
 * shows credits and average course rating, contains the "Find New Friends" link to open
 * the PeerModal, and mainly displays all of the courses on the student's current
 * timetable using MasterSlots.
 */
const SideBar = () => {
  const dispatch = useAppDispatch();
  const colorData = useAppSelector(selectSlotColorData);
  const timetable = useAppSelector(getActiveTimetable);
  const mandatoryCourses = useAppSelector((state) =>
    getCoursesFromSlots(state, timetable.slots)
  );
  const semester = useAppSelector(getCurrentSemester);
  const savedTimetablesState = useAppSelector(
    (state) => state.userInfo.data.timetables
  );
  const courseToColourIndex = useAppSelector((state) => state.ui.courseToColourIndex);
  const courseToClassmates = useAppSelector(
    (state) => state.classmates.courseToClassmates
  );
  const avgRating = useAppSelector((state) => timetable.avg_rating);
  const activeTimetable = useAppSelector(
    (state) => state.savingTimetable.activeTimetable
  );

  const getShareLink = (courseCode: string) => getCourseShareLink(courseCode, semester);

  const timetableCourses = useAppSelector((state) => getActiveTimetableCourses(state));
  const events = useAppSelector((state) => state.customEvents.events);
  const curTheme = useAppSelector(selectTheme);
  const [showDropdown, setShowDropdown] = useState(false);

  const [hoveredCourse, setHoveredCourse] = useState(-1);
  const [masterSlotListLength, setMasterSlotListLength] = useState(0);

  const hideDropdown = () => {
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown((old) => !old);
  };

  const stopPropagation = (callback: Function, event: React.MouseEvent) => {
    event.stopPropagation();
    hideDropdown();
    callback();
  };

  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  const isMobile = mobile && window.innerWidth < 767 && isPortrait;

  const savedTimetables = savedTimetablesState
    ? savedTimetablesState.map((t: Timetable) => (
        <div className="tt-name" key={t.id} onClick={() => dispatch(loadTimetable(t))}>
          {t.name}
          <button
            onClick={(event) =>
              stopPropagation(
                () => dispatch(alertsActions.alertDeleteTimetable(t)),
                event
              )
            }
            className="row-button"
          >
            <i className="fa fa-trash-o" />
          </button>
          <button
            onClick={(event) =>
              stopPropagation(() => dispatch(duplicateTimetable(t)), event)
            }
            className="row-button"
          >
            <i className="fa fa-clone" />
          </button>
          {!isMobile && activeTimetable.name !== t.name && (
            <button
              onClick={(event) => {
                dispatch(
                  startComparingTimetables({
                    activeTimetable,
                    comparedTimetable: t,
                    theme: curTheme,
                  })
                );
                event.stopPropagation();
              }}
              className="row-button"
            >
              <i className="fa-solid fa-arrows-left-right" />
            </button>
          )}
        </div>
      ))
    : null;


  // Contains all keys for masterSlots (Iterated over for hoveredCourse, i.e. state for index of up/down keyboard shortcuts)
  const masterSlotList: number[] = [];

  let masterSlots = mandatoryCourses
    ? mandatoryCourses.map((course) => {
        const colourIndex =
          course.id in courseToColourIndex
            ? courseToColourIndex[course.id]
            : getNextAvailableColour(courseToColourIndex);
        const professors = course.sections.map((section) => section.instructors);
        const sectionId = timetable.slots.find(
          (slot) => slot.course === course.id
        ).section;

        masterSlotList.push(course.id);

        return (
          <MasterSlot
            key={course.id}
            sectionId={sectionId}
            professors={professors}
            colourIndex={colourIndex}
            classmates={courseToClassmates[course.id]}
            course={course}
            fetchCourseInfo={() => dispatch(fetchCourseInfo(course.id))}
            removeCourse={() => dispatch(addOrRemoveCourse(course.id))}
            getShareLink={getShareLink}
            colorData={colorData}
            isHovered={hoveredCourse === course.id}
          />
        );
      })
    : null;


    // This detects changes to the size of masterSlotList (i.e. how many courses are on the current timetable) and updates the masterSlotList length accordingly
    // Also handles edge case in which hoveredCourse points to the last index in masterSlotList, but a course is deleted by the user. When this happens, hoveredCourse is decremented.
    useEffect(() => {
      if (masterSlotList.length < masterSlotListLength && hoveredCourse === masterSlotListLength - 1) { // i.e. a course was removed and last course was hovered
        setHoveredCourse((prevIndex) => prevIndex - 1)
      }
      setMasterSlotListLength(masterSlotList.length);
    }, [masterSlotList])


    // Handles keypresses: "Up" decrements hoveredCourse, "Down" increments hoveredCourse (both with bounds). 
    const handleKeyPress = useCallback((e) => {
        if (e.key === "ArrowUp") {
          if (hoveredCourse > -1) {
            setHoveredCourse((prevHoveredCourse) => prevHoveredCourse - 1);
          }
        } else if (e.key === "ArrowDown") {
          if (hoveredCourse < masterSlotListLength - 1) {
            setHoveredCourse((prevHoveredCourse) => prevHoveredCourse + 1);
          };  
        } 
      },
      [hoveredCourse, masterSlotListLength]
    );



    // Attaches/unattaches event listener to document
    useEffect(() => {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }, [handleKeyPress]);

  
  const dropItDown =
    savedTimetables && savedTimetables.length !== 0 ? (
      <div className="timetable-drop-it-down" onClick={toggleDropdown}>
        <span className={classNames("tip-down", { down: showDropdown })} />
      </div>
    ) : null;
  if (masterSlots.length === 0) {
    // @ts-ignore
    masterSlots = (
      <div className="empty-state">
        <img src="/static/img/emptystates/masterslots.png" alt="No courses added." />
        <h4>Looks like you don&#39;t have any courses yet!</h4>
        <h3>
          Your selections will appear here along with credits, professors and friends in
          the class
        </h3>
      </div>
    );
  }
  return (
    <div className="side-bar no-print">
      <div className="sb-name">
        <TimetableNameInput />
        <ClickOutHandler onClickOut={hideDropdown}>
          {dropItDown}
          <div
            className={classNames("timetable-names-dropdown", {
              down: showDropdown,
            })}
          >
            <div className="tip-border" />
            <div className="tip" />
            <h4>{`${semester.name} ${semester.year}`}</h4>
            {savedTimetables}
          </div>
        </ClickOutHandler>
      </div>
      <div className="col-1-3" style={{ textAlign: "center" }}>
        <CreditTicker timetableCourses={timetableCourses} events={events} />
      </div>
      <div className="col-2-3">
        <AvgCourseRating avgRating={avgRating} />
      </div>
      <a onClick={() => dispatch(peerModalActions.togglePeerModal())}>
        <h4 className="sb-header">
          Current Courses
          <div className="sb-header-link">
            <i className="fa fa-users" />
            &nbsp;Find new friends
          </div>
        </h4>
      </a>
      <h4 className="sb-tip">
        <b>ProTip:</b> use <i className="fa fa-lock" />
        to lock a section in place.
      </h4>
      <div className="sb-master-slots">{masterSlots}</div>
    </div>
  );
};

// TODO: should be these values by default in the state
SideBar.defaultProps = {
  savedTimetables: null,
  avgRating: 0,
};

export default SideBar;
