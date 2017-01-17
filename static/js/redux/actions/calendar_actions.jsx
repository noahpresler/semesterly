import { getRequestShareTimetableLinkEndpoint, getAddTTtoGCalEndpoint } from '../constants.jsx';
import { getActiveTimetable } from './user_actions.jsx';
import { store } from '../init.jsx';
import ical from 'ical-generator';
import { getCourseShareLink} from '../helpers/timetable_helpers.jsx';
import FileSaver from 'browser-filesaver';

let DAY_MAP = {
		'M' : 'mo',
		'T' : 'tu',
		'W' : 'we',
		'R' : 'th',
		'F' : 'fr',
		'S' : 'sa',
		'U' : 'su'
	};
let DAY_LIST = ['U','M','T','W','R','F','S'];

function getNextDayOfWeek(date, dayOfWeek) {
	dayOfWeek = DAY_LIST.indexOf(dayOfWeek);
    var resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

function receiveShareLink(dispatch, shareLink) {
	dispatch({
		type: "RECEIVE_SHARE_TIMETABLE_LINK",
		shareLink,
	});
}

export function fetchShareTimetableLink() {
	return (dispatch) => {
		let state = store.getState();
		let semester = state.semester;
		let timetableState = state.timetables;
		let { shareLink, shareLinkValid } = state.calendar;
		dispatch({
			type: "REQUEST_SHARE_TIMETABLE_LINK"
		});
		if (shareLinkValid) { 
			receiveShareLink(store.dispatch, shareLink); 
			return;
		}
		fetch(getRequestShareTimetableLinkEndpoint(), {
			method: 'POST',
			body: JSON.stringify({
				timetable: getActiveTimetable(timetableState),
				semester,
			}),
			credentials: 'include',
		})
		.then(response => response.json())
		.then(ref => {
			receiveShareLink(store.dispatch, 
				window.location.hostname + "/share/" + ref.link);
		})

	}
}

export function addTTtoGCal() {
	return (dispatch) => {
		let state = store.getState();
		let timetableState = state.timetables;
		if (!state.saveCalendarModal.isUploading && !state.saveCalendarModal.hasUploaded) {
			dispatch({type: "UPLOAD_CALENDAR"});
			fetch(getAddTTtoGCalEndpoint(), {
				method: 'POST',
				body: JSON.stringify({
					timetable: getActiveTimetable(timetableState),
				}),
				credentials: 'include',
			})
			.then(response => response.json())
			.then(json => {
				dispatch({type: "CALENDAR_UPLOADED"});
			})
		}
	}
}

export function createiCalfromTimetable(active) {
	return (dispatch) => {
		let state = store.getState();
		if (!state.saveCalendarModal.isDownloading && !state.saveCalendarModal.hasDownloaded) {
			dispatch({type: "DOWNLOAD_CALENDAR"});
			let cal = ical({domain: 'https://semester.ly', name: 'My Semester Schedule'});
			let tt = getActiveTimetable(state.timetables);

			//TODO - MUST BE REFACTORED AFTER CODED IN TO CONFIG
			let sem_start = new Date()
			let sem_end = new Date()
			if (state.semester == 'fall') {
				//ignore year, year is set to current year
				sem_start = new Date('August 30 2017 00:00:00');
				sem_end = new Date('December 20 2017 00:00:00');
			} else {
				//ignore year, year is set to current year
				sem_start = new Date('January 30 2017 00:00:00');
				sem_end = new Date('May 20 2017 00:00:00');
			}
			sem_start.setYear(new Date().getFullYear());
			sem_end.setYear(new Date().getFullYear());

			for (let c_idx=0; c_idx < tt.courses.length; c_idx++) {
				for (let slot_idx=0; slot_idx < tt.courses[c_idx].slots.length; slot_idx++) {

					let course = tt.courses[c_idx];
					let slot = course.slots[slot_idx];
					let instructors = slot.instructors && slot.instructors.length > 0 ? 'Taught by: ' + slot.instructors + '\n' : ''
					let start = getNextDayOfWeek(sem_start,slot.day);
					let end = getNextDayOfWeek(sem_start,slot.day);
					let until = getNextDayOfWeek(sem_end,slot.day);

					let times = slot.time_start.split(':');
					start.setHours(parseInt(times[0]),parseInt(times[1]));
					times = slot.time_end.split(':');
					end.setHours(parseInt(times[0]),parseInt(times[1]));
					let description = course.description ?  course.description : '';

					let event = cal.createEvent({
					    start: start,
					    end: end,
					    summary: slot.name + " " + slot.code + slot.meeting_section,
					    description: slot.code + slot.meeting_section + '\n' + instructors + description,
					    location: slot.location,
					    url: getCourseShareLink(slot.code)
					});

					event.repeating({
					    freq: 'WEEKLY',
					    byDay: DAY_MAP[slot.day],
					    until: until,
					});

				}
			}
			let file = new Blob([cal.toString()], {type: "data:text/calendar;charset=utf8,"});
			FileSaver.saveAs(file, "my_semester.ics");
			dispatch({type: "CALENDAR_DOWNLOADED"});
		}
	}
}