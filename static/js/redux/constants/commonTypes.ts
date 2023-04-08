// This file stores typescript types used by both react and redux
export type ThemeName = "light" | "dark";

export type Day = "M" | "T" | "W" | "R" | "F";

export interface Semester {
  id: number;
  name: string;
  year: string;
}
/**
 * Centralizes theme related constants
 */
export interface Theme {
  name: ThemeName;
  slotColors: SlotColorData[];
  compareTtColors: CompareTimetableColors;
  customEventDefaultColor: string;
  reactSelectColors: {
    primary: string;
    primary25: string;
    neutral0: string;
    neutral20: string;
  };
}

export interface CompareTimetableColors {
  activeStart: string;
  activeEnd: string;
  comparedStart: string;
  comparedEnd: string;
  commonStart: string;
  commonEnd: string;
}

export type ThemeObject = {
  [x in ThemeName]?: Theme;
};

/**
 * Offering refers to a class period of a section of a course.
 * Example:
 *  Data Structures (Course) has 2 sections (Section) and in one of the sections,
 *    there's three days they meet (Offering).
 *  Offering 1: Monday 1:30pm - 2:45pm in Shaffer 273
 *  Offering 2: Wednesday 1:30pm - 2:45pm in Shaffer 273
 *  Offering 3: Friday 1:30pm - 2:45pm in Shaffer 273
 */
export interface Offering {
  id: number;
  day: Day;
  date_start: string;
  date_end: string;
  time_start: string;
  time_end: string;
  location: string;
  is_short_course: boolean;
  section: number;
}

export interface Section {
  course_section_id: number;
  meeting_section: string;
  size: number;
  enrolment: number;
  id: number;
  instructors: string;
  offering_set: Offering[];
  section_type: string;
  semester: Semester;
  waitlist: number;
  waitlist_size: number;
}

/**
 * Used in the entitiesSlice; offerings are ids instead of objects.
 */
export interface EntitySection extends Omit<Section, "offering_set"> {
  offering_set: number[];
}

/**
 * Slot stores section and offering information regarding a course (all ids)
 */
export interface Slot {
  course: number;
  section: number;
  offerings: number[];
  is_locked: boolean;
  is_section_filled?: boolean;
}

/**
 * SearchSlot is a slot that is created when dragging in empty space.
 */
export interface SearchSlot {
  day: Day;
  time_start: string;
  time_end: string;
}

/**
 * Event refers to a custom event created by user. There are some extra fields to
 * indicate whether the event is being created (preview).
 */
export interface Event {
  day: Day;
  name: string;
  location: string;
  color: string;
  time_start: string;
  time_end: string;
  credits: string;
  id: number;
  preview: boolean;
  custom?: boolean;
  key?: number;
}

/**
 * Timetable stores info of course slots and custom events.
 */
export interface Timetable {
  id: number;
  slots: Slot[];
  has_conflict: boolean;
  show_weekend: boolean;
  name: string;
  avg_rating: number;
  events: Event[];
}

/**
 * Course reactions (emojis)
 */
export interface Reaction {
  title: string;
  count: number;
  reacted: boolean;
}

export interface Course {
  code: string;
  name: string;
  id: number;
  description: string;
  department: string;
  num_credits: number;
  areas: string[];
  campus: number;
  evals: any;
  related_courses: Course[];
  reactions: Reaction[];
  regexed_courses: any;
  sections: number[];
  prerequisites: string;
  exclusions: string;
  corequisites: string;
  popularity_percent: number;
  is_waitlist_only: boolean;
  pos: string[];
  writing_intensive: string;
  sub_school: string;
  slots?: Slot[];
}

/**
 * RelatedCourse is a course that is related to the current course based on some
 * criteria. This is a feature that isn't currently maintained, but is still used in the
 * codebase.
 */
export interface RelatedCourse {
  code: string;
  name: string;
  id: number;
  description: string;
  department: string;
  num_credits: number;
  areas: string[];
  campus: number;
  evals: any;
  prerequisites: string;
  exclusions: string;
  corequisites: string;
}

export interface HoveredSlot {
  course: Course | DenormalizedCourse;
  section: Section;
  offerings: Offering[];
  is_locked: boolean;
}

/**
 * Denormalized means that the course object has the sections as objects instead of ids.
 * It's used in cases where we want to access information on the sections of the course
 * in addition to the course itself.
 */
export interface DenormalizedCourse extends Omit<Course, "sections"> {
  sections: Section[];
}

export interface TermOfServiceAgreement {
  timeUpdated: string;
  description: string;
  url: string;
}

export interface Peer {
  class_year: number;
  email_enabled: boolean;
  img_url: string;
  jhed: string;
  major: string;
  preferred_name: null | string;
  school: string;
  social_all: boolean;
  social_courses: boolean;
  social_offerings: boolean;
  time_accepted_tos: string;
}

export interface Classmate {
  first_name: string;
  last_name: string;
  img_url: string;
  sections: string[]; // section codes
}

export interface SlotColorData {
  background: string;
  highlight: string;
  border: string;
  font: string;
}
