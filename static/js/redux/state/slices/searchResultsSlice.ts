import { createSlice } from "@reduxjs/toolkit";
import { receiveSearchResults, requestCourses } from "../../actions/initActions";

interface SearchResultsSliceState {
  isFetching: boolean;
  items: number[]; // an array of course ids
  seqNumber: number;
}

const initialState: SearchResultsSliceState = {
  isFetching: false,
  items: [],
  // assign each search request a sequence number to avoid overwriting more recent results
  seqNumber: 0,
};

const searchResultsSlice = createSlice({
  name: "searchResults",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(receiveSearchResults, (state, action) => {
        state.isFetching = false;
        if (action.payload.page === 1) {
          state.items = action.payload.courses.result;
        } else {
          state.items = state.items.concat(action.payload.courses.result);
        }
      })
      .addCase(requestCourses, (state) => {
        state.isFetching = true;
        state.seqNumber++;
      });
  },
});

export const getSearchResultId = (state: SearchResultsSliceState, index: number) =>
  state.items[index];

export const getSearchResultIds = (state: SearchResultsSliceState) => state.items;

export default searchResultsSlice.reducer;
