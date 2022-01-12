import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCourseReactions, setCourseInfo } from "../../actions/initActions";
import { Reaction } from "../../constants/commonTypes";

interface CourseInfoSliceState {
  isFetching: boolean;
  isFetchingClassmates: boolean;
  data: {
    reactions?: Reaction[];
  };
  id: null | Number;
  classmates: any; // TODO: change type
}

const initialState: CourseInfoSliceState = {
  isFetching: true,
  isFetchingClassmates: true,
  data: {},
  id: null,
  classmates: {},
};

const courseInfoSlice = createSlice({
  name: "courseInfo",
  initialState,
  reducers: {
    // TODO: change any type
    courseClassmatesReceived: (state, action: PayloadAction<any>) => {
      state.isFetchingClassmates = false;
      state.classmates = action.payload;
    },
    requestCourseInfo: () => initialState,
    setCourseId: (state, action: PayloadAction<Number>) => {
      state.id = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setCourseInfo, (state, action) => {
        state.isFetching = false;
        state.id = action.payload.result;
      })
      .addCase(
        setCourseReactions,
        (
          state,
          action: PayloadAction<{
            id: Number;
            reactions: Reaction[];
          }>
        ) => {
          // populate course reaction emojis
          if (state.id !== null) {
            state.data.reactions = action.payload.reactions;
          }
        }
      );
  },
});

export const getCourseInfoId = (state: any) => state.courseInfo.id;

export const courseInfoActions = courseInfoSlice.actions;
export default courseInfoSlice.reducer;
