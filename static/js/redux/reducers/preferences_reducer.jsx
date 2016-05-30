const initPreferences = {
    try_with_conflicts: false,
    sort_metrics: [
        {metric: 'sections with friends', selected: false, order: 'most'},
        {metric: 'number of conflicts', selected: false, order: 'least'},
        {metric: 'days with class', selected: false, order: 'least'},
        {metric: 'time on campus', selected: false, order: 'least'},
        {metric: 'course rating stars', selected: false, order: 'most'}
    ]
}

export const preferences = (state=initPreferences, action) => {
	switch (action.type) {
        case 'TOGGLE_CONFLICTS':
            return Object.assign({}, state, {try_with_conflicts: !state.try_with_conflicts})
        case 'TURN_CONFLICTS_ON':
        	return Object.assign({}, state, {try_with_conflicts: true})
        case 'SET_ALL_PREFERENCES':
            return action.preferences;
        case 'ADD_METRIC':
        	console.log(state)
            let addIndex = state.sort_metrics.findIndex(m => m.metric == action.metric)
            if (addIndex == -1) 
                return state
            let added = Object.assign({}, state.sort_metrics[addIndex], {selected: true})
            let addedMetrics = [
            	...state.sort_metrics.slice(0, addIndex), 
            	added, 
            	...state.sort_metrics.slice(addIndex + 1)
            ]
            return Object.assign({}, state, {sort_metrics: addedMetrics})
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
        case 'REMOVE_METRIC':
            let delIndex = state.sort_metrics.findIndex(m => m.metric == action.metric)
            if (delIndex == -1)
                return state
            let removed = Object.assign({}, state.sort_metrics[delIndex], {selected: false})
            let removedMetrics = [
            	removed, 
            	...state.sort_metrics.slice(0, delIndex), 
            	...state.sort_metrics.slice(delIndex + 1)
            ]
            return Object.assign({}, state, {sort_metrics: removedMetrics})
		default:
			return state;
	}
}
