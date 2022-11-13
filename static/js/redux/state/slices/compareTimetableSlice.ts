import { SlotColorData, Timetable, Theme } from "./../../constants/commonTypes";
import { RootState } from "..";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getSectionsInTwoTimetables } from "../../ui/slotUtils";
import { buildGradient, calcGradientRange } from "../../ui/gradientUtils";

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
        theme: Theme;
      }>
    ) => {
      state.isComparing = true;
      state.activeTimetable = action.payload.activeTimetable;
      state.comparedTimetable = action.payload.comparedTimetable;
      const colors = action.payload.theme.compareTtColors;
      const numCommon = getSectionsInTwoTimetables(
        state.activeTimetable,
        state.comparedTimetable
      ).length;
      const activeGradient = buildGradient(
        colors.activeStart,
        colors.activeEnd,
        calcGradientRange(state.activeTimetable.slots.length - numCommon)
      );
      const comparedGradient = buildGradient(
        colors.comparedStart,
        colors.comparedEnd,
        calcGradientRange(state.comparedTimetable.slots.length - numCommon)
      );
      const commonGradient = buildGradient(
        colors.commonStart,
        colors.commonEnd,
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
