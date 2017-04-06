import {getSemester, store} from "../init.jsx";

export function getTimetableShareLink() {
    let state = store.getState();
    let courseSections = state.courseSections.objects;
    let url = window.location.href.split("/")[2] + "/share/" + $.param(courseSections);
    return url;
}

export function getCourseShareLink(code) {
    return window.location.href.split("/")[2] + "/course/" + encodeURIComponent(code) + "/" + getSemester();
}

export function getCourseShareLinkFromModal(code) {
    return "/course/" + encodeURIComponent(code) + "/" + getSemester();
}
