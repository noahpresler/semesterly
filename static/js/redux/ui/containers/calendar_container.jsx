import { connect } from 'react-redux';
import Calendar from '../calendar';
import { getActiveTT } from '../../reducers/root_reducer';
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
  const activeTT = getActiveTT(state);
  const hasTimetables = activeTT.courses.length > 0;
  const { isFetchingShareLink, shareLink, shareLinkValid } = state.calendar;
  return {
    endHour: getMaxEndHour(activeTT, hasTimetables),
    saving: state.savingTimetable.saving,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasTimetables,
    isFetchingShareLink,
    shareLink,
    shareLinkValid,
    active: state.timetables.active,
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
