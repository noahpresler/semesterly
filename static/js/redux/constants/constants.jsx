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

export const HALF_HOUR_HEIGHT = 25;
export const MAX_TIMETABLE_NAME_LENGTH = 30; // Length of "This is my fucking timetable!!"

export const DAYS = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];

export const FULL_WEEK_LIST = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];

export const VERBOSE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DRAG_TYPES = {
  DRAG: 'drag', // drag a custom slot to a new location
  EXTEND: 'extend', // extend the length of a custom slot
  CREATE: 'create', // create a new custom slot
};

// dictionary representing the order in which semesters occur
export const SEMESTER_RANKS = {
  Winter: 0,
  Spring: 1,
  Fall: 2,
};
