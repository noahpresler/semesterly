/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import * as ActionTypes from '../constants/actionTypes';

const initPreferences = {
  try_with_conflicts: false,
  sort_metrics: [
    // {metric: 'sections with friends', selected: false, order: 'most'},
    { metric: 'days with class', selected: false, order: 'least' },
    { metric: 'number of conflicts', selected: false, order: 'least' },
    { metric: 'time on campus', selected: false, order: 'least' },
    { metric: 'course rating stars', selected: false, order: 'most' },
  ],
};

const preferences = (state = initPreferences, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_CONFLICTS:
      return Object.assign({}, state, { try_with_conflicts: !state.try_with_conflicts });
    case ActionTypes.TURN_CONFLICTS_ON:
      return Object.assign({}, state, { try_with_conflicts: true });
    case ActionTypes.SET_ALL_PREFERENCES:
      return action.preferences;
    case ActionTypes.ADD_METRIC: {
      const addIndex = state.sort_metrics.findIndex(m => m.metric === action.metric);
      if (addIndex === -1) {
        return state;
      }
      const added = Object.assign({}, state.sort_metrics[addIndex], { selected: true });
      const addedMetrics = [
        ...state.sort_metrics.slice(0, addIndex),
        ...state.sort_metrics.slice(addIndex + 1),
        added,
      ];
      return Object.assign({}, state, { sort_metrics: addedMetrics });
    }
    case ActionTypes.REMOVE_METRIC: {
      const delIndex = state.sort_metrics.findIndex(m => m.metric === action.metric);
      if (delIndex === -1) {
        return state;
      }
      const removed = Object.assign({}, state.sort_metrics[delIndex], { selected: false });
      const removedMetrics = [
        removed,
        ...state.sort_metrics.slice(0, delIndex),
        ...state.sort_metrics.slice(delIndex + 1),
      ];
      return Object.assign({}, state, { sort_metrics: removedMetrics });
    }
    case ActionTypes.SWITCH_METRIC: { // needs action (instead of del + add) to keep metric order
      const del = state.sort_metrics.findIndex(m => m.metric === action.del);
      const add = state.sort_metrics.findIndex(m => m.metric === action.add);
      if (add === -1 || del === -1) {
        return state;
      }
      const addObj = Object.assign({}, state.sort_metrics[add], { selected: true });
      const delObj = Object.assign({}, state.sort_metrics[del], { selected: false });
      const switched = state.sort_metrics.slice();
      switched[del] = addObj;
      switched[add] = delObj;
      return Object.assign({}, state, { sort_metrics: switched });
    }
    case ActionTypes.TOGGLE_METRIC_ORDER: {
      const orderIndex = state.sort_metrics.findIndex(m => m.metric === action.metric);
      if (orderIndex === -1) {
        return state;
      }
      const nextOrder = state.sort_metrics[orderIndex].order === 'least' ? 'most' : 'least';
      const reversed = Object.assign({}, state.sort_metrics[orderIndex], { order: nextOrder });
      const toggledMetrics = [
        ...state.sort_metrics.slice(0, orderIndex),
        reversed,
        ...state.sort_metrics.slice(orderIndex + 1),
      ];
      return Object.assign({}, state, { sort_metrics: toggledMetrics });
    }
    default:
      return state;
  }
};

export default preferences;
