/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

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
