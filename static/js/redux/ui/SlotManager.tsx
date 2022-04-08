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
import {
  index as IntervalTree,
  matches01 as getIntersections,
  // @ts-ignore
} from "static-interval-tree";
import Slot from "./Slot";
import CustomSlot from "./CustomSlot";
import { getNextAvailableColour, slotToDisplayOffering } from "../util";
import { convertToMinutes } from "./slotUtils";
import { HoveredSlot } from "../constants/commonTypes";
import { useAppDispatch, useAppSelector } from "../hooks";
import { getActiveDenormTimetable, getHoveredSlots } from "../state";
import { getSchoolSpecificInfo } from "../constants/schools";
import { getDenormCourseById } from "../state/slices/entitiesSlice";
import {
  addCustomSlot,
  addOrRemoveCourse,
  addOrRemoveOptionalCourse,
  updateCustomSlot,
  finalizeCustomSlot,
} from "../actions/timetable_actions";
import { fetchCourseInfo } from "../actions/modal_actions";

function getConflictStyles(slotsByDay: any) {
  const styledSlotsByDay = slotsByDay;
  Object.keys(styledSlotsByDay).forEach((day) => {
    const daySlots = styledSlotsByDay[day];
    // sort by start time
    daySlots.sort(
      (a: any, b: any) =>
        convertToMinutes(a.time_start) - convertToMinutes(b.time_start)
    );

    // build interval tree corresponding to entire slot
    const intervals = daySlots.map((slot: any, index: number) => ({
      start: convertToMinutes(slot.time_start),
      end: convertToMinutes(slot.time_end),
      id: index, // use day_slot index to map back to the slot object
    }));
    // build interval tree with part of slot that should not be overlayed (first hour)
    const infoIntervals = intervals.map((s: any) => ({
      start: s.start,
      end: Math.min(s.start + 59, s.end),
      id: s.id,
    }));
    const infoSlots = IntervalTree(infoIntervals);

    // bit map to store if slot has already been processed
    const seen = daySlots.map(() => false);

    // bit map to store if slot has already been added to queue
    const added = daySlots.map(() => false);

    // get num_conflicts
    for (let i = 0; i < infoIntervals.length; i++) {
      if (!seen[i]) {
        // if not seen, perform dfs search on conflicts
        const directConflicts = [];
        const frontier = [infoIntervals[i]];
        while (frontier.length > 0) {
          const next = frontier.pop();
          seen[next.id] = true;
          added[next.id] = true;
          directConflicts.push(next);
          const neighbors = getIntersections(infoSlots, next);
          for (let k = 0; k < neighbors.length; k++) {
            if (!seen[neighbors[k].id] && !added[neighbors[k].id]) {
              frontier.push(neighbors[k]);
              added[neighbors[k].id] = true;
            }
          }
        }
        directConflicts.sort(
          (a, b) =>
            intervals[b.id].end -
            intervals[b.id].start -
            (intervals[a.id].end - intervals[a.id].start)
        );
        for (let j = 0; j < directConflicts.length; j++) {
          const slotId = directConflicts[j].id;
          daySlots[slotId].num_conflicts = directConflicts.length;
          daySlots[slotId].shift_index = j;
        }
      }
    }

    // get shift index
    // build interval tree with part of slot that should not be overlayed
    const overSlots = IntervalTree(
      intervals
        .filter((s: any) => s.end - s.start > 60)
        .map((s: any) => ({
          start: s.start + 60,
          end: s.end,
          id: s.id,
        }))
    );
    // get depth_level
    for (let i = 0; i < infoIntervals.length; i++) {
      const conflicts = getIntersections(overSlots, infoIntervals[i]);
      conflicts.sort((a: any, b: any) => b.start - a.start);
      daySlots[i].depth_level =
        conflicts.length > 0 ? daySlots[conflicts[0].id].depth_level + 1 : 0;
    }

    // get exists_conflict
    const completeSlots = IntervalTree(intervals);
    for (let i = 0; i < intervals.length; i++) {
      daySlots[i].exists_conflict =
        getIntersections(completeSlots, intervals[i]).length > 1;
    }

    styledSlotsByDay[day] = daySlots;
  });
  return styledSlotsByDay;
}

const SlotManager = (props: { days: string[] }) => {
  const hoveredSlot: HoveredSlot = useAppSelector((state) => getHoveredSlots(state));
  // don't show slot if an alternative is being hovered
  const slots = useAppSelector((state) =>
    getActiveDenormTimetable(state).slots.filter(
      (slot) =>
        hoveredSlot?.course.id !== slot.course.id ||
        hoveredSlot?.section.section_type !== slot.section.section_type
    )
  );
  const courseToColourIndex = useAppSelector((state) => state.ui.courseToColourIndex);
  const customEvents = useAppSelector((state) => state.customEvents.events);

  const getSlotsByDay = () => {
    const slotsByDay: any = {
      M: [],
      T: [],
      W: [],
      R: [],
      F: [],
      S: [],
      U: [],
    };

    slots.forEach((slot) => {
      const { course, section, offerings } = slot;
      // ignore offerings that occur on weekends or have invalid days
      offerings
        .filter((offering) => offering.day in slotsByDay)
        .forEach((offering) => {
          const colourId = courseToColourIndex[course.id];
          slotsByDay[offering.day].push(
            slotToDisplayOffering(course, section, offering, colourId)
          );
        });
    });

    if (hoveredSlot !== null) {
      const { course, section, offerings } = hoveredSlot;
      offerings
        .filter((offering) => offering.day in slotsByDay)
        .forEach((offering) => {
          const colourId =
            course.id in courseToColourIndex
              ? courseToColourIndex[course.id]
              : getNextAvailableColour(courseToColourIndex);
          slotsByDay[offering.day].push(
            slotToDisplayOffering(course, section, offering, colourId)
          );
        });
    }

    for (let i = 0; i < customEvents.length; i++) {
      const customSlot = Object.assign({}, customEvents[i]);
      customSlot.custom = true;
      customSlot.key = customSlot.id;
      slotsByDay[customSlot.day].push(customSlot);
    }
    return getConflictStyles(slotsByDay);
  };

  const slotsByDay = getSlotsByDay();

  const courseSections = useAppSelector((state) => state.courseSections);
  const isLocked = (courseId: number, section: number) => {
    // check the courseSections state variable, which tells us
    // precisely which courses have which sections locked, if any
    const typeToLocked = courseSections.objects[courseId];
    return (
      typeToLocked !== undefined &&
      Object.keys(typeToLocked).some(
        (sectionType) => section === typeToLocked[sectionType]
      )
    );
  };

  const socialSections = useAppSelector(
    (state) => state.userInfo.data.social_offerings
  );
  const primaryDisplayAttribute = useAppSelector(
    (state) => getSchoolSpecificInfo(state.school.school).primaryDisplay
  );

  const optionalCourses = useAppSelector((state) => state.optionalCourses.courses);
  const isCourseOptional = (courseId: number) =>
    optionalCourses.some((c) => c === courseId);
  const entities = useAppSelector((state) => state.entities);
  const getOptionalCourseById = (courseId: number) =>
    getDenormCourseById(entities, courseId);

  const courseToClassmates = useAppSelector(
    (state) => state.classmates.courseToClassmates
  );
  const getClassmatesInSection = (courseId: number, sectionCode: string) => {
    if (!(courseId in courseToClassmates)) {
      return [];
    }
    const classmatesInCourse = courseToClassmates[courseId];
    return classmatesInCourse.current.filter((cm: any) =>
      cm.sections.find((s: string) => s === sectionCode)
    );
  };

  const uses12HrTime = useAppSelector((state) => state.ui.uses12HrTime);

  const dispatch = useAppDispatch();
  const allSlots = props.days.map((day, i) => {
    const daySlots = slotsByDay[day].map((slot: any, j: number) => {
      const courseId = slot.courseId;
      const locked = isLocked(courseId, slot.meeting_section);
      const isOptional = isCourseOptional(courseId);
      const optionalCourse = isOptional ? getOptionalCourseById(courseId) : null;
      return slot.custom ? (
        <CustomSlot
          {...slot}
          key={`${i.toString() + j.toString()} custom`}
          uses12HrTime={uses12HrTime}
        />
      ) : (
        <Slot
          {...slot}
          fetchCourseInfo={() => dispatch(fetchCourseInfo(courseId))}
          key={slot.id + i.toString() + j.toString()}
          locked={locked}
          classmates={
            socialSections ? getClassmatesInSection(courseId, slot.meeting_section) : []
          }
          lockOrUnlockSection={() =>
            dispatch(addOrRemoveCourse(courseId, slot.meeting_section))
          }
          removeCourse={() => {
            if (!isOptional) {
              return dispatch(addOrRemoveCourse(courseId));
            }
            return dispatch(addOrRemoveOptionalCourse(optionalCourse));
          }}
          primaryDisplayAttribute={primaryDisplayAttribute}
          updateCustomSlot={updateCustomSlot}
          addCustomSlot={addCustomSlot}
          finalizeCustomSlot={finalizeCustomSlot}
          uses12HrTime={uses12HrTime}
        />
      );
    });
    return (
      <td key={day}>
        <div className="fc-content-col">{daySlots}</div>
      </td>
    );
  });

  return (
    <table>
      <tbody>
        <tr>
          <td className="fc-axis" style={{ width: 49 }} />
          {allSlots}
        </tr>
      </tbody>
    </table>
  );
};

export default SlotManager;
