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
