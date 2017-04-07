import * as ActionTypes from "../constants/actionTypes.jsx";

export const friends = (state = {peers: [], isFetching: false}, action) => {
    switch (action.type) {
        case ActionTypes.FRIENDS_RECEIVED:
            return Object.assign({}, state, {peers: action.peers, isFetching: false});
        case ActionTypes.REQUEST_FRIENDS:
            return Object.assign({}, state, {isFetching: true});
        default:
            return state;
    }
}
