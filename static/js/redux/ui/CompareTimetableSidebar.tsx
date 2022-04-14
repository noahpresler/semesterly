import React from "react";
import { useDispatch } from "react-redux";
import { fetchCourseInfo } from "../actions";
import { DenormalizedCourse } from "../constants/commonTypes";
import { getCourseShareLink } from "../constants/endpoints";
import { useAppSelector } from "../hooks";
import { getCoursesFromSlots, getCurrentSemester } from "../state";
import { stopComparingTimetables } from "../state/slices/compareTimetableSlice";
import MasterSlot from "./MasterSlot";

const CompareTimetableSideBar = () => {
  const dispatch = useDispatch();
  const activeCourses = useAppSelector((state) =>
    getCoursesFromSlots(state, state.compareTimetable.activeTimetable.slots)
  );
  const comparedCourses = useAppSelector((state) =>
    getCoursesFromSlots(state, state.compareTimetable.comparedTimetable.slots)
  );

  const courseToClassmates = useAppSelector(
    (state) => state.classmates.courseToClassmates
  );
  const semester = useAppSelector(getCurrentSemester);
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

  const activeSlots = activeCourses.map((course) => createMasterSlot(course, 0));
  const comparedSlots = comparedCourses.map((course) => createMasterSlot(course, 1));

  return (
    <div className="side-bar-compare-timetable">
      <p>New sidebar</p>
      <div className="slots-comparison">
        <div className="slots-list">{activeSlots}</div>
        <div className="slots-list">{comparedSlots}</div>
      </div>
      <div
        onClick={() => dispatch(stopComparingTimetables())}
        style={{ cursor: "pointer" }}
      >
        Exit Compare Timetables
      </div>
    </div>
  );
};

export default CompareTimetableSideBar;
