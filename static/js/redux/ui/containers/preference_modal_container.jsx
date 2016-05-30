import { connect } from 'react-redux';
import { PreferenceModal } from '../preference_modal.jsx';

const mapStateToProps = (state) => {
  return {
    isVisible: state.preferenceModal.isVisible,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    togglePreferenceModal: () => dispatch({type: "TOGGLE_PREFERENCE_MODAL"}),
    toggleConflicts: () => dispatch({type: "TOGGLE_CONFLICTS"})
  }
}

const PreferenceModalContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PreferenceModal);

export default PreferenceModalContainer;
