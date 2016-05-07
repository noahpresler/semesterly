import { connect } from 'react-redux';
import { SocialProfile } from '../social_profile.jsx';

const mapStateToProps = (state) => {
	return {
		isLoggedIn: state.userInfo.isLoggedIn,
		userImg: state.userInfo.userImg,
		userFirstName: state.userInfo.userFirstName
	}
}


const SocialProfileContainer = connect(
	mapStateToProps
)(SocialProfile);

export default SocialProfileContainer;