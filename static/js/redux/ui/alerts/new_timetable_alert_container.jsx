import { connect } from 'react-redux';
import { createNewTimetable } from '../../actions/timetable_actions';
import NewTimetableAlert from './new_timetable_alert';
import * as ActionTypes from '../../constants/actionTypes';


const mapStateToProps = () => {
  const msg = "You haven't saved this timetable! Still want to start a new one?";
  return {
    msg,
  };
};
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => dispatch({ type: ActionTypes.DISMISS_ALERT_NEW_TIMETABLE }),
  createNewTimetable,
});

const NewTimetableAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(NewTimetableAlert);

export default NewTimetableAlertContainer;
