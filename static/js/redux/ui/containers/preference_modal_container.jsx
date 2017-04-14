import {connect} from "react-redux";
import {PreferenceModal} from "../preference_modal";
import {togglePreferenceModal} from "../../actions/modal_actions";
import {toggleConflicts} from "../../actions/timetable_actions";


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
