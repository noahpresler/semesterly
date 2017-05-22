import { connect } from 'react-redux';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import Semesterly from '../semesterly';
import { saveTimetable } from '../../actions/user_actions';
import { setActiveTimetable } from '../../actions/timetable_actions';

const mapStateToProps = (state) => {
  const timetables = state.timetables.items;
  const active = state.timetables.active;
  const activeTTLength = timetables[active].courses.length;
  return {
    alertConflict: state.alerts.alertConflict,
    alertEnableNotifications: state.alerts.alertEnableNotifications,
    alertTimetableExists: state.alerts.alertTimetableExists,
    alertChangeSemester: state.alerts.alertChangeSemester,
    alertNewTimetable: state.alerts.alertNewTimetable,
    alertFacebookFriends: state.alerts.alertFacebookFriends
        && state.userInfo.data.FacebookSignedUp
        && (!state.userInfo.data.social_courses || state.alerts.facebookAlertIsOn)
        && !state.userInfo.overrideShow
        && state.alerts.mostFriendsCount >= 2
        && activeTTLength >= 1,
    explorationModalIsVisible: state.explorationModal.isVisible,
    dataLastUpdated: state.school.dataLastUpdated,
    PgCount: state.timetables.items.length,
    PgActive: state.timetables.active,
  };
};

const SemesterlyContainer = connect(
    mapStateToProps,
  {
    saveTimetable,
    setPgActive: setActiveTimetable,
  },
)(Semesterly);

export default DragDropContext(HTML5Backend)(SemesterlyContainer);
