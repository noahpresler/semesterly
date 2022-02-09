import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAllState } from "../../actions/initActions";

interface RegistrarSliceState {
  supported: boolean;
}

const initialState: RegistrarSliceState = {
  supported: false,
};

export default createSlice({
  name: "registrar",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initAllState, (state, action: PayloadAction<any>) => {
      state.supported = action.payload.registrar;
    });
  },
}).reducer;
