import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAllState } from "../../actions/initActions";
import { isIncomplete } from "../../util";

interface UserData {
  [key: string]: any;
  FacebookSignedUp: boolean;
  GoogleLoggedIn: boolean;
  GoogleSignedUp: boolean;
  LoginHash: string;
  LoginToken: string;
  class_year: string;
  courses: any[]; // temporarily mark as any
  emails_enabled: boolean;
  fbook_uid: string;
  img_url: string;
  integrations: any[]; // temporarily mark as any
  isLoggedIn: boolean;
  major: any; // temporarily mark as any
  school: any;
  social_all: boolean;
  social_courses: boolean;
  social_offerings: boolean;
  timeAcceptedTos: string;
  timetables: any[]; // temporarily mark as any
  userFirstName: string;
  userLastName: string;
  preferred_name: string | null;
}

interface UserInfoReducerState {
  data: UserData | any; // temporarily use any
  overrideHide: boolean;
  overrideShow: boolean;
  isVisible: boolean;
  saving: boolean;
  isFetching: boolean;
  isDeleted: boolean;
}

export const initialState: UserInfoReducerState = {
  data: { isLoggedIn: false },
  overrideHide: false, // hide the user settings modal if true. Overrides overrideShow
  overrideShow: false, // show the user settings modal if true
  isVisible: false,
  saving: false,
  isFetching: false,
  isDeleted: false,
};

const userInfoSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    overrideSettingsShow: (state, action: PayloadAction<boolean>) => {
      state.overrideShow = action.payload;
    },
    overrideSettingsHide: (state, action: PayloadAction<boolean>) => {
      state.overrideHide = action.payload;
    },
    changeUserInfo: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.data.social_courses =
        action.payload.social_offerings || action.payload.social_courses;
    },
    requestSaveUserInfo: (state) => {
      state.saving = true;
    },
    receiveUserInfoSaved: (state) => {
      state.saving = false;
    },
    receiveSavedTimeTables: (state, action: PayloadAction<any>) => {
      state.data.timetables = action.payload;
    },
    setUserSettingsModalVisible: (state) => {
      state.isVisible = true;
    },
    setUserSettingsModalHidden: (state) => {
      state.isVisible = false;
    },
    deleteAccount: (state) => {
      state.isDeleted = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initAllState, (state, action: PayloadAction<any>) => {
      state.isFetching = false;
      state.data = action.payload.currentUser;
    });
  },
});

export const isUserInfoIncomplete = (data: UserData) => {
  const fields = data.FacebookSignedUp
    ? ["social_offerings", "social_courses", "major", "class_year"]
    : ["major", "class_year"];
  return (
    data.isLoggedIn &&
    fields.map((field) => data[field]).some((val) => isIncomplete(val))
  );
};

export const userInfoActions = userInfoSlice.actions;
export default userInfoSlice.reducer;
