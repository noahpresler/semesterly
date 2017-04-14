import { getSchoolInfoEndpoint } from '../constants/endpoints';
import * as ActionTypes from '../constants/actionTypes';

export default function fetchSchoolInfo() {
  return (dispatch) => {
    dispatch({ type: ActionTypes.REQUEST_SCHOOL_INFO });
    fetch(getSchoolInfoEndpoint())
            .then(response => response.json())
            .then((json) => {
              dispatch({
                type: ActionTypes.RECEIVE_SCHOOL_INFO,
                schoolInfo: json,
              });
            });
  };
}
