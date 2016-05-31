import { connect } from 'react-redux';
import { PreferenceModal } from '../preference_modal.jsx';
import { fetchStateTimetables } from '../../actions/timetable_actions.jsx'

const mapStateToProps = (state) => {
  return {
    isVisible: state.preferenceModal.isVisible,
    withConflicts: state.preferences.try_with_conflicts
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    togglePreferenceModal: () => dispatch({type: "TOGGLE_PREFERENCE_MODAL"}),
    toggleConflicts: () => dispatch({type: "TOGGLE_CONFLICTS"}),
    applyPreferences: () => {
      dispatch({type: "TOGGLE_PREFERENCE_MODAL"})
      // fetchStateTimetables()
    }
  }
}

const PreferenceModalContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PreferenceModal);

export default PreferenceModalContainer;
