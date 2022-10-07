import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { changeActiveSavedTimetable } from "../../actions/initActions";
import { Timetable } from "../../constants/commonTypes";
import { getTimetablePreferencesEndpoint } from "../../constants/endpoints";
import Cookie from "js-cookie";

interface PreferencesSliceState {
  tryWithConflicts: boolean;
  showWeekend: boolean;
}

const initialState: PreferencesSliceState = {
  tryWithConflicts: false,
  showWeekend: true,
};

export const savePreferences =
  () => (_dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const activeTimetable = state.savingTimetable.activeTimetable;
    const preferences = state.preferences;
    fetch(getTimetablePreferencesEndpoint(activeTimetable.id), {
      headers: {
        "X-CSRFToken": Cookie.get("csrftoken"),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        has_conflict: preferences.tryWithConflicts,
        show_weekend: preferences.showWeekend,
      }),
      credentials: "include",
    });
  };

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
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
    builder.addCase(
      changeActiveSavedTimetable,
      (
        state,
        action: PayloadAction<{
          timetable: Timetable;
          upToDate: boolean;
        }>
      ) => {
        state.tryWithConflicts = action.payload.timetable.has_conflict;
        state.showWeekend = action.payload.timetable.show_weekend;
      }
    );
  },
});
export const preferencesActions = { ...preferencesSlice.actions, savePreferences };

export default preferencesSlice.reducer;
