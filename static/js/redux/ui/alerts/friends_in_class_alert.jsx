import React from 'react';
import { setARegistrationToken } from '../../actions/user_actions.jsx';
import MasterSlot from '../master_slot.jsx';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';

class FriendsInClassAlert extends React.Component {
	constructor(props) {
		super(props);
	}
	componentWillUnmount() {
		if (!(localStorage.getItem("declinedNotifications") === "true" || localStorage.getItem("declinedNotifications") === "false")) {
			let date = new Date;
			setDeclinedNotifications(date.getTime());
		}
		this.props.dismissSelf();
	}
	clickEnable() {
		setARegistrationToken();
		setDeclinedNotifications(false);
		this.props.enableNotifications();
		this.props.dismissSelf();
	}
	clickDecline() {
		setDeclinedNotifications(true);
		this.props.declineNotifications();
		this.props.dismissSelf();
	}
	render() {
		console.log(this.props.active_tt);
		return (
		<div className="enable-notification-alert friends-in-class-alert">
			<h2>{ this.props.msg }</h2>
			<small className="alert-extra">
				Plus 89 more in other classes. Continue with Facebook to find out who!
			</small>
			<div className="friends-in-class-fb">
                <button className="btn abnb-btn fb-btn" onClick={() => {
                        let link = document.createElement('a');
                        link.href = 'google.com'
                        document.body.appendChild(link);
                        link.click()
                    }}>
                    <span className="img-icon">
                       <i className="fa fa-facebook" />
                    </span>
                    <span className="facebook-text">Continue with Facebook</span>
                </button>
            </div>
	 	</div>);
 	}
};

export default FriendsInClassAlert;
