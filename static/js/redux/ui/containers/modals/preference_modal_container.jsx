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

import { connect } from "react-redux";
import PreferenceModal from "../../modals/preference_modal";
import { togglePreferenceModal } from "../../../actions/modal_actions";
import { toggleConflicts } from "../../../actions/timetable_actions";

const mapStateToProps = (state) => ({
  isVisible: state.preferenceModal.isVisible,
  withConflicts: state.preferences.try_with_conflicts,
});

const PreferenceModalContainer = connect(mapStateToProps, {
  togglePreferenceModal,
  toggleConflicts,
  applyPreferences: togglePreferenceModal,
})(PreferenceModal);

export default PreferenceModalContainer;
