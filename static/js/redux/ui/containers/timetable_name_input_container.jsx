import { connect } from 'react-redux';
import TimetableNameInput from '../timetable_name_input';
import { openSignUpModal } from '../../actions/modal_actions';
import { changeTimetableName } from '../../actions/user_actions';


const mapStateToProps = (state) => {
  const savingTimetable = state.savingTimetable;
  return {
    // the name of the user's "being-edited" saved timetable
    activeLoadedTimetableName: savingTimetable.activeTimetable.name,
    saving: savingTimetable.saving,
    upToDate: savingTimetable.upToDate,
    isLoggedIn: state.userInfo.data.isLoggedIn,
  };
};
const TimetableNameInputContainer = connect(
    mapStateToProps,
  {
    openSignUpModal,
    changeTimetableName,
  },
)(TimetableNameInput);

export default TimetableNameInputContainer;
