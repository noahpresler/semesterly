import React from 'react';
import { setARegistrationToken } from '../../actions/user_actions.jsx';
import MasterSlot from '../master_slot.jsx';
import { COLOUR_DATA, getSchoolSpecificInfo } from '../../constants.jsx';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';

//var rc = {"code":"AS.061.150","num_credits":3,"name":"Introduction to Film Production: Rediscovering Early Cinema","textbooks":{"(01)":[]},"department":"AS Film and Media Studies","slots":[{"time_start":"14:00","waitlist":-1,"meeting_section":"(01)","section":15698,"instructors":"J. Mann","section_type":"L","enrolment":9,"time_end":"16:20","waitlist_size":-1,"course":3459,"semester":"S","location":"Gilman 35","textbooks":[],"id":20576,"day":"T","size":12,"colourId":0,"code":"AS.061.150","name":"Introduction to Film Production: Rediscovering Early Cinema","custom":false,"num_conflicts":1,"shift_index":0,"depth_level":0}],"enrolled_sections":["(01)"],"id":3459}

class FriendsInClassAlert extends React.Component {
	constructor(props) {
		super(props);
		this.state = { isComplete: false };
	}
	componentWillMount() {
		this.props.showNotification();
	}

	componentWillUnmount() {
		if (!(localStorage.getItem("declinedNotifications") === "true" || localStorage.getItem("declinedNotifications") === "false")) {
			let date = new Date;
			setDeclinedNotifications(date.getTime());
		}
		this.props.dismissSelf();
	}

	allowFacebook() {
		console.log("allow facebook");

		// console.log(this.props.userInfo);
        let newUserSettings = {
            social_courses: true,
            social_offerings: true,
            social_all: true
        }
        let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings();
		this.setState({ isComplete: true });
		setTimeout(() => {
			console.log("I'm here");
			this.props.dismissSelf();
		}, 3000);
        // this.props.dismissSelf();
	}

	render() {
		let maxColourIndex = COLOUR_DATA.length - 1;
		let professors = []
        if (this.props.mostFriendsClass.slots.length == 0 && this.props.mostFriendsClass.oldSlots && this.props.mostFriendsClass.oldSlots.length > 0) {
            professors = [ ...new Set(this.props.mostFriendsClass.oldSlots.map(s => s.instructors)) ];
        } else {
            professors = [ ...new Set(this.props.mostFriendsClass.slots.map(s => s.instructors)) ];
        }

		return (
		<div>		
			<div className={(this.state.isComplete ? "friends-in-class-show" : "friends-in-class-hide") + " enable-notification-alert friends-in-class-alert"}>
				<i className="friends-in-class-done fa fa-check" />
				<small className={"alert-extra"}>
					You can now see your friends in classes! To revert these changes, head to Account Settings.
				</small>
			</div>
			<div className={(this.state.isComplete ? "friends-in-class-hide" : "") + " enable-notification-alert friends-in-class-alert"}>
				<h2>{ this.props.msg }</h2>
				<MasterSlot 
	                key={this.props.mostFriendsKey} course={this.props.mostFriendsClass} 
	                professors={professors}
	                colourIndex={Math.min(this.props.mostFriendsKey, maxColourIndex)}
	                onTimetable={true}
	                hideCloseButton={true}
	                inModal={true}
	                fakeFriends={this.props.mostFriendsCount}
	                fetchCourseInfo={() => this.fetchCourseInfo(this.props.mostFriendsClass.id)}
	                />
				<small className="alert-extra">
					Plus 89 more in other classes. Enable the friend feature to find out who!
				</small>
				<button 
					onClick={() => {this.allowFacebook();}}
					className="conflict-alert-btn change-semester-btn">
					Find Friends in Classes
				</button>
		 	</div>
	 	</div>);
 	}
};

export default FriendsInClassAlert;
