const sortInitState = [
    {metric: 'sections with friends', selected: false},
    {metric: 'number of conflicts', selected: false},
    {metric: 'days with class', selected: false},
    {metric: 'time on campus', selected: false},
    {metric: 'average course rating', selected: false}
]

export const sortMetrics = (state=sortInitState, action) => {
  switch (action.type) {
    case 'ADD_METRIC':
      let addIndex = state.findIndex(m => m.metric == action.metric)
      if (addIndex == -1)
        return state
      let added = {metric: action.metric, selected: true}
      return [...state.slice(0, addIndex), added, ...state.slice(addIndex + 1)]
    case 'REMOVE_METRIC':
      let delIndex = state.findIndex(m => m.metric == action.metric)
      if (delIndex == -1)
        return state
      let removed = {metric: action.metric, selected: false}
      return [...state.slice(0, delIndex), removed, ...state.slice(delIndex + 1)]
    default:
      return state;
  }
}