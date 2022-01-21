import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import * as actionCreators from "../actions";
import { AppDispatch, RootState } from "../state";
import * as sliceAction from "../state/slices";
/* eslint-disable import/prefer-default-export, react/prop-types */

// custom hook used to combine all actionCreators to an object
export const useActions = () => {
  const dispatch = useDispatch();

  // @ts-ignore
  return bindActionCreators(
    {
      ...actionCreators,
      ...sliceAction.userAcquisitionModalActions,
      ...sliceAction.userInfoActions,
      ...sliceAction.alertsActions,
    },
    dispatch
  );
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
