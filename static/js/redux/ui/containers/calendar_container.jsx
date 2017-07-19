/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

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
import { getMaxEndHour } from '../../util';

const mapStateToProps = (state) => {
  const timetables = state.timetables.items;
  const active = state.timetables.active;
  const hasTimetables = timetables[active].courses.length > 0;
  const { isFetchingShareLink, shareLink, shareLinkValid } = state.calendar;
  return {
    endHour: getMaxEndHour(timetables[active], hasTimetables),
    saving: state.savingTimetable.saving,
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
