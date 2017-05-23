import React from 'react';
import ClickOutHandler from 'react-onclickout';
import COLOUR_DATA from '../constants/colours';
import { getCourseShareLink } from '../helpers/timetable_helpers';

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
            className="ms-friend" key={i}
            style={{ backgroundImage: 'url(/static/img/blank.jpg)' }}
          />);
      }
    } else {
      friendCircles = this.props.classmates && this.props.classmates.classmates ?
        this.props.classmates.classmates.map(c =>
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
    const profDisp = this.props.professors == null ? null : <h3>{ prof }</h3>;
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              link={getCourseShareLink(this.props.course.code)}
              onClickOut={this.hideShareLink}
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
  course: React.PropTypes.shape({
    is_waitlist_only: false,
  }),
  classmates: null,
  professors: null,
  slots: null,
  removeCourse: null,
};

MasterSlot.propTypes = {
  colourIndex: React.PropTypes.number.isRequired,
  inModal: React.PropTypes.bool,
  fakeFriends: React.PropTypes.number,
  course: React.PropTypes.shape({
    id: React.PropTypes.number.isRequired,
    num_credits: React.PropTypes.number.isRequired,
    code: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    is_waitlist_only: React.PropTypes.bool,
    slots: React.PropTypes.arrayOf(React.PropTypes.shape({
      is_section_filled: React.PropTypes.bool.isRequired,
    })),
  }).isRequired,
  professors: React.PropTypes.arrayOf(React.PropTypes.string),
  classmates: React.PropTypes.shape({
    classmates: React.PropTypes.arrayOf(React.PropTypes.shape({
      img_url: React.PropTypes.string,
    })),
  }),
  hideCloseButton: React.PropTypes.bool,
  onTimetable: React.PropTypes.bool.isRequired,
  fetchCourseInfo: React.PropTypes.func.isRequired,
  removeCourse: React.PropTypes.func,
};

export const ShareLink = ({ link, onClickOut }) => (
  <ClickOutHandler onClickOut={onClickOut}>
    <div className="share-course-link-wrapper">
      <div className="tip-border" />
      <div className="tip" />
      <input
        className="share-course-link" size={link.length} value={link}
        onClick={e => e.stopPropagation()}
        readOnly
      />
    </div>
  </ClickOutHandler>
);

ShareLink.propTypes = {
  link: React.PropTypes.string.isRequired,
  onClickOut: React.PropTypes.func.isRequired,
};

export default MasterSlot;
