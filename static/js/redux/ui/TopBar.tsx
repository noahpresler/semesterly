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

import React, { useState, useEffect } from "react";
import { useAppSelector } from "../hooks";
import SearchBar from "./SearchBar";
import CourseModal from "./modals/CourseModal";
import TimetableLoaderContainer from "./containers/timetable_loader_container";
import SocialProfileContainer from "./containers/social_profile_container";
import { getCurrentSemester } from "../state";
import ThemeToggle from "./ThemeToggle";

const TopBar = () => {
  const userInfo = useAppSelector((state) => state.userInfo.data);
  const currentSemester = useAppSelector((state) => getCurrentSemester(state));
  const isComparing = useAppSelector((state) => state.compareTimetable.isComparing);
  const theme = useAppSelector((state) => state.theme.theme.name);

  const [sideBarCollapsed, setSideBarCollapsed] = useState("neutral");

  const mainBarSelector = isComparing ? ".main-bar-compare-timetable" : ".main-bar";
  const sideBarSelector = isComparing ? ".side-bar-compare-timetable" : ".side-bar";

  const expandSideBar = () => {
    $(`${mainBarSelector}, ${sideBarSelector}`)
      .removeClass("full-cal")
      .addClass("less-cal");
  };

  const collapseSideBar = () => {
    $(`${mainBarSelector}, ${sideBarSelector}`)
      .removeClass("less-cal")
      .addClass("full-cal");
  };

  const toggleSideBar = () => {
    if (sideBarCollapsed === "neutral") {
      const bodyWidth = $(window).width();
      if (bodyWidth > 999) {
        setSideBarCollapsed("closed");
      } else {
        setSideBarCollapsed("open");
      }
      return;
    }
    if (sideBarCollapsed === "open") {
      setSideBarCollapsed("closed");
    } else {
      setSideBarCollapsed("open");
    }
  };

  useEffect(() => {
    if (sideBarCollapsed === "closed") {
      collapseSideBar();
    } else {
      expandSideBar();
    }
  }, [sideBarCollapsed]);

  const renderUserForPrint = () => (
    <div className="print">
      <img alt="Profile" className="usr-pic print" src={userInfo.img_url} />
      <div className="print-name-major print">
        <span className="print-name print">{`${userInfo.userFirstName} ${userInfo.userLastName}`}</span>
        <span className="print-major print">
          {userInfo.major}
          {userInfo.class_year ? `| Class of ${userInfo.class_year}` : null} |
          {`${currentSemester.name} ${currentSemester.year}`}
        </span>
      </div>
    </div>
  );

  return (
    <div className="top-bar">
      <a href="https://semester.ly">
        {theme === "dark" ? 
          <img
            alt="logo"
            className="semesterly-logo no-print"
            src="/static/img/logo2.0-32x32-dark.png"
          />: 
          <img
            alt="logo"
            className="semesterly-logo no-print"
            src="/static/img/logo2.0-32x32.png"
          />}
      </a>
      <div className="semesterly-name no-print">Semester.ly</div>
      <div className="print-content print">
        {userInfo.isLoggedIn && userInfo.userFirstName ? renderUserForPrint() : null}
        <div className="name-logo print">
          <div className="semesterly-name-print print">Semester.ly</div>
          <img
            alt="print logo"
            className="semesterly-logo-print print"
            src="/static/img/logo2.0-32x32.png"
          />
        </div>
      </div>
      {!isComparing && <SearchBar />}
      <CourseModal />
      <SocialProfileContainer />
      <TimetableLoaderContainer />
      <ThemeToggle />
      <div className="navicon" onClick={toggleSideBar}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default TopBar;
