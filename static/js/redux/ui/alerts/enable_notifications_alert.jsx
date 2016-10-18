import React from 'react';

class EnableNotificationsAlert extends React.Component {
	constructor(props) {
		super(props);
	}
	componentWillUnmount() {
		this.props.dismissSelf();
	}
	clickEnable() {
		this.props.enableNotifications();	
		this.props.dismissSelf();
	}
	clickDecline() {
		this.props.declineNotifications();
		this.props.dismissSelf();
	}
	render() {
		return (
		<div className="enable-notification-alert change-semester-alert">
			<h2>{ this.props.msg }</h2>
			<button 
				onClick={() => this.clickEnable()}
				className="conflict-alert-btn change-semester-btn">
				Enable Notifications
			</button>
			<small className="alert-extra">
				Psst – Enabling notifications allows us to give you a heads up when classes are released and important course changes occur!
			</small>
			<a className="decline-notifications" onClick={() => this.clickDecline()}>Don't ask me again.</a>
	 	</div>);
 	}
};

export default EnableNotificationsAlert;
