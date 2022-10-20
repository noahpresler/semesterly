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
import DayCalendarContainer from "./containers/day_calendar_container";
import CalendarContainer from "./containers/calendar_container";
import AlertBox from "./alert_box";
import ConflictAlert from "./alerts/conflict_alert";
import DeleteTimetableAlert from "./alerts/delete_timetable_alert";
import TimetableExistsAlertContainer from "./alerts/timetable_exists_alert_container";
import ChangeSemesterAlertContainer from "./alerts/change_semester_alert_container";
import NewTimetableAlertContainer from "./alerts/new_timetable_alert_container";
import EnableNotificationsAlertContainer from "./alerts/enable_notifications_alert_container";
import FriendsInClassAlertContainer from "./alerts/friends_in_class_alert_container";
import TopBar from "./TopBar";
import SignupModalContainer from "./containers/modals/signup_modal_container";
import TutModalContainer from "./containers/modals/tut_modal_container";
import PeerModalContainer from "./containers/modals/peer_modal_container";
import SaveCalendarModalContainer from "./containers/modals/save_calendar_modal_container";
import UserAcquisitionModal from "./modals/user_acquisition_modal";
import TermsOfServiceModalContainer from "./containers/terms_of_service_modal_container";
import TermsOfServiceBannerContainer from "./containers/terms_of_service_banner_container";
import UserSettingsModal from "./modals/user_settings_modal";
import CustomEventModal from "./modals/custom_event_modal";
import AdvancedSearchModal from "./modals/AdvancedSearchModal";
import { useAppDispatch, useAppSelector } from "../hooks";
import { getActiveTimetableCourses } from "../state";
import NewsModal from "./modals/NewsModal";
import { newsModalActions } from "../state/slices/newsModalSlice";
import SideBar from "./SideBar";
import CompareTimetableSideBar from "./CompareTimetableSidebar";

const Semesterly = () => {
  const dispatch = useAppDispatch();

  const dataLastUpdated = useAppSelector((state) => state.school.dataLastUpdated);
  const alertChangeSemester = useAppSelector(
    (state) => state.alerts.alertChangeSemester
  );
  const alertConflict = useAppSelector((state) => state.alerts.alertConflict);
  const alertEnableNotifications = useAppSelector(
    (state) => state.alerts.alertEnableNotifications
  );

  const alertDeleteTimetable = useAppSelector(
    (state) => state.alerts.alertDeleteTimetable
  );

  const activeTTLength = useAppSelector(
    (state) => getActiveTimetableCourses(state).length
  );
  const alertFacebookFriends = useAppSelector((state) =>
    Boolean(
      state.alerts.alertFacebookFriends &&
        state.userInfo.data.FacebookSignedUp &&
        (!state.userInfo.data.social_courses || state.alerts.facebookAlertIsOn) &&
        !state.userInfo.overrideShow &&
        state.alerts.mostFriendsCount >= 2 &&
        activeTTLength >= 1
    )
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

  useEffect(() => {
    if (alertEnableNotifications) {
      alertBoxRef.current?.show(<EnableNotificationsAlertContainer />, {
        type: "info",
        time: 12000,
        additionalClass: "notification-alert",
        icon: <div className="enable-notifications-alert-icon" />,
      });
    }
  }, []);

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
    } else if (alertEnableNotifications) {
      showAlert(<EnableNotificationsAlertContainer />, "info", 12000);
    } else if (alertFacebookFriends) {
      alertBoxRef.current?.show(<FriendsInClassAlertContainer />, {
        type: "info",
        time: 25000,
        additionalClass: "friends-in-class-alert-container",
        icon: <div className="friends-in-class-alert-icon" />,
      });
    } else {
      alertBoxRef.current?.removeAll();
    }
  }, [
    alertConflict,
    alertDeleteTimetable,
    alertTimetableExists,
    alertChangeSemester,
    alertNewTimetable,
    alertEnableNotifications,
    alertFacebookFriends,
  ]);

  const toLocalDate = () => {
    // DataLastUpdated Input example-  2021-05-02 14:42 UTC
    // Params: How the backend sends a timestamp
    // dateString: of the form yyyy-mm-dd hh:mm
    const dateString = dataLastUpdated.toString().slice(0, -4); // exclude UTC

    if (!dateString || dateString.length === 0) return "";

    // Convert given datetime to local datetime of user
    // in form yyyy-mm-dd hh:mm TZ (Timezone full name)
    return new Date(dateString).toString();
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

  return (
    <div className="page-wrapper">
      <NewsModal />
      <TopBar />
      <UserSettingsModal />
      <AdvancedSearchModal />
      <SignupModalContainer />
      <TutModalContainer />
      <PeerModalContainer />
      <SaveCalendarModalContainer />
      <CustomEventModal />
      <UserAcquisitionModal />
      <TermsOfServiceModalContainer />
      <TermsOfServiceBannerContainer />
      <AlertBox ref={alertBoxRef} />
      <div className="all-cols">
        <div className={mainbarClassName}>
          {cal}
          <footer className="footer navbar no-print">
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
              <li className="footer-button">
                <div
                  className="fb-like"
                  data-href="https://www.facebook.com/semesterly/"
                  data-layout="button_count"
                  data-action="like"
                  data-show-faces="true"
                  data-share="false"
                />
              </li>
            </ul>
          </footer>
        </div>
        {isComparingTimetables ? <CompareTimetableSideBar /> : <SideBar />}
      </div>
    </div>
  );
};

export default Semesterly;
