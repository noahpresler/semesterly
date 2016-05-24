import { store } from '../init.jsx';
import deparam from '../../deparam.js';

export function getTimetableShareLink() {
	let state = store.getState();
	let courseSections = state.courseSections.objects;	
	let url = window.location.hostname + "/share/" + $.param(courseSections);
	return url;
}

export function getCourseShareLink(code) {
	let semester = store.getState().semester;
	return window.location.hostname + "/course/" + code + "/" + semester;
}
