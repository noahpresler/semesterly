import {COLOUR_DATA} from "../constants/colours";
import * as ActionTypes from "../constants/actionTypes";

export const ui = (state = {searchHover: 0, courseToColourIndex: {}}, action) => {
    switch (action.type) {
        case ActionTypes.HOVER_SEARCH_RESULT:
            return Object.assign({}, state, {searchHover: action.position});
        case ActionTypes.RECEIVE_TIMETABLES:
            // update slot colours based on new timetables
            let timetables = action.timetables.length > 0 ? action.timetables : [{courses: [], has_conflict: false}];
            let existingCourseToColour = !action.saving && action.preset ? {} : state.courseToColourIndex;
            let courseToColourIndex = {};
            let usedColourIndices = Object.values(existingCourseToColour);
            for (let i in timetables[0].courses) {
                let cid = timetables[0].courses[i].id;
                if (cid in existingCourseToColour) { // course already has a colour
                    courseToColourIndex[cid] = existingCourseToColour[cid];
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
            return Object.assign({}, state, {courseToColourIndex});
        default:
            return state;
    }
}
