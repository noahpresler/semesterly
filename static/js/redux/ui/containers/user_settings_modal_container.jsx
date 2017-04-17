import {connect} from "react-redux";
import {UserSettingsModal} from "../user_settings_modal";
import {saveSettings} from "../../actions/user_actions";
import {changeUserInfo, overrideSettingsShow} from "../../actions/modal_actions";

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