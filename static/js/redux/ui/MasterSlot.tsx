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

import PropTypes from "prop-types";
import React, { useState, useEffect, MouseEventHandler, MouseEvent } from "react";
// @ts-ignore outdated package
import ClickOutHandler from "react-onclickout";
import uniq from "lodash/uniq";
import Clipboard from "clipboard";
import { CopyToClipboard } from "react-copy-to-clipboard";
import COLOUR_DATA from "../constants/colours";
import { Classmate, DenormalizedCourse } from "../constants/commonTypes";

type MasterSlotProps = {
  colourIndex: number;
  inModal?: boolean;
  fakeFriends: number;
  course: DenormalizedCourse;
  professors: string[];
  classmates: {
    current: Classmate[];
    past: Classmate[];
  };
  hideCloseButton?: boolean;
  onTimetable: boolean;
  fetchCourseInfo: MouseEventHandler<HTMLDivElement>;
  removeCourse?: Function;
  getShareLink: Function;
};

const MasterSlot = (props: MasterSlotProps) => {
  const [shareLinkShown, setShareLinkShown] = useState(false);

  const updateColours = (colour: string) => {
    // no updating when hovering over a masterslot in the course modal (i.e. related course)
    if (props.inModal) {
      return;
    }
    // update sibling slot colours (i.e. the slots for the same course)
    $(`.slot-${props.course.id}-${props.colourIndex}`).css("background-color", colour);
  };

  const onMasterSlotHover = () => {
    updateColours(COLOUR_DATA[props.colourIndex].highlight);
  };
  const onMasterSlotUnhover = () => {
    updateColours(COLOUR_DATA[props.colourIndex].background);
  };
  const stopPropagation = (callback: Function, event: MouseEvent) => {
    event.stopPropagation();
    onMasterSlotUnhover();
    callback();
  };

  const showShareLink = () => {
    setShareLinkShown(true);
    const idEventTarget = `#clipboard-btn-course-${props.course.id}`;
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on("success", () => {
      $(idEventTarget).addClass("clipboardSuccess").text("Copied!");
    });
  };
  const hideShareLink = () => {
    setShareLinkShown(false);
  };

  let friendCircles = null;
  if (props.fakeFriends) {
    friendCircles = new Array(props.fakeFriends);
    for (let i = 0; i < props.fakeFriends; i++) {
      friendCircles[i] = (
        <div
          className="ms-friend"
          key={i}
          style={{ backgroundImage: "url(/static/img/blank.jpg)" }}
        />
      );
    }
  } else {
    friendCircles = props.classmates.current.map((c) => (
      <div
        className="ms-friend"
        key={c.img_url}
        style={{ backgroundImage: `url(${c.img_url})` }}
      />
    ));
  }

  if (
    (props.classmates.current.length > 0 && friendCircles.length > 4) ||
    (props.fakeFriends && props.fakeFriends > 4)
  ) {
    const plusMore = `${friendCircles.length - 3}+`;
    friendCircles = [
      <div className="ms-friend" key={4}>
        {plusMore}
      </div>,
    ].concat(friendCircles.slice(0, 3));
  }
  let masterSlotClass = `master-slot slot-${props.course.id}-${props.colourIndex}`;
  const validProfs = props.professors ? uniq(props.professors.filter((p) => p)) : false;
  const prof =
    !validProfs || validProfs.length === 0 || validProfs[0] === ""
      ? "Professor Unlisted"
      : validProfs.join(", ");
  masterSlotClass = props.onTimetable ? masterSlotClass : `${masterSlotClass} optional`;
  const numCredits = props.course.num_credits;
  let creditsDisplay = numCredits === 1 ? " credit" : " credits";
  creditsDisplay = numCredits + creditsDisplay;
  const profDisp = props.professors === null ? null : <h3>{prof}</h3>;
  const shareLink = shareLinkShown ? (
    // eslint-disable-next-line no-use-before-define
    <ShareLink
      link={props.getShareLink(props.course.code)}
      onClickOut={hideShareLink}
      type="Course"
    />
  ) : null;
  let waitlistOnlyFlag = null;
  if (props.course.slots !== undefined) {
    if (props.course.slots.length > 0) {
      if (props.course.slots[0].is_section_filled === true) {
        let flagValue = "";
        if (props.course.is_waitlist_only === true) {
          flagValue = "Waitlist Only";
        } else {
          flagValue = "Section Filled";
        }
        waitlistOnlyFlag = (
          <span
            className="ms-flag"
            style={{ backgroundColor: COLOUR_DATA[props.colourIndex].border }}
          >
            {flagValue}
          </span>
        );
      }
    }
  }
  return (
    <div
      className={masterSlotClass}
      onMouseEnter={onMasterSlotHover}
      onMouseLeave={onMasterSlotUnhover}
      style={{ backgroundColor: COLOUR_DATA[props.colourIndex].background }}
      onClick={props.fetchCourseInfo}
    >
      <div
        className="slot-bar"
        style={{ backgroundColor: COLOUR_DATA[props.colourIndex].border }}
      />
      <div className="master-slot-content">
        <h3>
          <span>{props.course.code}</span>
          {waitlistOnlyFlag}
        </h3>
        <h3>{props.course.name}</h3>
        {profDisp}
        <h3>{creditsDisplay}</h3>
      </div>
      <div className="master-slot-actions">
        <i
          className="fa fa-share-alt"
          onClick={(event) => stopPropagation(showShareLink, event)}
        />
        {shareLink}
        {!props.hideCloseButton ? (
          <i
            className="fa fa-times"
            onClick={(event) => stopPropagation(props.removeCourse, event)}
          />
        ) : null}
      </div>
      <div className="master-slot-friends">{friendCircles}</div>
    </div>
  );
};

MasterSlot.defaultProps = {
  inModal: false,
  fakeFriends: 0,
  hideCloseButton: false,
  course: PropTypes.shape<any>({
    is_waitlist_only: false,
  }),
  professors: null,
  slots: null,
  removeCourse: null,
  classmates: { current: [], past: [] },
};

type ShareLinkProps = {
  link: string;
  onClickOut: Function;
  type?: string;
};

export const ShareLink = ({ link, onClickOut, type }: ShareLinkProps) => {
  const [shareBtnText, setShareBtnText] = useState("Copy to Clipboard");
  useEffect(() => {
    if (shareBtnText === "Copied!") {
      setTimeout(() => setShareBtnText("Copy to Clipboard"), 2000);
    }
  }, [shareBtnText]);

  return (
    <ClickOutHandler onClickOut={onClickOut}>
      <div className="share-course-link-wrapper" onClick={(e) => e.stopPropagation()}>
        <h5>Share {type}</h5>
        <h6>Copy the link below and send it to a friend/advisor!</h6>
        <div className="tip-border" />
        <div className="tip" />
        <input
          className="share-course-link"
          size={link.length}
          value={location.host + link}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.target.select()}
          readOnly
        />
        <CopyToClipboard text={location.host + link}>
          <div className="clipboardBtn" onClick={() => setShareBtnText("Copied!")}>
            {shareBtnText}
          </div>
        </CopyToClipboard>
        {/* <div className="clipboardBtn" id={`clipboard-btn-${uniqueId}`} data-clipboard-text={link}>
          Copy to Clipboard
        </div> */}
      </div>
    </ClickOutHandler>
  );
};

export default MasterSlot;
