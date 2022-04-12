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
    toggleCompareTimetableSideBar: (
      state,
      action: PayloadAction<{
        activeTimetable: Timetable;
        comparedTimetable: Timetable;
      }>
    ) => {
      state.isComparing = !state.isComparing;
      state.activeTimetable = action.payload.activeTimetable;
      state.comparedTimetable = action.payload.comparedTimetable;
    },
  },
});

export const { toggleCompareTimetableSideBar } = compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
