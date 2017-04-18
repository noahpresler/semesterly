import { getSemester } from '../init';

export function getCourseShareLink(code) {
  return `${window.location.href.split('/')[2]}/course/${encodeURIComponent(code)}/${getSemester()}`;
}

export function getCourseShareLinkFromModal(code) {
  return `/course/${encodeURIComponent(code)}/${getSemester()}`;
}
