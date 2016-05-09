import { connect } from 'react-redux';
import { UserSettingsModal } from '../user_settings_modal.jsx';

const mapStateToProps = (state) => {
	return {
		userInfo: state.userInfo.data
	}
}

const UserSettingsModalContainer = connect(
	mapStateToProps
)(UserSettingsModal);

export default UserSettingsModalContainer;