import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actionCreators from '../actions';
/* eslint-disable import/prefer-default-export, react/prop-types */

// custom hook used to combine all actionCreators to an object
export const useActions = () => {
  const dispatch = useDispatch();
  return bindActionCreators(actionCreators, dispatch);
};
