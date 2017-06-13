export function getCourseShareLink(code, semester) {
  return `${window.location.href.split('/')[2]}/course/${encodeURIComponent(code)}/${semester.name}/${semester.year}`;
}

export function getCourseShareLinkFromModal(code, semester) {
  return `/course/${encodeURIComponent(code)}/${semester.name}/${semester.year}`;
}
