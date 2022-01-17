import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { changeActiveTimetable, receiveTimetables } from "../../actions/initActions";

interface CalendarSliceState {
  shareLink: null | String;
  isFetchingShareLink: boolean;
  shareLinkValid: boolean;
}

const initialState: CalendarSliceState = {
  shareLink: null,
  isFetchingShareLink: false,
  shareLinkValid: false,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    requestShareTimetableLink: (state) => {
      state.isFetchingShareLink = true;
    },
    receiveShareTimetableLink: (state, action: PayloadAction<String>) => {
      state.shareLink = action.payload;
      state.isFetchingShareLink = false;
      state.shareLinkValid = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changeActiveTimetable, (state) => {
        state.shareLinkValid = false;
      })
      .addCase(receiveTimetables, (state) => {
        state.shareLinkValid = false;
      });
  },
});

export const calendarActions = calendarSlice.actions;
export default calendarSlice.reducer;
