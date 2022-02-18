import without from "lodash/without";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OptionalCoursesSlice {
  courses: number[];
  numRequired: number;
}

const initialState: OptionalCoursesSlice = {
  courses: [],
  numRequired: 0,
};

const optionalCoursesSlice = createSlice({
  name: "optionalCourses",
  initialState,
  reducers: {
    addRemoveOptionalCourse: (state, action: PayloadAction<number>) => {
      if (state.courses.find((c) => c === action.payload)) {
        state.courses = without(state.courses, action.payload);
        state.numRequired -= 1;
      } else {
        state.courses.push(action.payload);
        state.numRequired += 1;
      }
    },
    removeOptionalCourseById: (state, action: PayloadAction<number>) => {
      state.courses = without(state.courses, action.payload);
      state.numRequired -= 1;
    },
    clearOptionalCourses: (state) => {
      state.courses = [];
      state.numRequired = 0;
    },
  },
});

export const {
  addRemoveOptionalCourse,
  removeOptionalCourseById,
  clearOptionalCourses,
} = optionalCoursesSlice.actions;

export default optionalCoursesSlice.reducer;
