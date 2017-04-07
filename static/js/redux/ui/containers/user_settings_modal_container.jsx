import {connect} from "react-redux";
import {UserSettingsModal} from "../user_settings_modal.jsx";
import {saveSettings} from "../../actions/user_actions.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    return {
        userInfo: state.userInfo.data,
        showOverrided: state.userInfo.overrideShow,
        tokenRegistered: state.notificationToken.hasToken
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        saveSettings: () => dispatch(saveSettings()),
        changeUserInfo: (info) => dispatch({
            type: ActionTypes.CHANGE_USER_INFO,
            data: info,
        }),
        closeUserSettings: () => dispatch({
            type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
            data: false,
        })
    }
}

const UserSettingsModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(UserSettingsModal);

export default UserSettingsModalContainer;