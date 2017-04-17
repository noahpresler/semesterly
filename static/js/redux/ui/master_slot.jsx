import React from 'react';
import COLOUR_DATA from '../constants/colours';
import { getCourseShareLink } from '../helpers/timetable_helpers';
import ClickOutHandler from 'react-onclickout';

class MasterSlot extends React.Component {
  constructor(props) {
    super(props);
    this.stopPropagation = this.stopPropagation.bind(this);
    this.onMasterSlotHover = this.onMasterSlotHover.bind(this);
    this.onMasterSlotUnhover = this.onMasterSlotUnhover.bind(this);
    this.updateColours = this.updateColours.bind(this);
    this.showShareLink = this.showShareLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
    this.hasOnlyWaitlistedSections = this.hasOnlyWaitlistedSections.bind(this);
    this.state = { shareLinkShown: false };
  }

  stopPropagation(callback, event) {
    event.stopPropagation();
    callback();
  }

  onMasterSlotHover() {
    this.setState({ hovered: true });
    this.updateColours(COLOUR_DATA[this.props.colourIndex].highlight);
  }

  onMasterSlotUnhover() {
    this.setState({ hovered: false });
    this.updateColours(COLOUR_DATA[this.props.colourIndex].background);
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
  }

  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }

  hasOnlyWaitlistedSections() {
    if (this.props.course.slots.length > 0) {
      const slots = this.props.course.slots;
      for (let slot in slots) {
        
      }
    }
    return false;
  }

  render() {
    let friendCircles = null;
    if (this.props.fakeFriends) {
      friendCircles = new Array(this.props.fakeFriends);
      for (let i = 0; i < this.props.fakeFriends; i++) {
        friendCircles[i] =
          (<div
            className="ms-friend" key={i}
            style={{ backgroundImage: 'url(/static/img/blank.jpg)' }}
          />);
      }
    } else {
      friendCircles = this.props.classmates && this.props.classmates.classmates ? this.props.classmates.classmates.map(c =>
        <div
          className="ms-friend" key={c.img_url}
          style={{ backgroundImage: `url(${c.img_url})` }}
        />) : null;
    }

    if ((this.props.classmates && this.props.classmates.classmates && friendCircles.length > 4)
            || (this.props.fakeFriends && this.props.fakeFriends > 4)) {
      const plusMore = `${friendCircles.length - 3}+`;
      friendCircles = [<div
        className="ms-friend"
        key={4}
      >{plusMore}</div>].concat(friendCircles.slice(0, 3));
    }
    let masterSlotClass = `master-slot slot-${this.props.course.id}`;
    const validProfs = this.props.professors ? this.props.professors.filter(p => p) : false;
    const prof = !validProfs || validProfs.length === 0 || validProfs[0] === '' ? 'Professor Unlisted' : validProfs.join(', ');
    masterSlotClass = this.props.onTimetable ? masterSlotClass : `${masterSlotClass} optional`;
    const numCredits = this.props.course.num_credits;
    let creditsDisplay = numCredits === 1 ? ' credit' : ' credits';
    creditsDisplay = numCredits + creditsDisplay;
    const prof_disp = this.props.professors == null ? null : <h3>{ prof }</h3>;
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              link={getCourseShareLink(this.props.course.code)}
              onClickOut={this.hideShareLink}
            />) :
            null;
    const waitlistOnlyFlag = this.hasOnlyWaitlistedSections() ?
      <span
        className="ms-flag"
        style={{backgroundColor: COLOUR_DATA[this.props.colourIndex].border}}
      >Waitlist Only</span> : null;
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
        { prof_disp }
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

export const ShareLink = ({ link, onClickOut }) => (
  <ClickOutHandler onClickOut={onClickOut}>
    <div id="share-course-link-wrapper">
      <div className="tip-border" />
      <div className="tip" />
      <input
        id="share-course-link" size={link.length} value={link}
        onClick={e => e.stopPropagation()}
        readOnly
      />
    </div>
  </ClickOutHandler>
);

export default MasterSlot;
