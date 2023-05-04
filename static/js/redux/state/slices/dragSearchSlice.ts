import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchSlot } from "./../../constants/commonTypes";

export interface DragSearchSliceState {
  slot: SearchSlot | null;
  slotFinalized: boolean;
}

const initialState: DragSearchSliceState = {
  slot: null,
  slotFinalized: false,
};

export const dragSearchSlice = createSlice({
  name: "dragSearch",
  initialState,
  reducers: {
    setDragSearchSlot: (state, action: PayloadAction<SearchSlot>) => {
      state.slot = action.payload;
    },
    updateDragSearchSlot: (
      state,
      action: PayloadAction<{
        time_start: string;
        time_end: string;
      }>
    ) => {
      if (state.slot) {
        state.slot.time_start = action.payload.time_start;
        state.slot.time_end = action.payload.time_end;
      }
    },
    clearDragSearchSlot: (state) => {
      state.slot = null;
      state.slotFinalized = false;
    },
    finalizeDragSearchSlot: (state) => {
      state.slotFinalized = true;
    },
  },
});

export const {
  setDragSearchSlot,
  updateDragSearchSlot,
  clearDragSearchSlot,
  finalizeDragSearchSlot,
} = dragSearchSlice.actions;

export default dragSearchSlice.reducer;
