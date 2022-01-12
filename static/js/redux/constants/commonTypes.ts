// This file stores typescript types used by both react and redux

export type Day = "M" | "T" | "W" | "R" | "F";

export interface Semester {
  id: number;
  name: string;
  year: number;
}

/**
 * Offering refers to a class period of a section of a course
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

/**
 * Secion contains multiple offerings
 */
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
 * Slot stores section and offering information regarding a course
 */
export interface Slot {
  course: number;
  section: number;
  offerings: number[];
  is_optional: boolean;
  is_locked: boolean;
}

/**
 * Event refers to a custom event created by user
 */
export interface Event {
  name: string;
  day: Day;
  time_start: string;
  time_end: string;
  id: number;
  preview: boolean;
  exists_conflict?: boolean;
}

/**
 * Timetable stores info of course slots and custom events
 */
export interface Timetable {
  id: number;
  slots: Slot[];
  has_conflict: boolean;
  name: string;
  avg_rating: number;
  events: Event[];
}

/**
 * Course reactions
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
  num_credits: string;
  areas: string[];
  campus: string;
  evals: any;
  integrations: any;
  related_courses: Course[];
  reactions: Reaction[];
  regexed_courses: any;
  sections: number[];
  prerequisites: string;
  exclusions: string;
  corequisites: string;
  is_waitlist_only: boolean;
  pos: string[];
  writing_intensive: string;
  sub_school: string;
}
