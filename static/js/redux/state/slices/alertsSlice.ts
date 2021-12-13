import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AlertsSliceState {
  alertConflict: boolean;
  alertTimetableExists: boolean;
  alertChangeSemester: boolean;
  alertNewTimetable: boolean;
  alertEnableNotifications: boolean;
  alertFacebookFriends: boolean;
  facebookAlertIsOn: boolean;
  mostFriendsClassId: null | number;
  mostFriendsCount: number;
  totalFriendsCount: number;
  desiredSemester: number;
}

const initialState: AlertsSliceState = {
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

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    // dispatched when there's a conflict
    alertConflict: (state) => {
      state.alertConflict = true;
    },
    dismissAlertConflict: (state) => {
      state.alertConflict = false;
    },
    // dispatched there's a saved timetable with the same name
    alertTimeTableExists: (state) => {
      state.alertTimetableExists = true;
    },
    dismissTimeTableExists: (state) => {
      state.alertTimetableExists = false;
    },
    // dispatched when the user tries to change semester,
    // while having an unsaved timetable (if logged in), or
    // if they're logged out, since while logged out their timetable is cleared
    alertChangeSemester: (state, action: PayloadAction<any>) => {
      state.alertChangeSemester = true;
      state.desiredSemester = action.payload;
    },
    dismissAlertChangeSemester: (state) => {
      state.alertChangeSemester = true;
    },
    // dispatched when the user tries to create a new timetable but the current one is unsaved
    alertNewTimeTable: (state) => {
      state.alertNewTimetable = true;
    },
    dismissAlertNewTimeTable: (state) => {
      state.alertNewTimetable = false;
    },
    // bring up pop up to ask to enable notifications
    alertEnableNotifications: (state) => {
      state.alertEnableNotifications = true;
    },
    dismissEnableNotifications: (state) => {
      state.alertEnableNotifications = false;
    },
    // dispatched when the most friended class is returned
    changeMostFriendsClass: (
      state,
      action: PayloadAction<{
        mostFriendsCount: number;
        mostFriendsClassId: number;
        totalFriendsCount: number;
      }>
    ) => {
      state.mostFriendsCount = action.payload.mostFriendsCount;
      state.mostFriendsClassId = action.payload.mostFriendsClassId;
      state.totalFriendsCount = action.payload.totalFriendsCount;
    },
    alertFacebookFriends: (state) => {
      state.alertFacebookFriends = true;
    },
    showFacebookAlert: (state) => {
      state.facebookAlertIsOn = true;
    },
    dismissFacebookFriends: (state) => {
      state.alertFacebookFriends = false;
      state.facebookAlertIsOn = false;
    },
  },
});

export const alertsAction = alertsSlice.actions;
export default alertsSlice.reducer;
