import { createSlice } from "@reduxjs/toolkit";

interface NewsModalState {
  isVisible: boolean;
}

const initialState: NewsModalState = {
  isVisible: false,
};

const newsModalSlice = createSlice({
  name: "newsModal",
  initialState,
  reducers: {
    hideNewsModal: (state) => {
      state.isVisible = false;
    },
    showNewsModal: (state) => {
      state.isVisible = true;
    },
  },
});

export const newsModalActions = newsModalSlice.actions;
export default newsModalSlice.reducer;
