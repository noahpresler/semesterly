import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchMetrics } from "../../constants/commonTypes";

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
});
export const preferencesActions = preferencesSlice.actions;

export default preferencesSlice.reducer;
