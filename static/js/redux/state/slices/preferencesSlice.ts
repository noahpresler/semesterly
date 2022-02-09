import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchMetrics } from "../../constants/commonTypes";

interface PreferencesSliceState {
  try_with_conflicts: boolean;
  isModalVisible: boolean;
}

const initialState: PreferencesSliceState = {
  try_with_conflicts: false,
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
      state.try_with_conflicts = !state.try_with_conflicts;
    },
    turnConflictsOn: (state) => {
      state.try_with_conflicts = true;
    },
    setAllPreferences: (state, { payload }: PayloadAction<PreferencesSliceState>) => {
      state.try_with_conflicts = payload.try_with_conflicts;
    },
  },
});
export const preferencesActions = preferencesSlice.actions;

export default preferencesSlice.reducer;
