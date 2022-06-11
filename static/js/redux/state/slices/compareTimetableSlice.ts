import { calcGradientRange } from "./../../gradientUtils";
import { SlotColorData, Timetable } from "./../../constants/commonTypes";
import { RootState } from "..";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { buildGradient } from "../../util";
import { getSectionsInTwoTimetables } from "../../ui/slotUtils";

interface CompareTimetableSliceState {
  isComparing: boolean;
  activeTimetable: Timetable | null;
  comparedTimetable: Timetable | null;
  gradient: {
    active: SlotColorData[];
    compared: SlotColorData[];
    common: SlotColorData[];
  };
}

const initialState: CompareTimetableSliceState = {
  isComparing: false,
  activeTimetable: null,
  comparedTimetable: null,
  gradient: {
    active: [],
    compared: [],
    common: [],
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
      const numCommon = getSectionsInTwoTimetables(
        state.activeTimetable,
        state.comparedTimetable
      ).length;
      const activeGradient = buildGradient(
        "#fd7473",
        "#f4cece",
        calcGradientRange(state.activeTimetable.slots.length - numCommon)
      );
      const comparedGradient = buildGradient(
        "#5cccf2",
        "#c2e6f2",
        calcGradientRange(state.comparedTimetable.slots.length - numCommon)
      );
      const commonGradient = buildGradient(
        "#36debb",
        "#d9f6f0",
        calcGradientRange(numCommon)
      );

      state.gradient.active = activeGradient;
      state.gradient.compared = comparedGradient;
      state.gradient.common = commonGradient;
    },
    stopComparingTimetables: (state) => initialState,
  },
});

export const selectGradient = (state: RootState) => state.compareTimetable.gradient;
export const { startComparingTimetables, stopComparingTimetables } =
  compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
