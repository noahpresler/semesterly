import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { changeActiveSavedTimetable } from "../../actions";
import { Timetable } from "../../constants/commonTypes";

interface PreferencesSliceState {
  tryWithConflicts: boolean;
  showWeekend: boolean;
  isModalVisible: boolean;
}

const initialState: PreferencesSliceState = {
  tryWithConflicts: false,
  showWeekend: true,
  isModalVisible: false,
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    togglePreferenceModal: (state) => {
      state.isModalVisible = !state.isModalVisible;
    },
    toggleConflicts: (state) => {
      state.tryWithConflicts = !state.tryWithConflicts;
    },
    turnConflictsOn: (state) => {
      state.tryWithConflicts = true;
    },
    toggleShowWeekend: (state) => {
      state.showWeekend = !state.showWeekend;
    },
    setAllPreferences: (state, { payload }: PayloadAction<PreferencesSliceState>) => {
      state.tryWithConflicts = payload.tryWithConflicts;
      state.showWeekend = payload.showWeekend;
    },
  },
  extraReducers: (builder) => {
      builder.
        addCase(changeActiveSavedTimetable, (state, action: PayloadAction<{
        timetable: Timetable;
        upToDate: boolean;
      }>) => {
        state.tryWithConflicts = action.payload.timetable.has_conflict;
        state.showWeekend = action.payload.timetable.show_weekend;
      });
    }
});
export const preferencesActions = preferencesSlice.actions;

export default preferencesSlice.reducer;
