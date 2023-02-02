import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import store from "../index";
import {
  requestCourses,
  initAllState,
  receiveTimetables,
} from "../../actions/initActions";
import { Timetable } from "../../constants/commonTypes";
import { getNextAvailableColour } from "../../util";
import { getCourseIdsFromSlots } from "./entitiesSlice";

interface UiSliceState {
  searchHover: number;
  courseToColourIndex: any; // { courseId: index }
  uses12HrTime: boolean;
}

const initialState: UiSliceState = {
  searchHover: 0,
  courseToColourIndex: {},
  uses12HrTime: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    hoverSearchResult: (state, action: PayloadAction<number>) => {
      state.searchHover = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAllState, (state, action: PayloadAction<any>) => {
        state.uses12HrTime = action.payload.uses12HrTime;
      })
      .addCase(receiveTimetables, (state, action: PayloadAction<Timetable[]>) => {
        const courses =
          action.payload.length > 0
            ? getCourseIdsFromSlots(action.payload[0].slots)
            : [];

        const courseToColourIndex: any = {};

        courses.forEach((courseId: number) => {
          // if this course already had a colour, use that. Otherwise get a new one
          courseToColourIndex[courseId] =
            courseId in state.courseToColourIndex
              ? state.courseToColourIndex[courseId]
              : getNextAvailableColour(courseToColourIndex);
        });
        state.courseToColourIndex = courseToColourIndex;
      })
      .addCase(requestCourses, (state) => {
        state.searchHover = 0;
      });
  },
});

export const { hoverSearchResult } = uiSlice.actions;

export default uiSlice.reducer;
