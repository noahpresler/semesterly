import { getSemester } from '../init';

export function getExamShareLink(hash) {
  return `${window.location.href.split('/')[2]}/exam/share/${encodeURIComponent(hash)}`;
}
