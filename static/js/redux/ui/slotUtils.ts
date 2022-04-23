import { Timetable } from "../constants/commonTypes";
import { HALF_HOUR_HEIGHT } from "../constants/constants";

export function convertToHalfHours(time: string) {
  const start = parseInt(time.split(":")[0], 10);
  return time.split(":")[1] === "30" ? start * 2 + 1 : start * 2;
}

export function convertToMinutes(time: string) {
  const start = parseInt(time.split(":")[0], 10);
  const end = parseInt(time.split(":")[1], 10);
  return start * 60 + end;
}

function convertMinutesToStr(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins < 10 ? `0${mins}` : mins}`;
}

function convertHalfHoursToStr(halfHours: number) {
  const numHours = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${numHours}:30` : `${numHours}:00`;
}

export function getNewSlotValues(
  timeStart: string,
  timeEnd: string,
  newStartHour: number,
  day: string
) {
  const duration = convertToMinutes(timeEnd) - convertToMinutes(timeStart);
  const newEndMinutes = newStartHour * 30 + duration;

  return {
    time_start: convertHalfHoursToStr(newStartHour),
    time_end: convertMinutesToStr(newEndMinutes),
    day,
  };
}

export function onCustomSlotUpdateDrop(props: any, monitor: any) {
  // move it to current location on drop
  const { timeStart, timeEnd, id } = monitor.getItem();

  // @ts-ignore
  const slotTop = $(`#${props.id}`).offset().top;
  // number half hours from slot start
  const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);

  const newStartHour = convertToHalfHours(props.time_start) + n;
  const newValues = getNewSlotValues(timeStart, timeEnd, newStartHour, props.day);
  props.updateCustomSlot(newValues, id);
}

export function onCustomSlotCreateDrop(props: any, monitor: any) {
  // move it to current location on drop
  let { timeStart } = monitor.getItem();
  const { id } = monitor.getItem();

  // @ts-ignore get the time that the mouse dropped on
  const slotTop = $(`#${props.id}`).offset().top;
  const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);
  let timeEnd = convertHalfHoursToStr(convertToHalfHours(props.time_start) + n);

  if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
    [timeStart, timeEnd] = [timeEnd, timeStart];
  }
  props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
}

let lastPreview: number = null;
export function onCustomSlotCreateDrag(props: any, monitor: any) {
  let { timeStart } = monitor.getItem();
  const { id } = monitor.getItem();

  // @ts-ignore get the time that the mouse dropped on
  const slotTop = $(`#${props.id}`).offset().top;
  const n = Math.floor((monitor.getClientOffset().y - slotTop) / HALF_HOUR_HEIGHT);
  if (n === lastPreview) {
    return;
  }
  let timeEnd = convertHalfHoursToStr(convertToHalfHours(props.time_start) + n);
  if (convertToHalfHours(timeStart) > convertToHalfHours(timeEnd)) {
    [timeStart, timeEnd] = [timeEnd, timeStart];
  }
  lastPreview = n;
  props.updateCustomSlot({ time_start: timeStart, time_end: timeEnd }, id);
}

export function canDropCustomSlot(props: any, monitor: any) {
  const { day } = monitor.getItem();
  return day === props.day;
}

export const isOfferingInTimetable = (timetable: Timetable, offeringId: number) => {
  let inTimetable = false;
  timetable.slots.forEach((currentSlot) => {
    if (currentSlot.offerings.indexOf(offeringId) !== -1) {
      inTimetable = true;
    }
  });
  return inTimetable;
};
