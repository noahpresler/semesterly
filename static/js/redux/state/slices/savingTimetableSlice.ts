import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import {
  alertTimeTableExists,
  changeActiveSavedTimetable,
  changeActiveTimetable,
  setShowWeekend,
} from "../../actions/initActions";
import { Timetable } from "../../constants/commonTypes";
import { emptyTimetable } from "./timetablesSlice";

interface SavingTimetableSliceState {
  activeTimetable: Timetable;
  saving: boolean;
  upToDate: boolean;
}

const initialState: SavingTimetableSliceState = {
  activeTimetable: emptyTimetable,
  saving: false, // true if we are currently waiting for a response from the backend
  upToDate: false,
};

/**
 * Stores information about the currently active timetable, and information on whether
 * it's being saved/up-to-date. It's relevant only for when the user is logged in.
 */
const savingTimetableSlice = createSlice({
  name: "savingTimetable",
  initialState,
  reducers: {
    requestSaveTimetable: (state) => {
      state.saving = !state.upToDate;
    },
    changeActiveSavedTimetableName: (state, action: PayloadAction<string>) => {
      state.activeTimetable.name = action.payload;
      state.upToDate = false;
    },
    setUpToDate: (state, action: PayloadAction<boolean>) => {
      state.upToDate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        changeActiveSavedTimetable,
        (
          state,
          action: PayloadAction<{
            timetable: Timetable;
            upToDate: boolean;
          }>
        ) => {
          state.activeTimetable = action.payload.timetable;
          state.saving = false;
          state.upToDate = action.payload.upToDate;
        }
      )
      .addCase(alertTimeTableExists, (state) => {
        state.saving = false;
      })
      .addCase(changeActiveTimetable, (state) => {
        state.upToDate = false;
      })
      .addCase(setShowWeekend, (state, action: PayloadAction<boolean>) => {
        state.activeTimetable.show_weekend = action.payload;
      });
  },
});

export const savingTimetableActions = savingTimetableSlice.actions;

export default savingTimetableSlice.reducer;
