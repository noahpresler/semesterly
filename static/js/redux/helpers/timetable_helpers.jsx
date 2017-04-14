import { getSemester, store } from '../init';

export function getTimetableShareLink() {
  const state = store.getState();
  const courseSections = state.courseSections.objects;
  const url = `${window.location.href.split('/')[2]}/share/${$.param(courseSections)}`;
  return url;
}

export function getCourseShareLink(code) {
  return `${window.location.href.split('/')[2]}/course/${encodeURIComponent(code)}/${getSemester()}`;
}

export function getCourseShareLinkFromModal(code) {
  return `/course/${encodeURIComponent(code)}/${getSemester()}`;
}
