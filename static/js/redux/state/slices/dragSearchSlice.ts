import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchSlot } from "./../../constants/commonTypes";

export interface DragSearchSliceState {
  slot: SearchSlot | null;
}

const initialState: DragSearchSliceState = {
  slot: null,
};

export const dragSearchSlice = createSlice({
  name: "dragSearch",
  initialState,
  reducers: {
    setDragSearchSlot: (state, action: PayloadAction<SearchSlot>) => {
      state.slot = action.payload;
    },
  },
});

export const { setDragSearchSlot } = dragSearchSlice.actions;

export default dragSearchSlice.reducer;
