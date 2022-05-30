import React from "react";
import { useDispatch } from "react-redux";
import { fetchCourseInfo } from "../actions";
import COLOUR_DATA from "../constants/colours";
import { DenormalizedCourse, SlotColorData, Timetable } from "../constants/commonTypes";
import { getCourseShareLink } from "../constants/endpoints";
import { useAppSelector } from "../hooks";
import { getCoursesFromSlots, getCurrentSemester } from "../state";
import {
  selectGradient,
  stopComparingTimetables,
} from "../state/slices/compareTimetableSlice";
import AvgCourseRating from "./AvgCourseRating";
import CreditTicker from "./CreditTicker";
import MasterSlot from "./MasterSlot";
import { isOfferingInTimetable } from "./slotUtils";

const CompareTimetableSideBar = () => {
  const dispatch = useDispatch();
  const activeCourses = useAppSelector((state) =>
    getCoursesFromSlots(state, state.compareTimetable.activeTimetable.slots)
  );
  const comparedCourses = useAppSelector((state) =>
    getCoursesFromSlots(state, state.compareTimetable.comparedTimetable.slots)
  );
  const activeTimetable = useAppSelector(
    (state) => state.compareTimetable.activeTimetable
  );
  const comparedTimetable = useAppSelector(
    (state) => state.compareTimetable.comparedTimetable
  );

  const gradient = useAppSelector(selectGradient);

  const courseToClassmates = useAppSelector(
    (state) => state.classmates.courseToClassmates
  );
  const semester = useAppSelector(getCurrentSemester);

  const createMasterSlot = (
    course: DenormalizedCourse,
    colourIndex: number,
    colorData: SlotColorData[]
  ) => {
    const professors = course.sections.map((section) => section.instructors);
    return (
      <MasterSlot
        key={course.id}
        professors={professors}
        colourIndex={colourIndex}
        classmates={courseToClassmates[course.id]}
        course={course}
        fetchCourseInfo={() => dispatch(fetchCourseInfo(course.id))}
        getShareLink={(courseCode: string) => getCourseShareLink(courseCode, semester)}
        colorData={colorData}
        onTimetable
        hideCloseButton
      />
    );
  };

  /**
   * returns an array of course ids of the courses that have the same section in both timetables
   */
  const getSectionsInBothTimetables = () => {
    const courseIds: number[] = [];

    activeTimetable.slots.forEach((slot) => {
      slot.offerings.forEach((offeringId) => {
        if (isOfferingInTimetable(comparedTimetable, offeringId)) {
          courseIds.push(slot.course);
        }
      });
    });
    return courseIds;
  };
  const sectionsInBoth = getSectionsInBothTimetables();

  const commonCourses: DenormalizedCourse[] = [];
  activeCourses.forEach((course) => {
    if (sectionsInBoth.indexOf(course.id) !== -1) {
      // course is in both timetables
      commonCourses.push(course);
    }
  });
  const commonSlots = commonCourses.map((course) =>
    createMasterSlot(course, 2, COLOUR_DATA)
  );

  const activeSlots = activeCourses
    .filter((course) => sectionsInBoth.indexOf(course.id) === -1)
    .map((course, index) => createMasterSlot(course, index, gradient.active));
  const comparedSlots = comparedCourses
    .filter((course) => sectionsInBoth.indexOf(course.id) === -1)
    .map((course, index) => createMasterSlot(course, index, gradient.compared));

  return (
    <div className="side-bar-compare-timetable">
      <div className="slots-title-wrapper">
        <div className="title-wrapper">{activeTimetable.name}</div>
        <div className="title-wrapper">{comparedTimetable.name}</div>
      </div>
      <div className="slots-rating">
        <div className="col-1-3 text-center">
          <CreditTicker
            timetableCourses={activeCourses}
            events={activeTimetable.events}
          />
        </div>
        <div className="col-2-3">
          <AvgCourseRating avgRating={activeTimetable.avg_rating} />
        </div>
        <div className="col-1-3 text-center">
          <CreditTicker
            timetableCourses={comparedCourses}
            events={comparedTimetable.events}
          />
        </div>
        <div className="col-2-3">
          <AvgCourseRating avgRating={comparedTimetable.avg_rating} />
        </div>
      </div>
      <div className="slots-wrapper">
        <div className="horizontal-bar">{commonSlots}</div>
        <div className="slots-comparison">
          <div className="slots-list">{activeSlots}</div>
          <div className="slots-separator" />
          <div className="slots-list">{comparedSlots}</div>
        </div>
      </div>
      <div
        onClick={() => dispatch(stopComparingTimetables())}
        className="compare-timetable-exit"
      >
        Exit Compare Timetables
      </div>
    </div>
  );
};

export default CompareTimetableSideBar;
