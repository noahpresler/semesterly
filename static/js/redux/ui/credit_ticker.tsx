/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import React, { useEffect, useState } from "react";
import { Course, Event } from "../constants/commonTypes";
import { useAppSelector } from "../hooks";
import { getActiveTimetableCourses } from "../state";

const CreditTicker = () => {
  const [displayedCredits, setDisplayedCredits] = useState(0);

  const timetableCourses = useAppSelector((state) => getActiveTimetableCourses(state));
  const events = useAppSelector((state) => state.customEvents.events);

  const credits =
    timetableCourses.reduce(
      (acc: number, course: Course) => acc + course.num_credits,
      0
    ) +
    events.reduce((acc: number, event: Event) => acc + parseFloat(event.credits), 0);

  useEffect(() => {
    setTimeout(() => {
      if (parseFloat(credits.toFixed(2)) > parseFloat(displayedCredits.toFixed(2))) {
        setDisplayedCredits((previous) => previous + 0.25);
      } else if (
        parseFloat(credits.toFixed(2)) < parseFloat(displayedCredits.toFixed(2))
      ) {
        setDisplayedCredits((previous) => previous - 0.25);
      }
    }, 8);
  }, [credits, displayedCredits]);

  return (
    <div className="col-1-3 sb-credits">
      <h3>{Math.abs(displayedCredits).toFixed(2)}</h3>
      <h4>credits</h4>
    </div>
  );
};

export default CreditTicker;
