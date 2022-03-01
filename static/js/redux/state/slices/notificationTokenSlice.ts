import { createSlice } from "@reduxjs/toolkit";

interface NotifcationTokenSliceState {
  hasToken: boolean;
}

const initialState: NotifcationTokenSliceState = {
  hasToken: false,
};

const notificationTokenSlice = createSlice({
  name: "notificationToken",
  initialState,
  reducers: {
    registerToken: (state) => {
      state.hasToken = true;
    },
    unregisterToken: (state) => {
      state.hasToken = false;
    },
  },
});

export const { registerToken, unregisterToken } = notificationTokenSlice.actions;

export default notificationTokenSlice.reducer;
