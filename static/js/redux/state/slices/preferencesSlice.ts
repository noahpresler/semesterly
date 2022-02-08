import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchMetrics } from "../../constants/commonTypes";

interface PreferencesSliceState {
  try_with_conflicts: boolean;
  isModalVisible: boolean;
  sort_metrics: { metric: SearchMetrics; selected: boolean; order: "least" | "most" }[];
}

const initialState: PreferencesSliceState = {
  try_with_conflicts: false,
  isModalVisible: false,
  sort_metrics: [
    // {metric: 'sections with friends', selected: false, order: 'most'},
    { metric: "days with class", selected: false, order: "least" },
    { metric: "number of conflicts", selected: false, order: "least" },
    { metric: "time on campus", selected: false, order: "least" },
    { metric: "course rating stars", selected: false, order: "most" },
  ],
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
      state.sort_metrics = payload.sort_metrics;
    },
    addMetric: (state, { payload }: PayloadAction<SearchMetrics>) => {
      const addIndex = state.sort_metrics.findIndex((m) => m.metric === payload);
      if (addIndex === -1) return;

      const added = { ...state.sort_metrics[addIndex], selected: true };
      const addedMetrics = [
        ...state.sort_metrics.slice(0, addIndex),
        ...state.sort_metrics.slice(addIndex + 1),
        added,
      ];
      state.sort_metrics = addedMetrics;
    },
    removeMetric: (state, { payload }: PayloadAction<SearchMetrics>) => {
      const delIndex = state.sort_metrics.findIndex((m) => m.metric === payload);
      if (delIndex === -1) return;

      const removed = { ...state.sort_metrics[delIndex], selected: false };
      const removedMetrics = [
        removed,
        ...state.sort_metrics.slice(0, delIndex),
        ...state.sort_metrics.slice(delIndex + 1),
      ];
      state.sort_metrics = removedMetrics;
    },
    switchMetric: (
      state,
      {
        payload,
      }: PayloadAction<{
        add: SearchMetrics;
        del: SearchMetrics;
      }>
    ) => {
      const del = state.sort_metrics.findIndex((m) => m.metric === payload.del);
      const add = state.sort_metrics.findIndex((m) => m.metric === payload.add);
      if (add === -1 || del === -1) return;
      const addObj = { ...state.sort_metrics[add], selected: true };
      const delObj = { ...state.sort_metrics[del], selected: false };
      state.sort_metrics[del] = addObj;
      state.sort_metrics[add] = delObj;
    },
    toggleMetricOrder: (state, { payload }: PayloadAction<SearchMetrics>) => {
      const orderIndex = state.sort_metrics.findIndex((m) => m.metric === payload);
      if (orderIndex === -1) return;

      const nextOrder =
        state.sort_metrics[orderIndex].order === "least" ? "most" : "least";
      const reversed = {
        ...state.sort_metrics[orderIndex],
        order: nextOrder as "least" | "most",
      };
      const toggledMetrics = [
        ...state.sort_metrics.slice(0, orderIndex),
        reversed,
        ...state.sort_metrics.slice(orderIndex + 1),
      ];
      state.sort_metrics = toggledMetrics;
    },
  },
});
export const preferencesActions = preferencesSlice.actions;

export default preferencesSlice.reducer;
