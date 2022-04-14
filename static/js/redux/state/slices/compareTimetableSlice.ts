import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Timetable } from "../../constants/commonTypes";

interface CompareTimetableSliceState {
  isComparing: boolean;
  activeTimetable: Timetable | null;
  comparedTimetable: Timetable | null;
}

const initialState: CompareTimetableSliceState = {
  isComparing: false,
  activeTimetable: null,
  comparedTimetable: null,
};

const compareTimetableSlice = createSlice({
  name: "compareTimetable",
  initialState,
  reducers: {
    startComparingTimetables: (
      state,
      action: PayloadAction<{
        activeTimetable: Timetable;
        comparedTimetable: Timetable;
      }>
    ) => {
      state.isComparing = true;
      state.activeTimetable = action.payload.activeTimetable;
      state.comparedTimetable = action.payload.comparedTimetable;
    },
    stopComparingTimetables: (state) => {
      state.isComparing = false;
      state.activeTimetable = null;
      state.comparedTimetable = null;
    },
  },
});

export const { startComparingTimetables, stopComparingTimetables } =
  compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
