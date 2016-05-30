const sortInitState = [
    {metric: 'sections with friends', selected: false, order: 'most'},
    {metric: 'number of conflicts', selected: false, order: 'least'},
    {metric: 'days with class', selected: false, order: 'least'},
    {metric: 'time on campus', selected: false, order: 'least'},
    {metric: 'course rating stars', selected: false, order: 'most'}
]

// TODO: refactor to remove code duplication, use object spread notation
export const sortMetrics = (state=sortInitState, action) => {
  switch (action.type) {
    case 'ADD_METRIC':
      let addIndex = state.findIndex(m => m.metric == action.metric)
      if (addIndex == -1) 
        return state
      let added = Object.assign({}, state[addIndex], {selected: true})
      return [...state.slice(0, addIndex), added, ...state.slice(addIndex + 1)]
    case 'TOGGLE_METRIC_ORDER':
      let orderIndex = state.findIndex(m => m.metric == action.metric)
      if (orderIndex == -1)
        return state
      let next_order = state[orderIndex] == 'least' ? 'most' : 'least'
      let reversed = Object.assign({}, state[orderIndex], {order: next_order})
      return [...state.slice(0, orderIndex), reversed, ...state.slice(orderIndex + 1)]
    case 'REMOVE_METRIC':
      let delIndex = state.findIndex(m => m.metric == action.metric)
      if (delIndex == -1)
        return state
      let removed = Object.assign({}, state[delIndex], {selected: false})
      return [removed, ...state.slice(0, delIndex), ...state.slice(delIndex + 1)]
    default:
      return state;
  }
}