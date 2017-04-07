import {connect} from "react-redux";
import {setDeclinedNotifications} from "../../util.jsx";
import EnableNotificationsAlert from "./enable_notifications_alert.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    let msg = "Get Alerts!";
    return {
        msg,
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        dismissSelf: () => {
            dispatch({type: ActionTypes.DISMISS_ENABLE_NOTIFICATIONS});
        },
        declineNotifications: () => setDeclinedNotifications(true),
        enableNotifications: () => setDeclinedNotifications(false),
    }
}

const EnableNotificationsAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EnableNotificationsAlert);
export default EnableNotificationsAlertContainer;
