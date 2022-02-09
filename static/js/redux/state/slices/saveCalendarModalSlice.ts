import { createSlice } from "@reduxjs/toolkit";

interface SaveCalendarModalSliceState {
  isVisible: boolean;
  hasDownloaded: boolean;
  hasUploaded: boolean;
  isDownloading: boolean;
  isUploading: boolean;
}

const initialState: SaveCalendarModalSliceState = {
  isVisible: false,
  hasDownloaded: false,
  hasUploaded: true,
  isDownloading: false,
  isUploading: true,
};

const saveCalendarModalSlice = createSlice({
  name: "saveCalendarModal",
  initialState,
  reducers: {
    toggleSaveCalendarModal: (state) => {
      state.isVisible = !state.isVisible;
    },
    triggerSaveCalendarModal: () => ({
      isVisible: true,
      hasUploaded: false,
      hasDownloaded: false,
      isDownloading: false,
      isUploading: false,
    }),
    downloadCalendar: (state) => {
      state.isDownloading = true;
    },
    uploadCalendar: (state) => {
      state.isUploading = true;
    },
    calendarDownloaded: (state) => {
      state.hasDownloaded = true;
    },
    calendarUploaded: (state) => {
      state.hasUploaded = true;
    },
  },
});

export const saveCalendarModalActions = saveCalendarModalSlice.actions;

export default saveCalendarModalSlice.reducer;
