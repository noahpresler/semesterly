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

import React, { useState, useEffect, ReactElement, useRef } from "react";
import { withErrorBoundary } from "react-error-boundary";
import DayCalendarContainer from "./containers/day_calendar_container";
import CalendarContainer from "./containers/calendar_container";
import AlertBox from "./alert_box";
import ConflictAlert from "./alerts/conflict_alert";
import DeleteTimetableAlert from "./alerts/delete_timetable_alert";
import TimetableExistsAlertContainer from "./alerts/timetable_exists_alert_container";
import ChangeSemesterAlertContainer from "./alerts/change_semester_alert_container";
import NewTimetableAlertContainer from "./alerts/new_timetable_alert_container";
import TopBar from "./TopBar";
import SignupModal from "./modals/SignupModal";
import TutorialModal from "./modals/TutorialModal";
import PeerModal from "./modals/PeerModal";
import SaveCalendarModal from "./modals/SaveCalendarModal";
import UserAcquisitionModal from "./modals/UserAcquisitionModal";
import TermsOfServiceModal from "./modals/TermsOfServiceModal";
import TermsOfServiceBannerContainer from "./containers/terms_of_service_banner_container";
import UserSettingsModal from "./modals/UserSettingsModal";
import CustomEventModal from "./modals/CustomEventModal";
import AdvancedSearchModal from "./modals/AdvancedSearchModal";
import { useAppDispatch, useAppSelector } from "../hooks";
import NewsModal from "./modals/NewsModal";
import { newsModalActions } from "../state/slices/newsModalSlice";
import SideBar from "./SideBar";
import CompareTimetableSideBar from "./CompareTimetableSidebar";
import { selectTheme } from "../state/slices/themeSlice";
import FallBack from "./FallBack";
import { reportUIError } from "../util";

/**
 * This component is the high level container for the entire app. It contains all of the
 * modals, renders the top bar, side bar, timetable, displays links at the bottom of
 * the timetable, and handles the state of alerts.
 */
const Semesterly = () => {
  const dispatch = useAppDispatch();

  const dataLastUpdated = useAppSelector((state) => state.school.dataLastUpdated);
  const alertChangeSemester = useAppSelector(
    (state) => state.alerts.alertChangeSemester
  );
  const alertConflict = useAppSelector((state) => state.alerts.alertConflict);
  const alertDeleteTimetable = useAppSelector(
    (state) => state.alerts.alertDeleteTimetable
  );

  const alertNewTimetable = useAppSelector((state) => state.alerts.alertNewTimetable);
  const alertTimetableExists = useAppSelector(
    (state) => state.alerts.alertTimetableExists
  );

  const isComparingTimetables = useAppSelector(
    (state) => state.compareTimetable.isComparing
  );

  const mql = window.matchMedia("(orientation: portrait)");
  const [orientation, setOrientation] = useState(
    !mql.matches ? "landscape" : "portrait"
  );

  const alertBoxRef = useRef<AlertBox>(null);

  const updateOrientation = () => {
    if (window.matchMedia("(orientation: portrait)").matches) {
      setOrientation("portrait");
    }
    if (window.matchMedia("(orientation: landscape)").matches) {
      setOrientation("landscape");
    }
  };

  window.addEventListener("orientationchange", () => {
    updateOrientation();
  });

  window.addEventListener("resize", () => {
    // @ts-ignore
    if (!$(".search-bar__input-wrapper input").is(":focus")) {
      updateOrientation();
    }
  });

  const showAlert = (alert: ReactElement, type: string, delay = 5000) => {
    alertBoxRef.current?.show(alert, {
      type,
      time: delay,
    });
  };

  useEffect(() => {
    if (alertConflict) {
      showAlert(<ConflictAlert />, "info", 10000);
    } else if (alertDeleteTimetable) {
      showAlert(<DeleteTimetableAlert />, "info", 10000);
    } else if (alertTimetableExists) {
      showAlert(<TimetableExistsAlertContainer />, "info", 10000);
    } else if (alertChangeSemester) {
      showAlert(<ChangeSemesterAlertContainer />, "info", 15000);
    } else if (alertNewTimetable) {
      showAlert(<NewTimetableAlertContainer />, "info", 12000);
    } else {
      alertBoxRef.current?.removeAll();
    }
  }, [
    alertConflict,
    alertDeleteTimetable,
    alertTimetableExists,
    alertChangeSemester,
    alertNewTimetable,
  ]);

  const toLocalDate = () => {
    // DataLastUpdated Input example-  2021-05-02 14:42 UTC
    // Params: How the backend sends a timestamp
    // dateString: of the form yyyy-mm-dd hh:mm
    const dateString = dataLastUpdated.toString().slice(0, -4); // exclude UTC

    if (!dateString || dateString.length === 0) return "";

    // Convert given datetime to local datetime of user
    // in form (month) dd, yyyy

    const curDate: Date = new Date(dateString);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let dayEnding: String;
    const curDay = curDate.getDay();
    if (curDay >= 11 && curDay <= 13) {
      dayEnding = "th";
    }

    switch (curDay % 10) {
      case 1:
        dayEnding = "st";
        break;
      case 2:
        dayEnding = "nd";
        break;
      case 3:
        dayEnding = "rd";
        break;
      default:
        dayEnding = "th";
    }

    const monthIndex: number = curDate.getMonth();

    return `${
      months[monthIndex]
    } ${curDate.getUTCDate()}${dayEnding}, ${curDate.getFullYear()}`;
  };

  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const cal =
    mobile && window.innerWidth < 767 && orientation === "portrait" ? (
      <DayCalendarContainer />
    ) : (
      <CalendarContainer />
    );

  const mainbarClassName = `main-bar${
    isComparingTimetables ? "-compare-timetable" : ""
  }`;

  const theme = useAppSelector(selectTheme);

  return (
    <div className="page-wrapper">
      <NewsModal />
      <TopBar />
      <UserSettingsModal />
      <AdvancedSearchModal />
      <SignupModal />
      <TutorialModal />
      <PeerModal />
      <SaveCalendarModal />
      <CustomEventModal />
      <UserAcquisitionModal />
      <TermsOfServiceModal />
      <TermsOfServiceBannerContainer />
      <AlertBox ref={alertBoxRef} theme={theme.name} />
      <div className="all-cols">
        <div className={mainbarClassName}>
          {cal}
          <footer className="timetable-footer navbar no-print">
            <p className="data-last-updated no-print">
              Data last updated:{" "}
              {dataLastUpdated && dataLastUpdated.length && dataLastUpdated !== "null"
                ? toLocalDate()
                : null}
            </p>
            <ul className="nav nav-pills no-print">
              <li className="footer-button" role="presentation">
                <a
                  target="_blank"
                  rel="no-refresh"
                  onClick={() => dispatch(newsModalActions.showNewsModal())}
                >
                  News
                </a>
              </li>
              <li className="footer-button" role="presentation">
                <a href="/termsofservice">Terms</a>
              </li>
              <li className="footer-button" role="presentation">
                <a href="/privacypolicy">Privacy</a>
              </li>
              <li className="footer-button" role="presentation">
                <a href="mailto:semesterly@jhu.edu?Subject=Semesterly">Contact us</a>
              </li>
              <li className="footer-button" role="presentation">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/jhuopensource/semesterly/issues/new/choose"
                >
                  Feedback
                </a>
              </li>
              <li className="footer-button" role="presentation">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://discord.gg/HmnwdbehBh"
                >
                  Discord
                </a>
              </li>
              <li className="footer-button" role="presentation">
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://www.facebook.com/semesterly/"
                >
                  Facebook
                </a>
              </li>
              <li className="footer-button" role="presentation">
                <a
                  className="footer-button--github"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/jhuopensource/semesterly"
                >
                  <i className="fa fa-github" />
                  Follow
                </a>
              </li>
            </ul>
          </footer>
        </div>
        {isComparingTimetables ? <CompareTimetableSideBar /> : <SideBar />}
      </div>
    </div>
  );
};

const SemesterlyWithErrorBoundary = withErrorBoundary(Semesterly, {
  FallbackComponent: FallBack,
  onError(error, info) {
    const { componentStack } = info;
    const { name, message, stack } = error;
    const errorInfo = {
      name,
      message,
      stack,
      componentStack,
    };
    reportUIError(errorInfo);
  },
});

export default SemesterlyWithErrorBoundary;
