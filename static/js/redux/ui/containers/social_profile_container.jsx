import {connect} from "react-redux";
import {SocialProfile} from "../social_profile.jsx";
import {overrideSettingsShow, triggerAcquisitionModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    return {
        userInfo: state.userInfo.data
    }
}

const SocialProfileContainer = connect(
    mapStateToProps,
    {
        showUserSettings: () => overrideSettingsShow(true),
        triggerAcquisitionModal
    }
)(SocialProfile);

export default SocialProfileContainer;
