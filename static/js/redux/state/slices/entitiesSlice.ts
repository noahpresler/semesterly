import { merge, uniq } from "lodash";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import {
  receiveAdvancedSearchResults,
  receiveCourses,
  receiveSearchResults,
  setCourseInfo,
  setCourseReactions,
} from "../../actions/initActions";
import {
  Course,
  Offering,
  Reaction,
  EntitySection,
  DenormalizedCourse,
  Slot,
  Timetable,
} from "../../constants/commonTypes";

/**
 * Stores complete information about courses, sections, and offerings, mapping their ids
 * to the actual (denormalized) data.
 */
interface EntitiesSliceState {
  offering_set: {
    [offeringId: number]: Offering;
  };
  sections: {
    [sectionId: number]: EntitySection;
  };
  courses: {
    [courseId: number]: Course;
  };
}
const initialState: EntitiesSliceState = {
  offering_set: {},
  sections: {},
  courses: {},
};

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        setCourseReactions,
        (
          state,
          action: PayloadAction<{
            id: number;
            reactions: Reaction[];
          }>
        ) => {
          state.courses[action.payload.id].reactions = action.payload.reactions;
        }
      )
      .addCase(receiveAdvancedSearchResults, (state, action) =>
        merge({}, state, action.payload.courses.entities)
      )
      .addCase(receiveSearchResults, (state, action) =>
        merge({}, state, action.payload.courses.entities)
      )
      .addMatcher(isAnyOf(setCourseInfo, receiveCourses), (state, action) =>
        merge({}, state, action.payload.entities)
      );
  },
});

// OFFERING SELECTORS
const getOfferingById = (state: EntitiesSliceState, id: number) =>
  state.offering_set[id];

// SECTION SELECTORS
const getSectionById = (state: EntitiesSliceState, id: number) => state.sections[id];

const getSlotsForSection = (state: EntitiesSliceState, section: EntitySection) =>
  section.offering_set.map((offering) => getOfferingById(state, offering));

// TODO use denormalize from normalizr
const getDenormSectionById = (state: EntitiesSliceState, id: number) => {
  const section = getSectionById(state, id);
  const offerings = getSlotsForSection(state, section);
  return { ...section, offering_set: offerings };
};

// COURSE SELECTORS
const getCourseById = (state: EntitiesSliceState, id: number) => state.courses[id];

const getDenormSectionsForCourse = (state: EntitiesSliceState, course: Course) =>
  course.sections.map((sectionId) => getDenormSectionById(state, sectionId));

// TODO use denormalize from normalizr
export const getDenormCourseById = (state: EntitiesSliceState, id: number) => {
  const course = getCourseById(state, id);
  const sections = getDenormSectionsForCourse(state, course);
  return { ...course, sections };
};

export const getSectionTypeToSections = (denormCourse: DenormalizedCourse) => {
  if (!denormCourse || !("sections" in denormCourse)) {
    // empty course (only happens on inital CourseInfo state)
    return {};
  }
  const sectionTypeToSections: any = {};
  denormCourse.sections.forEach((section) => {
    if (!(section.section_type in sectionTypeToSections)) {
      sectionTypeToSections[section.section_type] = [];
    }
    sectionTypeToSections[section.section_type].push(section);
  });
  return sectionTypeToSections;
};

// TIMETABLE SELECTORS
//    SLOT SELECTORS
export const getDenormSlot = (state: EntitiesSliceState, slot: Slot) => ({
  ...slot,
  course: getCourseById(state, slot.course),
  section: getSectionById(state, slot.section),
  offerings: slot.offerings.map((offering) => getOfferingById(state, offering)),
});

export const getCourseIdsFromSlots = (slots: Slot[]) =>
  uniq(slots.map((slot) => slot.course));

export const getCoursesFromSlots = (state: EntitiesSliceState, slots: Slot[]) =>
  getCourseIdsFromSlots(slots).map((cid) => getDenormCourseById(state, cid));

export const getDenormTimetable = (
  state: EntitiesSliceState,
  timetable: Timetable
) => ({
  ...timetable,
  slots: timetable.slots.map((slot) => getDenormSlot(state, slot)),
});

export const getTimetableCourses = (
  state: EntitiesSliceState,
  timetable: Timetable
) => {
  const courseIds = uniq(timetable.slots.map((slot) => slot.course));
  return courseIds.map((courseId) => getCourseById(state, courseId));
};

export const getTimetableDenormCourses = (
  state: EntitiesSliceState,
  timetable: Timetable
) => {
  const courseIds = uniq(timetable.slots.map((slot) => slot.course));
  return courseIds.map((courseId) => getDenormCourseById(state, courseId));
};

export const getFirstTTStartHour = (timetable: Timetable) => {
  let firstStartHour = 24;
  timetable.slots.forEach((slot) => {
    slot.offerings.forEach((offering: any) => {
      const startHour = parseInt(offering.time_start.split(":")[0], 10);
      firstStartHour = Math.min(firstStartHour, startHour);
    });
  });
  timetable.events.forEach((event) => {
    const startHour = parseInt(event.time_start.split(":")[0], 10);
    firstStartHour = Math.min(firstStartHour, startHour);
  });
  return firstStartHour;
};

export default entitiesSlice.reducer;
