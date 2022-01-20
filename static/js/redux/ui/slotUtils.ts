export function convertToHalfHours(time: string) {
  const start = parseInt(time.split(":")[0], 10);
  return time.split(":")[1] === "30" ? start * 2 + 1 : start * 2;
}

export function convertHalfHoursToStr(halfHours: number) {
  const numHours = Math.floor(halfHours / 2);
  return halfHours % 2 ? `${numHours}:30` : `${numHours}:00`;
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
