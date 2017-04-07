import {connect} from "react-redux";
import {PreferenceModal} from "../preference_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";
import {togglePreferenceModal} from "../../actions/modal_actions.jsx";
import {toggleConflicts} from "../../actions/timetable_actions.jsx";


const mapStateToProps = (state) => {
    return {
        isVisible: state.preferenceModal.isVisible,
        withConflicts: state.preferences.try_with_conflicts
    }
}


const PreferenceModalContainer = connect(
    mapStateToProps,
    {
        togglePreferenceModal,
        toggleConflicts,
        applyPreferences: togglePreferenceModal
    }
)(PreferenceModal);

export default PreferenceModalContainer;
