import React from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks";
import { toggleCompareTimetableSideBar } from "../state/slices/compareTimetableSlice";

const CompareTimetableSideBar = () => {
  const dispatch = useDispatch();
  const isCompareTimetableSideBarVisible = useAppSelector(
    (state) => state.compareTimetable.showCompareTimetableSideBar
  );

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
