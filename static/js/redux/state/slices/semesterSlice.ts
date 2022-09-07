import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAllState } from "../../actions/initActions";

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
  reducers: {
    updateSemester: (state, action: PayloadAction<number>) => {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initAllState, (state, action: PayloadAction<any>) => {
      state.current = parseInt(action.payload.currentSemester, 10);
      state.all = action.payload.allSemesters;
    });
  },
});
export const getCurrentSemester = (state: SemesterSliceState) =>
  state.all[state.current];

export const semesterActions = semesterSlice.actions;
export default semesterSlice.reducer;
