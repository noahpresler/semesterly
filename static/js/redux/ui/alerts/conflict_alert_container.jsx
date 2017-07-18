import { connect } from 'react-redux';
import ConflictAlert from './conflict_alert';
import { addLastAddedCourse } from '../../actions/timetable_actions';
import * as ActionTypes from '../../constants/actionTypes';

const mapStateToProps = state => ({
  message: (typeof state.timetables.lastSlotAdded === 'string') ? 'course' : 'event',
});

const mapDispatchToProps = dispatch => ({
  dismissSelf: () => dispatch({ type: ActionTypes.DISMISS_ALERT_CONFLICT }),
  turnConflictsOn: () => dispatch({ type: ActionTypes.TOGGLE_CONFLICTS }),
  addLastAddedCourse: () => dispatch(addLastAddedCourse()),
});

const ConflictAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ConflictAlert);
export default ConflictAlertContainer;
