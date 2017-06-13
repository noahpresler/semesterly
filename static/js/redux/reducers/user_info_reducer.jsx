import * as ActionTypes from '../constants/actionTypes';

export const initialState = {
  data: { isLoggedIn: false },
  overrideHide: false, // hide the user settings modal if true. Overrides overrideShow
  overrideShow: false, // show the user settings modal if true
  saving: false,
  isFetching: false,
};

const userInfo = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, { data: action.data.currentUser, isFetching: false });
    case ActionTypes.OVERRIDE_SETTINGS_SHOW:
      return Object.assign({}, state, { overrideShow: action.data });
    case ActionTypes.OVERRIDE_SETTINGS_HIDE:
      return Object.assign({}, state, { overrideHide: action.data });
    case ActionTypes.REQUEST_SAVE_USER_INFO:
      return Object.assign({}, state, { saving: true });
    case ActionTypes.CHANGE_USER_INFO: {
      const changeData = action.data;
      changeData.social_courses = changeData.social_offerings ? true : changeData.social_courses;
      return Object.assign({}, state, { data: changeData });
    }
    case ActionTypes.RECEIVE_USER_INFO_SAVED:
      return Object.assign({}, state, { saving: false });
    case ActionTypes.REQUEST_USER_INFO:
      return Object.assign({}, state, { isFetching: true });
    case ActionTypes.RECEIVE_SAVED_TIMETABLES: {
      const newData = Object.assign({}, state.data, { timetables: action.timetables });
      return Object.assign({}, state, { data: newData });
    }
    default:
      return state;
  }
};

export default userInfo;
