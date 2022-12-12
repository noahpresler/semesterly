import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  alertConflict,
  receiveCourses,
  receiveTimetables,
  changeActiveTimetable,
} from "../../actions/initActions";
import {
  Course,
  DenormalizedCourse,
  HoveredSlot,
  Section,
  Timetable,
} from "../../constants/commonTypes";
import { saveLocalActiveIndex } from "../../util";

interface TimetablesSliceState {
  isFetching: boolean;
  items: Timetable[];
  hovered: HoveredSlot | null;
  active: number;
  loadingCachedTT: boolean;
  lastCourseAdded: { courseId: number; section: string } | null;
  // either int (course id), object (custom slots state), or null
}

const emptyTimetable: Timetable = {
  slots: [],
  has_conflict: false,
  show_weekend: false,
  id: null,
  avg_rating: 0,
  events: [],
  name: "",
};

const initialState: TimetablesSliceState = {
  isFetching: false,
  items: [emptyTimetable],
  hovered: null,
  active: 0,
  loadingCachedTT: true,
  lastCourseAdded: null, // either int (course id), object (custom slots state), or null
};

const timetablesSlice = createSlice({
  name: "timetables",
  initialState,
  reducers: {
    loadingCachedTimetable: (state) => {
      state.loadingCachedTT = true;
    },
    cachedTimetableLoaded: (state) => {
      state.loadingCachedTT = false;
    },
    hoverSection: (
      state,
      action: PayloadAction<{
        course: Course | DenormalizedCourse;
        section: Section;
      }>
    ) => {
      state.hovered = {
        course: action.payload.course,
        section: action.payload.section,
        offerings: action.payload.section.offering_set,
        is_locked: true,
        is_optional: false,
      };
    },
    unhoverSection: (state) => {
      state.hovered = null;
    },
    updateLastCourseAdded: (
      state,
      action: PayloadAction<{ courseId: number; section: string }>
    ) => {
      state.lastCourseAdded = action.payload;
    },
    setIsFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(receiveCourses, (state) => {
        state.isFetching = false;
      })
      .addCase(receiveTimetables, (state, action: PayloadAction<Timetable[]>) => {
        // if the array of timetables is empty, set state.items to an array with one empty timetable
        const actionTimetables =
          action.payload.length > 0 ? action.payload : [emptyTimetable];
        state.isFetching = false;
        state.hovered = null;
        state.active = 0;
        state.items = actionTimetables;
      })
      .addCase(changeActiveTimetable, (state, action) => {
        saveLocalActiveIndex(action.payload);
        state.active = action.payload;
      })
      .addCase(alertConflict, (state) => {
        state.isFetching = false;
      });
  },
});
export const getTimetables = (state: TimetablesSliceState) => state.items;

export const getActiveTimetable = (state: TimetablesSliceState) =>
  state.items[state.active];

export const getHoveredSlots = (state: TimetablesSliceState) => state.hovered;

export const timetablesActions = timetablesSlice.actions;
export default timetablesSlice.reducer;
