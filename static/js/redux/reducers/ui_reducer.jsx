import { COLOUR_DATA } from '../constants.jsx';

export const ui = (state = { searchHover: 0, courseToColourIndex: {} }, action) => {
	switch (action.type) {
		case 'HOVER_SEARCH_RESULT':
			return Object.assign( {}, state, { searchHover : action.position } );
		case 'RECEIVE_TIMETABLES':
		 	// update slot colours based on new timetables
			let timetables = action.timetables.length > 0 ? action.timetables : [{courses: []}];

			let courseToColourIndex = {};
            let usedColourIndices = Object.values(state.courseToColourIndex);
			for (let i in timetables[0].courses) {
				let cid = timetables[0].courses[i].id;
				if (cid in state.courseToColourIndex) { // course already has a colour
					courseToColourIndex[cid] = state.courseToColourIndex[cid];
				}
				else {
					let newUsed = Object.values(courseToColourIndex);
					// find unused colourIndex
					let colourIndex = _.range(COLOUR_DATA.length).find((i) => 
                            !usedColourIndices.concat(newUsed).some((x) => x === i)
                    );
					courseToColourIndex[cid] = colourIndex;
				}

			}
			return Object.assign({}, state, { courseToColourIndex });
		default:
			return state;
	}
}
