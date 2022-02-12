import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAllState, updateSemester } from "../../actions/initActions";

interface SemesterSliceState {
  current: number;
  all: { name: string; year: string }[];
}

const initialState: SemesterSliceState = {
  current: -1, // semester.current indexes into semester.all
  all: [], // semester.all is a list of {name, year} objects
};

const semesterSlice = createSlice({
  name: "semester",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initAllState, (state, action: PayloadAction<any>) => {
        state.current = parseInt(action.payload.currentSemester, 10);
        state.all = action.payload.allSemesters;
      })
      .addCase(updateSemester, (state, action: PayloadAction<number>) => {
        state.current = action.payload;
      });
  },
});
export const getCurrentSemester = (state: SemesterSliceState) =>
  state.all[state.current];

export default semesterSlice.reducer;
