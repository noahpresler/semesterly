import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ClassmateSliceState {
  courseToClassmates: any;  // map<course_ids: string, object>
  isFetching: boolean;
}

const initialState: ClassmateSliceState = {
  courseToClassmates: {},
  isFetching: false,
};

const classmatesSlice = createSlice({
  name: "classmates",
  initialState: initialState,
  reducers: {
    classmatesReceived: (state, action) => {
      state.courseToClassmates = action.payload;
      state.isFetching = false;
    },
    requestClassmates: (state) => {
      state.isFetching = true;
    },
  },
});

export const classmatesActions = classmatesSlice.actions;
export default classmatesSlice.reducer;
