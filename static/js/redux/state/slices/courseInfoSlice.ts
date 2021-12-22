import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCourseReactions } from "../../actions/initActions";
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
}

const courseInfoSlice = createSlice({
  name: 'courseInfo',
  initialState,
  reducers: {
    courseInfoReceived: (state, action: PayloadAction<Number>) => {
      state.isFetching = false;
      state.id = action.payload;
    },
    // TODO: change any type
    courseClassmatesReceived: (state, action: PayloadAction<any>) => {
      state.isFetchingClassmates = false;
      state.classmates = action.payload;
    },
    requestCourseInfo: () => {
      // reset the state
      return initialState;
    },
    setCourseId: (state, action: PayloadAction<Number>) => {
      state.id = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(setCourseReactions, (state, action: PayloadAction<{
        id: Number;
        reactions: Reaction[]
      }>) => {
        // populate course reaction emojis
        if (state.id !== null) {
          state.data.reactions = action.payload.reactions;
        }
      })
  }
})

export const getCourseInfoId = (state:any) => {
  return state.courseInfo.id
};

export const courseInfoActions = courseInfoSlice.actions;
export default courseInfoSlice.reducer;