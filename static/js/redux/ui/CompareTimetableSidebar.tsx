import React from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks";
import { toggleCompareTimetableSideBar } from "../state/slices/compareTimetableSlice";

const CompareTimetableSideBar = () => {
  const dispatch = useDispatch();
  const activeTimetable = useAppSelector(
    (state) => state.compareTimetable.activeTimetable
  );
  const comparedTimetable = useAppSelector(
    (state) => state.compareTimetable.comparedTimetable
  );

  console.log("Active: ", activeTimetable);
  console.log("Compared: ", comparedTimetable);

  return (
    <div>
      <p>New sidebar</p>
      <div
        onClick={() => dispatch(toggleCompareTimetableSideBar())}
        style={{ cursor: "pointer" }}
      >
        Exit Compare Timetables
      </div>
    </div>
  );
};

export default CompareTimetableSideBar;
