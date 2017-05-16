import { connect } from 'react-redux';
import { setSemester } from '../../actions/search_actions';
import ChangeSemesterAlert from './change_semester_alert';
import * as ActionTypes from '../../constants/actionTypes';


const mapStateToProps = (state) => {
  const msg = 'Switching semesters will clear your current timetable!';
  return {
    desiredSemester: state.alerts.desiredSemester,
    msg,
  };
};
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => dispatch({ type: ActionTypes.DISMISS_ALERT_CHANGE_SEMESTER }),
  setSemester: semester => dispatch(setSemester(semester)),
});

const ChangeSemesterAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ChangeSemesterAlert);
export default ChangeSemesterAlertContainer;
