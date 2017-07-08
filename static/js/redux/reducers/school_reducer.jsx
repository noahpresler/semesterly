import { VALID_SCHOOLS } from '../constants/schools';
import * as ActionTypes from '../constants/actionTypes';

const school = (state = {
  school: '',
  areas: [],
  departments: [],
  levels: [],
  dataLastUpdated: '',
}, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      if (VALID_SCHOOLS.indexOf(action.data.school) >= 0) {
        return Object.assign({}, state, { school: action.data.school });
      }
      return state;
    case ActionTypes.RECEIVE_SCHOOL_INFO: {
      const { areas, departments, levels, last_updated: dataLastUpdated } = action.schoolInfo;
      return Object.assign({}, state, { areas, departments, levels, dataLastUpdated });
    }
    default:
      return state;
  }
};

export default school;
