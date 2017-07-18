import { connect } from 'react-redux';
import Calendar from '../calendar';
import { saveTimetable } from '../../actions/user_actions';
import { handleCreateNewTimetable } from '../../actions/timetable_actions';
import {
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
    createICalFromTimetable,
    handleCreateNewTimetable,
  },
)(Calendar);

export default CalendarContainer;
