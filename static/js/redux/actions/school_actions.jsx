import { getSchoolInfoEndpoint } from '../constants/endpoints';
import * as ActionTypes from '../constants/actionTypes';
import store from '../init';
import { currSem } from '../reducers/semester_reducer';

export const getSchool = () => store.getState().school.school;
export const getSemester = () => {
  const state = store.getState();
  const currSemester = currSem(state.semester);
  return `${currSemester.name}/${currSemester.year}`;
};

export const fetchSchoolInfo = () => (dispatch) => {
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

export const _ = null;
