import { connect } from 'react-redux';
import DayCalendar from '../day_calendar';
import { saveTimetable } from '../../actions/user_actions';
import { handleCreateNewTimetable } from '../../actions/timetable_actions';
import {
    addTTtoGCal,
    createICalFromTimetable,
    fetchShareTimetableLink,
} from '../../actions/calendar_actions';
import { togglePreferenceModal, triggerSaveCalendarModal } from '../../actions/modal_actions';
import { getMaxEndHour } from '../../reducers/root_reducer';

const mapStateToProps = (state) => {
  const { isFetchingShareLink, shareLink, shareLinkValid } = state.calendar;
  return {
    endHour: getMaxEndHour(state),
    saving: state.savingTimetable.saving,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    uses12HrTime: state.ui.uses12HrTime,
    isFetchingShareLink,
    shareLink,
    shareLinkValid,
    active: state.timetables.active,
  };
};

const DayCalendarContainer = connect(
    mapStateToProps,
  {
    // NOTE: uses this syntax to avoid onClick accidentally passing a callback
    saveTimetable: () => saveTimetable(),
    fetchShareTimetableLink,
    togglePreferenceModal,
    addTTtoGCal,
    triggerSaveCalendarModal,
    createICalFromTimetable,
    handleCreateNewTimetable,
  },
)(DayCalendar);

export default DayCalendarContainer;
