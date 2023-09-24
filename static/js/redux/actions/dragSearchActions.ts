import { Day } from "./../constants/commonTypes";
import { Dispatch } from "redux";
import {
  setDragSearchSlot,
  updateDragSearchSlot,
  clearDragSearchSlot,
  finalizeDragSearchSlot,
} from "./../state/slices/dragSearchSlice";
import { generateCustomEventId } from "../util";
import { advancedSearchActions } from "../state/slices";

export const addSearchSlot =
  (timeStart: string, timeEnd: string, day: Day) => (dispatch: Dispatch) => {
    dispatch(
      setDragSearchSlot({
        id: generateCustomEventId(),
        time_start: timeStart,
        time_end: timeEnd,
        day,
      })
    );
  };

export const updateSearchSlot =
  (timeStart: string, timeEnd: string) => (dispatch: Dispatch) => {
    dispatch(
      updateDragSearchSlot({
        time_start: timeStart,
        time_end: timeEnd,
      })
    );
  };

export const finalizeSearchSlot = () => (dispatch: Dispatch) => {
  // trigger advanced search modal with the correct filter data
  dispatch(finalizeDragSearchSlot());
  dispatch(advancedSearchActions.showAdvancedSearchModal());
  dispatch(clearDragSearchSlot());
};

export default {};
