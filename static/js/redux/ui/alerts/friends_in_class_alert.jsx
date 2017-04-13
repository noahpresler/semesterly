import React from "react";
import {LogFacebookAlertClick} from "../../actions/user_actions";
import MasterSlot from "../master_slot";
import {COLOUR_DATA} from "../../constants/colours";
import {setDeclinedNotifications} from "../../util";

class FriendsInClassAlert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isComplete: false};
    }

    componentWillMount() {
        this.props.showNotification();
    }

    componentDidUpdate(nextProps) {
        if (nextProps.showFacebookAlert) {
            this.props.showNotification();
        }
    }

    componentWillUnmount() {
        if (!(localStorage.getItem("declinedNotifications") === "true" || localStorage.getItem("declinedNotifications") === "false")) {
            let date = new Date;
            setDeclinedNotifications(date.getTime());
        }
        this.props.dismissSelf();
    }

    allowFacebook() {
        LogFacebookAlertClick();

        let newUserSettings = {
            social_courses: true,
            social_offerings: true,
            social_all: false
        }
        let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings();
        this.setState({isComplete: true});
        setTimeout(() => {
            this.props.dismissSelf();
        }, 5000);
    }

    render() {
        let maxColourIndex = COLOUR_DATA.length - 1;
        let professors = []
        if (this.props.mostFriendsClass.slots.length == 0 && this.props.mostFriendsClass.oldSlots && this.props.mostFriendsClass.oldSlots.length > 0) {
            professors = [...new Set(this.props.mostFriendsClass.oldSlots.map(s => s.instructors))];
        } else {
            professors = [...new Set(this.props.mostFriendsClass.slots.map(s => s.instructors))];
        }

        return (
            <div>
                <div
                    className={(this.state.isComplete ? "friends-in-class-show" : "friends-in-class-hide") + " enable-notification-alert friends-in-class-alert"}>
                    <i className="friends-in-class-done fa fa-check"/>
                    <small className={"alert-extra"}>
                        You can now see your friends in classes! To revert these changes, head to
                        Account Settings.
                    </small>
                </div>
                <div
                    className={(this.state.isComplete ? "friends-in-class-hide" : "") + " enable-notification-alert friends-in-class-alert"}>
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
                        Plus {this.props.totalFriendsCount} more in other classes. Enable the friend
                        feature to find out
                        who!
                    </small>
                    <button
                        onClick={() => {
                            this.allowFacebook();
                        }}
                        className="conflict-alert-btn change-semester-btn">
                        Find Friends in Classes
                    </button>
                </div>
            </div>);
    }
}
;

export default FriendsInClassAlert;
