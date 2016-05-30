const initPreferences = {
    try_with_conflicts: false,
    sort_metrics: [],
    avail_metrics: [
        {metric: 'sections with friends', order: 'most'},
        {metric: 'number of conflicts', order: 'least'},
        {metric: 'days with class', order: 'least'},
        {metric: 'time on campus', order: 'least'},
        {metric: 'course rating stars', order: 'most'}
    ]
}

const deleteElement = (array, index) => [...array.slice(0, index), ...array.slice(index + 1)]

export const preferences = (state=initPreferences, action) => {
	switch (action.type) {
        case 'TOGGLE_CONFLICTS':
            return Object.assign({}, state, {try_with_conflicts: !state.try_with_conflicts})
        case 'TURN_CONFLICTS_ON':
        	return Object.assign({}, state, {try_with_conflicts: true})
        case 'SET_ALL_PREFERENCES':
            return action.preferences;
        case 'ADD_METRIC':
            let addIndex = state.avail_metrics.findIndex(m => m.metric == action.metric)
            if (addIndex == -1) 
                return state
            let added = {
                sort_metrics: [...state.sort_metrics, state.avail_metrics[addIndex]],
                avail_metrics: deleteElement(state.avail_metrics, addIndex)
            }
            console.log('add', added)
            return Object.assign({}, state, added)
        case 'REMOVE_METRIC':
            let delIndex = state.sort_metrics.findIndex(m => m.metric == action.metric)
            if (delIndex == -1)
                return state
            let removed = {
                sort_metrics: deleteElement(state.sort_metrics, delIndex),
                avail_metrics: [...state.avail_metrics, state.sort_metrics[delIndex]]
            }
            console.log('del', removed)
            return Object.assign({}, state, removed)
        case 'SWITCH_METRIC':
            let add = state.avail_metrics.findIndex(m => m.metric == action.add)
            if (add == -1 || delIndex == -1) 
                return state
            let del = state.sort_metrics.findIndex(m => m.metric == action.del)
            let switched = {
                sort_metrics: [...deleteElement(state.sort_metrics, del), state.avail_metrics[add]],
                avail_metrics: [...deleteElement(state.avail_metrics, add), state.sort_metrics[del]]
            }
            return Object.assign({}, state, switched)
        case 'TOGGLE_METRIC_ORDER':
            let orderIndex = state.sort_metrics.findIndex(m => m.metric == action.metric)
            if (orderIndex == -1)
                return state
            let next_order = state.sort_metrics[orderIndex] == 'least' ? 'most' : 'least'
            let reversed = Object.assign({}, state.sort_metrics[orderIndex], {order: next_order})
            let toggledMetrics = [
                ...state.sort_metrics.slice(0, orderIndex), 
                reversed, 
                ...state.sort_metrics.slice(orderIndex + 1)
            ]
            return Object.assign({}, state, {sort_metrics: toggledMetrics})
		default:
			return state;
	}
}
