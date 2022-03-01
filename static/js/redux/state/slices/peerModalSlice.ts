import { createSlice } from "@reduxjs/toolkit";

interface PeerModalSliceState {
  isVisible: boolean;
  isLoading: boolean;
}

const initialState: PeerModalSliceState = {
  isVisible: false,
  isLoading: false,
};

const peerModalSlice = createSlice({
  name: "peerModal",
  initialState,
  reducers: {
    togglePeerModal: (state) => {
      state.isVisible = !state.isVisible;
    },
    peerModalLoading: (state) => {
      state.isLoading = true;
    },
    peerModalLoaded: (state) => {
      state.isLoading = false;
    },
  },
});

export const { togglePeerModal, peerModalLoading, peerModalLoaded } =
  peerModalSlice.actions;

export default peerModalSlice.reducer;
