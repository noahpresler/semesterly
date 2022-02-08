import { createSlice } from "@reduxjs/toolkit";

interface TermsOfServiceBannerSliceState {
  isVisible: boolean;
}

const initialState: TermsOfServiceBannerSliceState = {
  isVisible: false,
};

const termsOfServiceBannerSlice = createSlice({
  name: "termsOfServiceBanner",
  initialState,
  reducers: {
    triggerTermsOfServiceBanner: (state) => {
      state.isVisible = true;
    },
    dismissTermsOfServiceBanner: (state) => {
      state.isVisible = false;
    },
  },
});

export const { triggerTermsOfServiceBanner, dismissTermsOfServiceBanner } =
  termsOfServiceBannerSlice.actions;

export default termsOfServiceBannerSlice.reducer;
