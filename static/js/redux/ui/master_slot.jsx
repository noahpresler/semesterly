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

import PropTypes from 'prop-types';
import React from 'react';
import ClickOutHandler from 'react-onclickout';
import uniq from 'lodash/uniq';
import Clipboard from 'clipboard';
import COLOUR_DATA from '../constants/colours';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class MasterSlot extends React.Component {
  constructor(props) {
    super(props);
    this.onMasterSlotHover = this.onMasterSlotHover.bind(this);
    this.onMasterSlotUnhover = this.onMasterSlotUnhover.bind(this);
    this.updateColours = this.updateColours.bind(this);
    this.showShareLink = this.showShareLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
    this.state = { shareLinkShown: false };
  }
  onMasterSlotHover() {
    this.setState({ hovered: true });
    this.updateColours(COLOUR_DATA[this.props.colourIndex].highlight);
  }
  onMasterSlotUnhover() {
    this.setState({ hovered: false });
    this.updateColours(COLOUR_DATA[this.props.colourIndex].background);
  }
  stopPropagation(callback, event) {
    event.stopPropagation();
    this.onMasterSlotUnhover();
    callback();
  }
  updateColours(colour) {
        // no updating when hovering over a masterslot in the course modal (i.e. related course)
    if (this.props.inModal) {
      return;
    }
        // update sibling slot colours (i.e. the slots for the same course)
    $(`.slot-${this.props.course.id}`)
            .css('background-color', colour);
  }
  showShareLink() {
    this.setState({ shareLinkShown: true });
    const idEventTarget = `#clipboard-btn-course-${this.props.course.id}`;
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on('success', () => {
      $(idEventTarget).addClass('clipboardSuccess').text('Copied!');
    });
  }
  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }
  render() {
    let friendCircles = null;
    if (this.props.fakeFriends) {
      friendCircles = new Array(this.props.fakeFriends);
      for (let i = 0; i < this.props.fakeFriends; i++) {
        friendCircles[i] =
          (<div
            className="ms-friend"
            key={i}
            style={{ backgroundImage: 'url(/static/img/blank.jpg)' }}
          />);
      }
    } else {
      friendCircles = this.props.classmates.current.map(c => (
        <div
          className="ms-friend"
          key={c.img_url}
          style={{ backgroundImage: `url(${c.img_url})` }}
        />
      ));
    }

    if ((this.props.classmates.current.length > 0 && friendCircles.length > 4)
            || (this.props.fakeFriends && this.props.fakeFriends > 4)) {
      const plusMore = `${friendCircles.length - 3}+`;
      friendCircles = [<div
        className="ms-friend"
        key={4}
      >{plusMore}</div>].concat(friendCircles.slice(0, 3));
    }
    let masterSlotClass = `master-slot slot-${this.props.course.id}`;
    const validProfs = this.props.professors ? uniq(this.props.professors.filter(p => p)) : false;
    const prof = !validProfs || validProfs.length === 0 || validProfs[0] === '' ? 'Professor Unlisted' : validProfs.join(', ');
    masterSlotClass = this.props.onTimetable ? masterSlotClass : `${masterSlotClass} optional`;
    const numCredits = this.props.course.num_credits;
    let creditsDisplay = numCredits === 1 ? ' credit' : ' credits';
    creditsDisplay = numCredits + creditsDisplay;
    const profDisp = this.props.professors === null ? null : <h3>{ prof }</h3>;
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              uniqueId={`course-${this.props.course.id}`}
              link={this.props.getShareLink(this.props.course.code)}
              onClickOut={this.hideShareLink}
              type="Course"
            />) :
            null;
    let waitlistOnlyFlag = null;
    if (this.props.course.slots !== undefined) {
      if (this.props.course.slots.length > 0) {
        if (this.props.course.slots[0].is_section_filled === true) {
          let flagValue = '';
          if (this.props.course.is_waitlist_only === true) {
            flagValue = 'Waitlist Only';
          } else {
            flagValue = 'Section Filled';
          }
          waitlistOnlyFlag = (<span
            className="ms-flag"
            style={{ backgroundColor: COLOUR_DATA[this.props.colourIndex].border }}
          >{flagValue}</span>);
        }
      }
    }
    return (<div
      className={masterSlotClass}
      onMouseEnter={this.onMasterSlotHover}
      onMouseLeave={this.onMasterSlotUnhover}
      style={{ backgroundColor: COLOUR_DATA[this.props.colourIndex].background }}
      onClick={this.props.fetchCourseInfo}
    >
      <div
        className="slot-bar"
        style={{ backgroundColor: COLOUR_DATA[this.props.colourIndex].border }}
      />
      <div className="master-slot-content">
        <h3>
          <span>{ this.props.course.code }</span>
          {waitlistOnlyFlag}
        </h3>
        <h3>{ this.props.course.name }</h3>
        { profDisp }
        <h3>{ creditsDisplay }</h3>
      </div>
      <div className="master-slot-actions">
        <i
          className="fa fa-share-alt"
          onClick={event => this.stopPropagation(this.showShareLink, event)}
        />
        {shareLink}
        {
          !this.props.hideCloseButton ?
            <i
              className="fa fa-times"
              onClick={event => this.stopPropagation(this.props.removeCourse, event)}
            /> : null
        }
      </div>
      <div className="master-slot-friends">
        {friendCircles}
      </div>
    </div>);
  }
}

MasterSlot.defaultProps = {
  inModal: false,
  fakeFriends: 0,
  hideCloseButton: false,
  course: PropTypes.shape({
    is_waitlist_only: false,
  }),
  professors: null,
  slots: null,
  removeCourse: null,
  classmates: { current: [], past: [] },
};

MasterSlot.propTypes = {
  colourIndex: PropTypes.number.isRequired,
  inModal: PropTypes.bool,
  fakeFriends: PropTypes.number,
  course: PropTypes.shape({
    id: PropTypes.number.isRequired,
    num_credits: PropTypes.number.isRequired,
    code: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    is_waitlist_only: PropTypes.bool,
    slots: PropTypes.arrayOf(PropTypes.shape({
      is_section_filled: PropTypes.bool.isRequired,
    })),
  }).isRequired,
  professors: PropTypes.arrayOf(PropTypes.string),
  classmates: SemesterlyPropTypes.classmates,
  hideCloseButton: PropTypes.bool,
  onTimetable: PropTypes.bool.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  removeCourse: PropTypes.func,
  getShareLink: PropTypes.func.isRequired,
};

export const ShareLink = ({ link, onClickOut, uniqueId, type }) => (
  <ClickOutHandler onClickOut={onClickOut}>
    <div className="share-course-link-wrapper" onClick={e => e.stopPropagation()}>
      <h5>Share {type}</h5>
      <h6>Copy the link below and send it to a friend/advisor!</h6>
      <div className="tip-border" />
      <div className="tip" />
      <input
        className="share-course-link"
        size={link.length}
        value={link}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.target.select()}
        readOnly
      />
      <div className="clipboardBtn" id={`clipboard-btn-${uniqueId}`} data-clipboard-text={link}>
        Copy to Clipboard
      </div>
    </div>
  </ClickOutHandler>
);

ShareLink.propTypes = {
  link: PropTypes.string.isRequired,
  onClickOut: PropTypes.func.isRequired,
  uniqueId: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

export default MasterSlot;

