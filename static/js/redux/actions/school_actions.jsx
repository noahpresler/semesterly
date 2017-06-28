import { getSchoolInfoEndpoint } from '../constants/endpoints';
import * as ActionTypes from '../constants/actionTypes';
import { currSem } from '../reducers/semester_reducer';

export const getSchool = state => state.school.school;
export const getSemester = (state) => {
  const currSemester = currSem(state.semester);
  return `${currSemester.name}/${currSemester.year}`;
};

export const fetchSchoolInfo = () => (dispatch, getState) => {
  dispatch({ type: ActionTypes.REQUEST_SCHOOL_INFO });
  fetch(getSchoolInfoEndpoint(getSchool(getState())))
    .then(response => response.json())
    .then((json) => {
      dispatch({
        type: ActionTypes.RECEIVE_SCHOOL_INFO,
        schoolInfo: json,
      });
    });
};
