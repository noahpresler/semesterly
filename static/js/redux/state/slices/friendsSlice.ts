import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Course, Peer } from "../../constants/commonTypes";

/**
 * Represents an element of backend response array for action `receiveFriends`
 */
interface ReceivedFriend {
  is_friend: boolean;
  large_img: boolean;
  name: string;
  peer: Peer;
  profile_url: string;
  shared_courses: {
    course: Course;
    in_section: boolean;
  }[];
}

interface FriendsSliceState {
  peers: ReceivedFriend[];
  isFetching: boolean;
}

const initialState: FriendsSliceState = {
  peers: [],
  isFetching: false,
};

const friendsSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    receiveFriends: (state, action: PayloadAction<ReceivedFriend[]>) => {
      state.isFetching = false;
      state.peers = action.payload;
    },
    requestFriends: (state) => {
      state.isFetching = true;
    },
  },
});

export const { receiveFriends, requestFriends } = friendsSlice.actions;

export default friendsSlice.reducer;
