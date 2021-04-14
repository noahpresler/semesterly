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
import TextInput from '../text_input';
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
const TextInputContainer = connect(
  mapStateToProps,
  {
    openSignUpModal,
    changeTimetableName,
  },
)(TextInput);

export default TextInputContainer;
