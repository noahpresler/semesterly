import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface userAcquisitionModalState {
  isVisible: boolean;
}

const initialState: userAcquisitionModalState = {
  isVisible: false,
};

const userAcquisitionModalSlice = createSlice({
  name: 'userAcquisitionModal',
  initialState,
  reducers: {
    toggleAcquisitionModal: (state) => {
      state.isVisible = !state.isVisible;
    },
    triggerAcquisitionModal: (state) => {
      state.isVisible = true;
    },
  },
});

export const { toggleAcquisitionModal, triggerAcquisitionModal } =
  userAcquisitionModalSlice.actions;
export default userAcquisitionModalSlice.reducer;
