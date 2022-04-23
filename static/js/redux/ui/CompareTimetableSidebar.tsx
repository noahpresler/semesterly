import React from "react";
import { useDispatch } from "react-redux";
import { fetchCourseInfo } from "../actions";
import { DenormalizedCourse, Timetable } from "../constants/commonTypes";
import { getCourseShareLink } from "../constants/endpoints";
import { useAppSelector } from "../hooks";
import { getCoursesFromSlots, getCurrentSemester } from "../state";
import { stopComparingTimetables } from "../state/slices/compareTimetableSlice";
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

  const courseToClassmates = useAppSelector(
    (state) => state.classmates.courseToClassmates
  );
  const semester = useAppSelector(getCurrentSemester);
  const events = useAppSelector((state) => state.customEvents.events);

  const createMasterSlot = (course: DenormalizedCourse, colourIndex: number) => {
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

  const activeSlots = activeCourses.map((course) => {
    const colorIndex = sectionsInBoth.indexOf(course.id) === -1 ? 0 : 2;

    return createMasterSlot(course, colorIndex);
  });
  const comparedSlots = comparedCourses.map((course) => {
    const colorIndex = sectionsInBoth.indexOf(course.id) === -1 ? 1 : 2;
    return createMasterSlot(course, colorIndex);
  });

  return (
    <div className="side-bar-compare-timetable">
      <p>New sidebar</p>
      <div className="slots-credits">
        <div className="credit-wrapper">
          <CreditTicker timetableCourses={activeCourses} events={events} />
        </div>
        <div className="credit-wrapper">
          <CreditTicker timetableCourses={activeCourses} events={events} />
        </div>
      </div>
      <div className="slots-rating">
        <div className="c-rating-wrapper">
          <div className="c-rating-inner">
            <AvgCourseRating avgRating={activeTimetable.avg_rating} />
          </div>
        </div>
        <div className="c-rating-wrapper">
          <div className="c-rating-inner">
            <AvgCourseRating avgRating={comparedTimetable.avg_rating} />
          </div>
        </div>
      </div>
      <div className="slots-comparison">
        <div className="slots-list">{activeSlots}</div>
        <div className="slots-separator" />
        <div className="slots-list">{comparedSlots}</div>
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
