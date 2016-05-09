import { connect } from 'react-redux';
import { UserSettingsModal } from '../user_settings_modal.jsx';
import { saveSettings } from '../../actions/user_actions.jsx'

const mapStateToProps = (state) => {
	return {
		userInfo: state.userInfo.data
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveSettings: () => dispatch(saveSettings()),
		changeUserInfo: (info) => dispatch({
			type: "CHANGE_USER_INFO",
			data: info,
		}),
	}
}

const UserSettingsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(UserSettingsModal);

export default UserSettingsModalContainer;