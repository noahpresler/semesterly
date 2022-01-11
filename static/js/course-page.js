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

// eslint-disable-next-line no-unused-vars
document.addEventListener("DOMContentLoaded", (event) => {
  // ssection enrolment
  const sections = document.getElementsByClassName("section");
  for (let i = 0; i < sections.length; ++i) {
    const s = sections[i];
    const waitlist = s.getAttribute("data-waitlist");
    const size = s.getAttribute("data-size");
    const enrolled = s.getAttribute("data-enrolment");
    const h = s.getElementsByClassName("enrollment")[0];
    if (waitlist === "" || size === "" || enrolled === "") {
      h.innerHTML = "No enrolment info";
    } else {
      const left = size - enrolled;
      let txt;
      if (size < 0) {
        s.className += "";
        txt = "No enrollment info";
      } else if (waitlist > 0) {
        s.className += " red";
        txt = `<span>${waitlist} waitlist</span> / ${size} seats`;
      } else if (left === 0) {
        s.className += " red";
        txt = `<span>${left} open</span> / ${size} seats`;
      } else if (left < size / 10) {
        s.className += " yellow";
        txt = `<span>${left} open</span> / ${size} seats`;
      } else {
        s.className += " green";
        txt = `<span>${left} open</span> / ${size} seats`;
      }
      h.innerHTML = txt;
    }
  }

  // Course ratings
  const ratings = document.getElementsByClassName("rating-wrapper");
  for (let i = 0; i < ratings.length; ++i) {
    const r = ratings[i];
    const score = r.getAttribute("data-score");
    const percent = `${((score / 5) * 100).toString()}%`;
    const h = r.getElementsByClassName("rating")[0];
    h.style.width = percent;
  }
});
