import { connect } from 'react-redux';
import ConflictAlert from './conflict_alert';
import { addLastAddedCourse } from '../../actions/timetable_actions';
import * as ActionTypes from '../../constants/actionTypes';


const mapStateToProps = state => ({});
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => {
    dispatch({ type: ActionTypes.DISMISS_ALERT_CONFLICT });
    dispatch(addLastAddedCourse());
  },
  turnConflictsOn: () => dispatch({ type: ActionTypes.TOGGLE_CONFLICTS }),
});

const ConflictAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ConflictAlert);
export default ConflictAlertContainer;
