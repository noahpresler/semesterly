import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAllState } from "../../actions/initActions";
import { TermOfServiceAgreement } from "../../constants/commonTypes";

interface TermsOfServiceModalSliceState {
  isVisible: boolean;
  latestAgreement: TermOfServiceAgreement;
}

const initialState: TermsOfServiceModalSliceState = {
  isVisible: false,
  latestAgreement: null,
};

const termsOfServiceModalSlice = createSlice({
  name: "termsOfServiceModal",
  initialState,
  reducers: {
    triggerTermsOfServiceModal: (state) => {
      state.isVisible = true;
    },
    closeTermsOfServiceModal: (state) => {
      state.isVisible = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initAllState, (state, action: PayloadAction<any>) => {
      state.latestAgreement = action.payload.latestAgreement;
    });
  },
});

export const { triggerTermsOfServiceModal, closeTermsOfServiceModal } =
  termsOfServiceModalSlice.actions;

export default termsOfServiceModalSlice.reducer;
