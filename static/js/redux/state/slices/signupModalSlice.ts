import { createSlice } from "@reduxjs/toolkit";

interface signupModalState {
  isVisible: boolean;
}

const initialState: signupModalState = {
  isVisible: false,
};

const signupModalSlice = createSlice({
  name: "signupModal",
  initialState,
  reducers: {
    toggleSignupModal: (state) => {
      state.isVisible = !state.isVisible;
    },
    triggerSignupModal: (state) => {
      state.isVisible = true;
    },
  },
});

export const signupModalActions = signupModalSlice.actions;
export default signupModalSlice.reducer;
