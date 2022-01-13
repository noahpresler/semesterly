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
    hideSignupModal: (state) => {
      state.isVisible = false;
    },
    showSignupModal: (state) => {
      state.isVisible = true;
    },
  },
});

export const signupModalActions = signupModalSlice.actions;
export default signupModalSlice.reducer;
