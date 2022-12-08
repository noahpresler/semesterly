import { setTheme } from "./../../actions/initActions";
import {
  SlotColorData,
  Timetable,
  Theme,
  ThemeName,
  CompareTimetableColors,
} from "./../../constants/commonTypes";
import { RootState } from "..";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
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
      updateGradients(state, colors, action.payload.theme.name);
    },
    stopComparingTimetables: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(setTheme, (state, action) => {
      if (state.isComparing) {
        // update slot color when theme changes while comparing
        const colors = action.payload.compareTtColors;
        updateGradients(state, colors, action.payload.name);
      }
    });
  },
});

function updateGradients(
  state: Draft<Draft<CompareTimetableSliceState>>,
  colors: CompareTimetableColors,
  curTheme: ThemeName
) {
  const numCommon = getSectionsInTwoTimetables(
    state.activeTimetable,
    state.comparedTimetable
  ).length;
  const activeGradient = buildGradient(
    colors.activeStart,
    colors.activeEnd,
    calcGradientRange(state.activeTimetable.slots.length - numCommon),
    curTheme
  );
  const comparedGradient = buildGradient(
    colors.comparedStart,
    colors.comparedEnd,
    calcGradientRange(state.comparedTimetable.slots.length - numCommon),
    curTheme
  );
  const commonGradient = buildGradient(
    colors.commonStart,
    colors.commonEnd,
    calcGradientRange(numCommon),
    curTheme
  );
  state.gradient.active = activeGradient;
  state.gradient.compared = comparedGradient;
  state.gradient.common = commonGradient;
}

export const selectGradient = (state: RootState) => state.compareTimetable.gradient;
export const { startComparingTimetables, stopComparingTimetables } =
  compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
