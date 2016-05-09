import { connect } from 'react-redux';
import { SocialProfile } from '../social_profile.jsx';

const mapStateToProps = (state) => {
	return {
		userInfo: state.userInfo.data
	}
}

const SocialProfileContainer = connect(
	mapStateToProps
)(SocialProfile);

export default SocialProfileContainer;
