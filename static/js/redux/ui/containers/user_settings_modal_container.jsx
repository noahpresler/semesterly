import {connect} from "react-redux";
import {UserSettingsModal} from "../user_settings_modal.jsx";
import {saveSettings} from "../../actions/user_actions.jsx";
import {changeUserInfo, overrideSettingsShow} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    return {
        userInfo: state.userInfo.data,
        showOverrided: state.userInfo.overrideShow,
        tokenRegistered: state.notificationToken.hasToken
    }
}

const UserSettingsModalContainer = connect(
    mapStateToProps,
    {
        saveSettings,
        closeUserSettings: () => overrideSettingsShow(false),
        changeUserInfo
    }
)(UserSettingsModal);

export default UserSettingsModalContainer;