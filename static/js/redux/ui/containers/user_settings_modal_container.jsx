import { connect } from 'react-redux';
import { UserSettingsModal } from '../user_settings_modal.jsx';
import { saveSettings } from '../../actions/user_actions.jsx'

const mapStateToProps = (state) => {
	return {
		userInfo: state.userInfo.data,
		showOverrided: state.userInfo.overrideShow
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveSettings: () => dispatch(saveSettings()),
		changeUserInfo: (info) => dispatch({
			type: "CHANGE_USER_INFO",
			data: info,
		}),
		closeUserSettings: () => dispatch({
			type: "OVERRIDE_SETTINGS_SHOW",
			data: false,
		})
	}
}

const UserSettingsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(UserSettingsModal);

export default UserSettingsModalContainer;