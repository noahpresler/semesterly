import * as ActionTypes from '../constants/actionTypes';

const defaultState = {
  alertConflict: false,
  alertTimetableExists: false,
  alertChangeSemester: false,
  alertNewTimetable: false,
  alertEnableNotifications: false,
  alertFacebookFriends: false,
  facebookAlertIsOn: false,
  mostFriendsClassId: null,
  mostFriendsCount: 0,
  totalFriendsCount: 0,
  desiredSemester: 0,
};

export const alerts = (state = defaultState, action) => {
  switch (action.type) {
        // dispatched when there's a conflict
    case ActionTypes.ALERT_CONFLICT:
      return Object.assign({}, state, { alertConflict: true });
    case ActionTypes.DISMISS_ALERT_CONFLICT:
      return Object.assign({}, state, { alertConflict: false });
        // dispatched there's a saved timetable with the same name
    case ActionTypes.ALERT_TIMETABLE_EXISTS:
      return Object.assign({}, state, { alertTimetableExists: true });
    case ActionTypes.DISMISS_TIMETABLE_EXISTS:
      return Object.assign({}, state, { alertTimetableExists: false });
        // dispatched when the user tries to change semester,
        // while having an unsaved timetable (if logged in), or
        // if they're logged out, since while logged out their timetable is cleared
    case ActionTypes.ALERT_CHANGE_SEMESTER:
      return Object.assign({}, state, {
        alertChangeSemester: true,
        desiredSemester: action.semester,
      });
    case ActionTypes.DISMISS_ALERT_CHANGE_SEMESTER:
      return Object.assign({}, state, { alertChangeSemester: false });
        // dispatched when the user tries to create a new timetable but the current one is unsaved
    case ActionTypes.ALERT_NEW_TIMETABLE:
      return Object.assign({}, state, { alertNewTimetable: true });
    case ActionTypes.DISMISS_ALERT_NEW_TIMETABLE:
      return Object.assign({}, state, { alertNewTimetable: false });
        // bring up pop up to ask to enable notifications
    case ActionTypes.ALERT_ENABLE_NOTIFICATIONS:
      return Object.assign({}, state, { alertEnableNotifications: true });
    case ActionTypes.DISMISS_ENABLE_NOTIFICATIONS:
      return Object.assign({}, state, { alertEnableNotifications: false });
        // dispatched when the most friended class is returned
    case ActionTypes.CHANGE_MOST_FRIENDS_CLASS:
      return Object.assign({}, state, {
        mostFriendsCount: action.count,
        mostFriendsClassId: action.classId,
        totalFriendsCount: action.total,
      });
    case ActionTypes.ALERT_FACEBOOK_FRIENDS:
      return Object.assign({}, state, { alertFacebookFriends: true });
    case ActionTypes.SHOW_FACEBOOK_ALERT:
      return Object.assign({}, state, { facebookAlertIsOn: true });
    case ActionTypes.DISMISS_FACEBOOK_FRIENDS:
      return Object.assign({}, state, {
        alertFacebookFriends: false,
        facebookAlertIsOn: false,
      });
    default:
      return state;
  }
};
