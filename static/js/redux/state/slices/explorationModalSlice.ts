/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  receiveSchoolInfo,
  receiveAdvancedSearchResults,
} from "../../actions/initActions";

interface AdvancedSearchModalSliceState {
  isVisible: boolean;
  advancedSearchResults: number[];
  isFetching: boolean;
  active: number;
  schoolInfoLoaded: boolean;
}

const initialState: AdvancedSearchModalSliceState = {
  isVisible: false,
  advancedSearchResults: [],
  isFetching: false,
  active: 0,
  schoolInfoLoaded: false,
};

const advancedSearchModalSlice = createSlice({
  name: "advancedSearchModal",
  initialState,
  reducers: {
    showAdvancedSearchModal: (state) => {
      state.isVisible = true;
    },
    hideAdvancedSearchModal: (state) => {
      state.isVisible = false;
    },
    requestAdvancedSearchResults: (state) => {
      state.isFetching = true;
    },
    setActiveAdvancedSearchResult: (state, action: PayloadAction<number>) => {
      state.active = action.payload;
    },
    requestSchoolInfo: (state) => {
      state.schoolInfoLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(receiveAdvancedSearchResults, (state, action) => {
        if (action.payload.page === 1) {
          state.advancedSearchResults = action.payload.courses.result;
          state.active = 0;
        } else {
          state.advancedSearchResults.push(...action.payload.courses.result);
        }
        state.isFetching = false;
      })
      .addCase(receiveSchoolInfo, (state) => {
        state.schoolInfoLoaded = true;
      });
  },
});

export const getAdvancedSearchResultIds = (state: AdvancedSearchModalSliceState) =>
  state.advancedSearchResults;

export const advancedSearchModalActions = advancedSearchModalSlice.actions;

export default advancedSearchModalSlice.reducer;
