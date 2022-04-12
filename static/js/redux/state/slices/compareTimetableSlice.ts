import { createSlice } from "@reduxjs/toolkit";

interface CompareTimetableSliceState {
  showCompareTimetableSideBar: boolean;
}

const initialState: CompareTimetableSliceState = {
  showCompareTimetableSideBar: false,
};

const compareTimetableSlice = createSlice({
  name: "compareTimetable",
  initialState,
  reducers: {
    toggleCompareTimetableSideBar: (state) => {
      state.showCompareTimetableSideBar = !state.showCompareTimetableSideBar;
    },
  },
});

export const { toggleCompareTimetableSideBar } = compareTimetableSlice.actions;
export default compareTimetableSlice.reducer;
