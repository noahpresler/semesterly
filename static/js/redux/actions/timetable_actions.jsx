import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';
import { randomString, browserSupportsLocalStorage } from '../util.jsx';
import { store } from '../init.jsx';
import { getSchoolSpecificInfo } from '../constants.jsx'
import { lockActiveSections, fetchClassmates, autoSave } from './user_actions.jsx';
import { saveLocalSemester, saveLocalPreferences, saveLocalCourseSections, saveLocalActiveIndex } from '../util.jsx';

export const SID = randomString(30);

export function requestTimetables() {
  return {
    type: "REQUEST_TIMETABLES",
  }
}

export function receiveTimetables(timetables) {
  return {
    type: "RECEIVE_TIMETABLES",
    timetables: timetables,
  }
}

export function alertConflict(){
	return {
		type: "ALERT_CONFLICT"
	}
}

export function nullifyTimetable(dispatch) {
	dispatch({
		type: "RECEIVE_TIMETABLES",
		timetables: [{courses: [], has_conflict: false}],
	});
	dispatch({
		type: "RECEIVE_COURSE_SECTIONS",
		courseSections: {}
	});
	dispatch({
		type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
		timetable: {name: "Untitled Schedule", courses: [], has_conflict: false}
	})
	dispatch({
		type: "CLEAR_OPTIONAL_COURSES"
	})
}

// loads timetable from localStorage. assumes that the browser supports localStorage
export function loadCachedTimetable(dispatch) {
	dispatch({type: "LOADING_CACHED_TT"});
	let localCourseSections = JSON.parse(localStorage.getItem('courseSections'));
	// no coursesections stored locally; user is new (or hasn't added timetables yet)
	if (!localCourseSections) {
		dispatch({type: "CACHED_TT_LOADED"});
		return; 
	}
	// no preferences stored locally; save the defaults
	let localPreferences = JSON.parse(localStorage.getItem('preferences'));
	let localSemester = localStorage.getItem('semester');
	let localActive = parseInt(localStorage.getItem('active'));
	if (Object.keys(localCourseSections).length === 0 || Object.keys(localPreferences).length === 0) { return; }
	store.dispatch({ type: 'SET_ALL_PREFERENCES', preferences: localPreferences });
	store.dispatch({ type: 'SET_SEMESTER', semester: localSemester });
	store.dispatch({ type: 'RECEIVE_COURSE_SECTIONS', courseSections: localCourseSections });
	fetchStateTimetables(localActive);
	dispatch({type: "CACHED_TT_LOADED"});
}


// loads @timetable into the state.
// @created is true if the user is creating a new timetable
export function loadTimetable(timetable, created=false) {
	let dispatch = store.dispatch;
	let state = store.getState();
	let isLoggedIn = state.userInfo.data.isLoggedIn;
	if (!isLoggedIn) {
		return dispatch({type: 'TOGGLE_SIGNUP_MODAL'});
	}
	// store the 'saved timetable' (handled by the saving_timetable reducer)
	dispatch({
		type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
		timetable,
		created
	});
	// lock sections for this timetable; and mark it as the only available one
	lockTimetable(dispatch, timetable, created, isLoggedIn);
}

export function lockTimetable(dispatch, timetable, created, isLoggedIn) {
	if (timetable.has_conflict) { // turn conflicts on if necessary
		dispatch({ type: "TURN_CONFLICTS_ON" });
	}
	dispatch({
		type: "RECEIVE_COURSE_SECTIONS",
		courseSections: lockActiveSections(timetable)
	});
	dispatch({
		type: "RECEIVE_TIMETABLES",
		timetables: [timetable],
		preset: created === false
	});
	if (isLoggedIn) { // fetch classmates for this timetable only if the user is logged in
		dispatch(fetchClassmates(timetable.courses.map( c => c['id'])))
	}
}

export function handleCreateNewTimetable() {
	let dispatch = store.dispatch;
	let state = store.getState();
	let isLoggedIn = state.userInfo.data.isLoggedIn;
	if (!isLoggedIn) {
		return dispatch({type: 'TOGGLE_SIGNUP_MODAL'});
	}
	let { timetables:timetablesState } = state;
	if (timetablesState.items[timetablesState.active].courses.length > 0 && !state.savingTimetable.upToDate) {
		return dispatch({
			type: "ALERT_NEW_TIMETABLE",
		});
	}
	else {
		createNewTimetable(getNumberedName("Untitled Schedule"));
	}
}

/*
 * Numbers the provided string based on the number of other timetables with
 * that name. e.g. getNumberedName("Untitled") -> "Untitled 2" if there are 2
 * other timetables with "Untitled" in the title, or "Untitled" if there
 * no others.
 */
export function getNumberedName(name) {
	let state = store.getState();
	let tokens = name.split(" ");
	let nameBase = !isNaN(tokens[tokens.length - 1]) ? 
		tokens.slice(0, tokens.length - 1).join(" ") : name;
	let numberSuffix = state.userInfo.data.timetables.filter(
		t => t.name.indexOf(nameBase) > -1).length;
	numberSuffix = numberSuffix === 0 ? "" : " " + numberSuffix;
	return nameBase + numberSuffix;
}

export function createNewTimetable(ttName="Untitled Schedule") {
	loadTimetable({ name: ttName, courses: [], has_conflict: false }, true);
}

/* 
Returns the body of the request used to get new timetables
*/
function getBaseReqBody(state){
	return {
		school: state.school.school,
		semester: allSemesters[state.semesterIndex],
		courseSections: state.courseSections.objects,
		preferences: state.preferences,
		sid: SID
	}
}
export function hoverSection (dispatch) {
	return (course, section) => {
		let availableSections = Object.assign({}, course.sections['L'], course.sections['T'], course.sections['P']);
		course.section = section;
		dispatch({
			type: "HOVER_COURSE",
			course: Object.assign({}, course, { slots: availableSections[section] })
		});
	}
}
export function unhoverSection (dispatch) {
	return () => {
		dispatch({
			type: "UNHOVER_COURSE",
		});
	}
}
export function fetchStateTimetables(activeIndex=0) {
	let requestBody = getBaseReqBody(store.getState());
	store.dispatch(fetchTimetables(requestBody, false, activeIndex));
}
export function addLastAddedCourse() {
	let state = store.getState();
	if (state.timetables.lastCourseAdded != null) {
		addOrRemoveCourse(state.timetables.lastCourseAdded)	
	}
}
/*
Attempts to add the course represented by newCourseId
to the user's roster. If a section is provided, that section is 
locked. Otherwise, no section is locked.
*/
export function addOrRemoveCourse(newCourseId, lockingSection = '') {
	let state = store.getState();
	if (state.timetables.isFetching) {
		return;
	}
	let removing = state.courseSections.objects[newCourseId] !== undefined && lockingSection === '';
	let reqBody = getBaseReqBody(state);
	if (state.optionalCourses.courses.some(c => c.id === newCourseId)) {
		let dispatch = store.dispatch;
		dispatch({
	  		type: "REMOVE_OPTIONAL_COURSE_BY_ID",
	  		courseId: newCourseId
	  	});
	  reqBody = getBaseReqBody(store.getState());
	}
	state = store.getState();
	if (removing) {
		let updatedCourseSections = Object.assign({}, state.courseSections.objects);
		delete updatedCourseSections[newCourseId]; // remove it from courseSections.objects
		reqBody.courseSections = updatedCourseSections;
		Object.assign(reqBody, {
    	'optionCourses': state.optionalCourses.courses.map(c => c.id),
    	'numOptionCourses': state.optionalCourses.numRequired,
    	'customSlots': state.customSlots
		})
	}
	else { // adding a course
		let dispatch = store.dispatch;
		dispatch({
			type: "UPDATE_LAST_COURSE_ADDED",
			course: newCourseId,
		});
		state = store.getState();
		Object.assign(reqBody, {
			updated_courses: [{
				'course_id': newCourseId,
        		'section_codes': [lockingSection]
        	}],
    	'optionCourses': state.optionalCourses.courses.map(c => c.id),
    	'numOptionCourses': state.optionalCourses.numRequired,
    	'customSlots': state.customSlots
    });
	}
	// user must be removing this course if it's already in roster,
	// and they're not trying to lock a new section).
	// otherwise, they're adding it
	store.dispatch(fetchTimetables(reqBody, removing));
	autoSave();
}

function fetchTimetables(requestBody, removing, newActive=0) {
	return (dispatch) => {
		let state = store.getState();
		// mark that we are now asynchronously requesting timetables
		dispatch(requestTimetables());
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(requestBody),
      		credentials: 'include'
    	})
		.then(response => { 
			if (response.status === 200) {
				return response.json();
			}
			else {
				if (browserSupportsLocalStorage()) {
					localStorage.clear();
				}
			}
		}) // TODO(rohan): maybe log somewhere if errors?
		.then(json => {
			if (removing || json.timetables.length > 0) {
				// mark that timetables and a new courseSections have been received
				dispatch(receiveTimetables(json.timetables));
				dispatch({
   					type: "RECEIVE_COURSE_SECTIONS",
    				courseSections: json.new_c_to_s,
  				});
  				if (newActive > 0){
	  				dispatch({
	  					type: "CHANGE_ACTIVE_TIMETABLE",
	  					newActive,
	  				})
  				}
				// save new courseSections and timetable active index to cache
				saveLocalCourseSections(json.new_c_to_s);
				saveLocalActiveIndex(newActive);
			}
			else { // user wasn't removing (i.e. was adding a course/section), but we got no timetables back
				// course added by the user resulted in a conflict, so no timetables
				// were received
				dispatch(alertConflict());
			}
			return json;
		})
		.then(json => {
			if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
				dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
		});

		// save preferences when timetables are loaded, so that we know cached preferences 
		// are always "up-to-date" (correspond to last loaded timetable).
		// same for the semester
		saveLocalPreferences(requestBody.preferences);
		if (localStorage.semester !== state.semesterIndex) {
			saveLocalSemester(state.semesterIndex);
		}		
	}
}

export function addCustomSlot(timeStart, timeEnd, day, preview, id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "ADD_CUSTOM_SLOT",
		newCustomSlot: {
			time_start: timeStart, // match backend slot attribute names
			time_end: timeEnd,
			name: "New Custom Event", // default name for custom slot
			day,
			id,
			preview,
		}
	})
}

export function updateCustomSlot(newValues, id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "UPDATE_CUSTOM_SLOT",
		newValues,
		id,
	})
}

export function removeCustomSlot(id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "REMOVE_CUSTOM_SLOT",
		id,
	})
}

export function addOrRemoveOptionalCourse(course) {
	return (dispatch) => {
		let removing = store.getState().optionalCourses.courses.some(c => c.id === course.id);
		if (store.getState().timetables.isFetching) {
			return;
		}
		dispatch({
	  		type: "ADD_REMOVE_OPTIONAL_COURSE",
	  		newCourse: course
	  	});
	  	let state = store.getState(); // the above dispatched action changes the state
	  	let reqBody = getBaseReqBody(state);
	  	let { optionalCourses } = state;

	  	let optionCourses = optionalCourses.courses.map(c => c.id);

		Object.assign(reqBody, {
        	optionCourses,
        	numOptionCourses: state.optionalCourses.numRequired
        });
		store.dispatch(fetchTimetables(reqBody, removing));
	}
}
