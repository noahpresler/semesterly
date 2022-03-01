import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IntegrationModalSliceState {
  integrations: any[];
  isVisible: boolean;
  id: number | null;
  enabled: boolean;
  integration_id: number | null;
  studentIntegrations: any[];
}

const initialState: IntegrationModalSliceState = {
  integrations: [],
  isVisible: false,
  id: null,
  enabled: false,
  integration_id: null,
  studentIntegrations: [],
};

const integrationModalSlice = createSlice({
  name: "integrationModal",
  initialState,
  reducers: {
    toggleIntegrationModal: (state, action: PayloadAction<number>) => {
      state.isVisible = !state.isVisible;
      state.id = action.payload;
    },
    initIntegrationModal: (
      state,
      action: PayloadAction<{
        enabled: boolean;
        id: number;
        integration_id: number;
      }>
    ) => {
      state.enabled = action.payload.enabled;
      state.isVisible = true;
      state.id = action.payload.id;
      state.integration_id = action.payload.integration_id;
    },
  },
});

export const { toggleIntegrationModal, initIntegrationModal } =
  integrationModalSlice.actions;

export default integrationModalSlice.reducer;
