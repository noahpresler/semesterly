import { store } from '../init.jsx';

export function getTimetableShareLink() {
	let state = store.getState();
	let courseSections = state.courseSections.objects;	
	let url = window.location.href.split("/")[2] + "/share/" + $.param(courseSections);
	return url;
}

export function getCourseShareLink(code) {
	let semester = store.getState().semester;
	return window.location.href.split("/")[2] + "/course/" + encodeURIComponent(code) + "/" + semester;
}

export function getCourseShareLinkFromModal(code) {
	let semester = store.getState().semester;
	return "/course/" + encodeURIComponent(code) + "/" + semester;
}
