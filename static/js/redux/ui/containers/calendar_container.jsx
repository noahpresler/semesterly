import { connect } from 'react-redux';
import Calendar from '../calendar';
import { saveTimetable } from '../../actions/user_actions';
import { handleCreateNewTimetable } from '../../actions/timetable_actions';
import {
    addTTtoGCal,
    createICalFromTimetable,
    fetchShareTimetableLink,
} from '../../actions/calendar_actions';
import { togglePreferenceModal, triggerSaveCalendarModal } from '../../actions/modal_actions';

const getMaxHourBasedOnWindowHeight = () => {
  const calRow = $('.cal-row');
  const lastRowY = calRow.last().position();
  if (!lastRowY) {
    return 0;
  }
  const lastHour = 7 + (calRow.length / 2);
  const hourHeight = calRow.height() * 2;
  const maxHour = parseInt(((lastHour + ($(document).height()
    - 250 - lastRowY.top)) / hourHeight), 10);
  if (maxHour < lastHour) {
    return lastHour;
  }
  return Math.min(24, parseInt(maxHour, 10));
};
/*
 gets the end hour of the current timetable, based on the class that ends latest
 */
const getMaxEndHour = (timetable, hasCourses) => {
  let maxEndHour = 17;
  if (!hasCourses) {
    return maxEndHour;
  }
  getMaxHourBasedOnWindowHeight();
  const courses = timetable.courses;
  for (let courseIndex = 0; courseIndex < courses.length; courseIndex++) {
    const course = courses[courseIndex];
    for (let slotIndex = 0; slotIndex < course.slots.length; slotIndex++) {
      const slot = course.slots[slotIndex];
      const endHour = parseInt(slot.time_end.split(':')[0], 10);
      maxEndHour = Math.max(maxEndHour, endHour);
    }
  }
  return Math.max(maxEndHour, getMaxHourBasedOnWindowHeight());
};
const mapStateToProps = (state) => {
  const timetables = state.timetables.items;
  const active = state.timetables.active;
  const hasTimetables = timetables[active].courses.length > 0;
  const { isFetchingShareLink, shareLink, shareLinkValid } = state.calendar;
  return {
    endHour: getMaxEndHour(timetables[active], hasTimetables),
    saving: state.savingTimetable.saving,
    dataLastUpdated: state.school.dataLastUpdated,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasTimetables,
    isFetchingShareLink,
    shareLink,
    shareLinkValid,
    active,
    uses12HrTime: state.ui.uses12HrTime,
  };
};

const CalendarContainer = connect(
    mapStateToProps,
  {
    saveTimetable,
    fetchShareTimetableLink,
    togglePreferenceModal,
    triggerSaveCalendarModal,
    addTTtoGCal,
    createICalFromTimetable,
    handleCreateNewTimetable,
  },
)(Calendar);

export default CalendarContainer;
