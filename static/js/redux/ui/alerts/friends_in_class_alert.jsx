import React from 'react';
import { setARegistrationToken } from '../../actions/user_actions.jsx';
import MasterSlot from '../master_slot.jsx';
import { COLOUR_DATA, getSchoolSpecificInfo } from '../../constants.jsx';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';

var rc = {"code":"AS.061.150","num_credits":3,"name":"Introduction to Film Production: Rediscovering Early Cinema","textbooks":{"(01)":[]},"department":"AS Film and Media Studies","slots":[{"time_start":"14:00","waitlist":-1,"meeting_section":"(01)","section":15698,"instructors":"J. Mann","section_type":"L","enrolment":9,"time_end":"16:20","waitlist_size":-1,"course":3459,"semester":"S","location":"Gilman 35","textbooks":[],"id":20576,"day":"T","size":12,"colourId":0,"code":"AS.061.150","name":"Introduction to Film Production: Rediscovering Early Cinema","custom":false,"num_conflicts":1,"shift_index":0,"depth_level":0}],"enrolled_sections":["(01)"],"id":3459}

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


	render() {
		let maxColourIndex = COLOUR_DATA.length - 1;
		console.log(this.props.active_tt);
		return (
		<div className="enable-notification-alert friends-in-class-alert">
			<h2>{ this.props.msg }</h2>
			<MasterSlot 
                key={rc.id} course={rc} 
                professors={null}
                colourIndex={0}
                onTimetable={true}
                hideCloseButton={true}
                inModal={true}
                fetchCourseInfo={() => this.fetchCourseInfo(rc.id)}
                />
			<small className="alert-extra">
				Plus 89 more in other classes. Enable the friend feature to find out who!
			</small>
			<button 
				onClick={() => this.clickEnable()}
				className="conflict-alert-btn change-semester-btn">
				Find Friends in Classes
			</button>
			{/*<div className="friends-in-class-fb">
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
            </div>*/}
	 	</div>);
 	}
};

export default FriendsInClassAlert;
