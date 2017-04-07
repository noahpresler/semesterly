import React from "react";
import {setARegistrationToken} from "../../actions/user_actions.jsx";
import {setDeclinedNotifications} from "../../util.jsx";

class EnableNotificationsAlert extends React.Component {
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
        return (
            <div className="enable-notification-alert change-semester-alert">
                <h2>{ this.props.msg }</h2>
                <button
                    onClick={() => this.clickEnable()}
                    className="conflict-alert-btn change-semester-btn">
                    Enable Notifications
                </button>
                <small className="alert-extra">
                    Enable notifications for a heads up when classes are released and course changes occur!
                </small>
                <a className="decline-notifications" onClick={() => this.clickDecline()}>Don't ask me again.</a>
            </div>);
    }
}
;

export default EnableNotificationsAlert;
