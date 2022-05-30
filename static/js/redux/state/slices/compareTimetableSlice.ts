import { SlotColorData } from "./../../constants/commonTypes";
import { RootState } from "..";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Timetable } from "../../constants/commonTypes";
import { buildGradient } from "../../util";

interface CompareTimetableSliceState {
  isComparing: boolean;
  activeTimetable: Timetable | null;
  comparedTimetable: Timetable | null;
  gradient: {
    active: SlotColorData[];
    compared: SlotColorData[];
  };
}

const initialState: CompareTimetableSliceState = {
  isComparing: false,
  activeTimetable: null,
  comparedTimetable: null,
  gradient: {
    active: [],
    compared: [],
  },
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
      const activeGradient = buildGradient(
        "#33bfff",
        "#2c387e",
        action.payload.activeTimetable.slots.length
      );
      const comparedGradient = buildGradient(
        "#33bfff",
        "#2c387e",
        action.payload.comparedTimetable.slots.length
      );
      state.gradient.active = activeGradient;
      state.gradient.compared = comparedGradient;
    },
    stopComparingTimetables: (state) => initialState,
  },
});

export const selectGradient = (state: RootState) => state.compareTimetable.gradient;
export const { startComparingTimetables, stopComparingTimetables } =
  compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
