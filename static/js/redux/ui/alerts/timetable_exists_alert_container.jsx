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
import TimetableExistsAlert from './timetable_exists_alert';
import * as ActionTypes from '../../constants/actionTypes';


const mapStateToProps = () => ({});
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => dispatch({ type: ActionTypes.DISMISS_TIMETABLE_EXISTS }),
});

const TimetableExistsAlertContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimetableExistsAlert);
export default TimetableExistsAlertContainer;
