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
// TODO: need to configure this possibly?

import React, { useState, useEffect } from "react";

const ThemeChanger = () => {
  const [themeState, setThemeState] = useState(false);

  const handleChange = () => {
    setThemeState(!themeState);
    if (themeState) {
      localStorage.setItem("Theme", "dark");
      document.body.classList.add("dark-mode");
    } else {
      localStorage.setItem("Theme", "light");
      document.body.classList.remove("dark-mode");
    }
  };
  useEffect(() => {
    const getTheme = localStorage.getItem("Theme");
    if (getTheme === "dark") return document.body.classList.add("dark-mode");
  });
  return (
    <div>
      <button onClick={handleChange}>{themeState ? "Light Mode" : "Dark Mode"}</button>
    </div>
  );
};

export default ThemeChanger;
