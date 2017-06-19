import { connect } from 'react-redux';
import DayCalendar from '../day_calendar';
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
    uses12HrTime: state.ui.uses12HrTime,
    hasTimetables,
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
