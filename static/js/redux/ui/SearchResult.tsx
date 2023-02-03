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

import React, { useState, MouseEvent } from "react";
import classNames from "classnames";
import { getSectionTypeToSections } from "../state/slices/entitiesSlice";
import { DenormalizedCourse } from "../constants/commonTypes";
import { useAppDispatch, useAppSelector } from "../hooks";
import { addOrRemoveCourse, fetchCourseInfo } from "../actions";
import { hoverSearchResult } from "../state/slices/uiSlice";
import { getSchoolSpecificInfo } from "../constants/schools";

type SearchResultProps = {
  course: DenormalizedCourse;
  position: number;
};

const SearchResult = (props: SearchResultProps) => {
  const campuses: any = useAppSelector(
    (state) => getSchoolSpecificInfo(state.school.school).campuses
  );
  const dispatch = useAppDispatch();

  const [hoverAdd, setHoverAdd] = useState(false);

  const searchHover = useAppSelector((state) => state.ui.searchHover);
  const isHovered = (position: number) => searchHover === position;

  const courseSections = useAppSelector((state) => state.courseSections.objects);
  const inRoster = courseSections[props.course.id] !== undefined;

  const addCourseWrapper = (
    course: DenormalizedCourse,
    sec: string,
    event: MouseEvent
  ) => {
    event.stopPropagation(); // stops modal from popping up
    event.preventDefault(); // stops search bar from blurring (losing focus)
    dispatch(addOrRemoveCourse(course.id, sec));
  };

  /**
   * Checks if a course is Waitlist Only
   * Loops through each section type first (Lecture, Tutorial, Practical)
   * if any of the section types doesn't have open seats, the course is waitlist only
   * Within each section type, loops through each section
   * if section doesn't have meeting times, doesn't have enrolment cap
   * if section has open seats, don't check rest of sections in section type, move onto
   * next section type.
   * @returns {boolean}
   */
  const hasOnlyWaitlistedSections = () => {
    const sectionTypeToSections = getSectionTypeToSections(props.course);
    const sectionTypes = Object.keys(sectionTypeToSections);
    for (let i = 0; i < sectionTypes.length; i++) {
      const sectionType = sectionTypes[i];
      let sectionTypeHasOpenSections = false;
      const currSections = Object.keys(sectionTypeToSections[sectionType]);
      for (let j = 0; j < currSections.length; j++) {
        const section = currSections[j];
        if (sectionTypeToSections[sectionType][section].length > 0) {
          const currSection = sectionTypeToSections[sectionType][section][0];
          const hasEnrolmentData = currSection.enrolment >= 0;
          if (!hasEnrolmentData || currSection.enrolment < currSection.size) {
            sectionTypeHasOpenSections = true;
            break;
          }
        } else {
          return false;
        }
      }
      if (!sectionTypeHasOpenSections) {
        return true; // lecture, practical, or tutorial doesn't have open seats
      }
    }
    return false;
  };

  const { course } = props;
  const addRemoveButton = (
    <span
      title="Add this course"
      className={classNames("search-course-add", { "in-roster": inRoster })}
      onMouseDown={(event) => addCourseWrapper(course, "", event)}
      onMouseOver={() => setHoverAdd(true)}
      onMouseOut={() => setHoverAdd(false)}
    >
      <i className={classNames("fa", { "fa-plus": !inRoster, "fa-check": inRoster })} />
    </span>
  );

  let info = course.name ? course.code : "";
  if (hoverAdd) {
    info = !inRoster
      ? "Add this course to your timetable"
      : "Remove this course from your timetable";
  }
  const waitlistOnlyFlag = hasOnlyWaitlistedSections() ? (
    <h4 className="label flag">Waitlist Only</h4>
  ) : null;

  return (
    <li
      key={course.id}
      className={classNames("search-course", {
        hovered: isHovered(props.position),
      })}
      onMouseDown={() => dispatch(fetchCourseInfo(course.id))}
      onMouseOver={() => dispatch(hoverSearchResult(props.position))}
    >
      <h3>{course.name || course.code} </h3>
      {addRemoveButton}
      <div className="search-result-labels">
        <h4
          className={classNames("label", {
            hoverAdd,
          })}
        >
          {info}
        </h4>
        <h4 className={classNames("label", "bubble")}>{campuses[course.campus]}</h4>
        {waitlistOnlyFlag}
      </div>
    </li>
  );
};

type AreaBubbleProps = { areas: string[] };
export const AreaBubble = ({ areas }: AreaBubbleProps) =>
  areas.length > 0 ? (
    <div className="areas">
      {areas.map((area) => (
        <div className={`bubble ${area}`} key={area}>
          {area}
        </div>
      ))}
    </div>
  ) : null;

type WritingIntensiveProps = { isWritingIntensive: string };
export const WritingIntensive = ({ isWritingIntensive }: WritingIntensiveProps) =>
  isWritingIntensive === "Yes" ? (
    <div className="bubble writing">Writing Intensive</div>
  ) : null;

export default SearchResult;
