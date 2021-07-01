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
import isEmpty from 'lodash/isEmpty';
import flatMap from 'lodash/flatMap';
import Reaction from '../reaction';
import REACTION_MAP from '../../constants/reactions';
import MasterSlot from '../master_slot';
import Textbook from '../textbook';
import COLOUR_DATA from '../../constants/colours';
import EvaluationList from '../evaluation_list';
import CourseModalSection from '../course_modal_section';
import SlotHoverTip from '../slot_hover_tip';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';
import { getSectionTypeDisplayName, strPropertyCmp } from '../../util';

class CourseModalBody extends React.Component {
  constructor(props) {
    super(props);
    this.sendReact = this.sendReact.bind(this);
    this.launchSignupModal = this.launchSignupModal.bind(this);
    this.enableSocial = this.enableSocial.bind(this);
    this.fetchCourseInfo = this.fetchCourseInfo.bind(this);
    this.mobile_width = 767; // NOTE: should be static const (...ES7)
    this.state = {
      mobile: $(window).width() < this.mobile_width,
    };
  }

  componentWillMount() {
    window.addEventListener('resize', () => {
      if (this.state.mobile !== ($(window).width() < this.mobile_width)) {
        this.setState({
          mobile: $(window).width() < this.mobile_width,
        });
      }
    });
  }

  sendReact(cid, title) {
    if (this.props.isLoggedIn) {
      this.props.react(cid, title);
    } else {
      this.launchSignupModal();
    }
  }

  launchSignupModal() {
    this.props.hideModal();
    this.props.openSignUpModal();
  }

  enableSocial() {
    const newUserSettings = {
      social_courses: true,
      social_offerings: true,
      social_all: false,
    };
    const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings();
  }

  mapSectionsToSlots(sections) {
    return sections.sort(strPropertyCmp('meeting_section')).map(section => (
      <CourseModalSection
        key={this.props.id + section.meeting_section}
        secName={section.meeting_section}
        instr={section.instructors}
        enrolment={section.enrolment === -1 ? 0 : section.enrolment}
        waitlist={section.waitlist === -1 ? 0 : section.waitlist}
        size={section.size === -1 ? 0 : section.size}
        locked={this.props.isSectionLocked(this.props.data.id, section.meeting_section)}
        isOnActiveTimetable={
          this.props.isSectionOnActiveTimetable(this.props.data.id, section.id)
        }
        lockOrUnlock={() => this.props.addOrRemoveCourse(this.props.data.id,
          section.meeting_section)}
        hoverSection={() => this.props.hoverSection(this.props.data, section)}
        unHoverSection={this.props.unHoverSection}
        inRoster={this.props.inRoster}
      />),
    );
  }

  fetchCourseInfo(courseId) {
    if (this.props.fetchCourseInfo) {
      this.props.fetchCourseInfo(courseId);
    }
  }

  render() {
    if (this.props.isFetching || isEmpty(this.props.data)) {
      return (
        <div className="modal-body">
          <div className="cf">
            <span className="img-icon">
              <div className="loader" />
            </span>
          </div>
        </div>
      );
    }

    let shortCourseSection = '';
    const sectionType = Object.keys(this.props.sectionTypeToSections)[0];
    if (sectionType != null) {
      const offeringSample = this.props.sectionTypeToSections[sectionType][0].offering_set[0];
      if (offeringSample != null) {
        if (offeringSample.is_short_course) {
          shortCourseSection = (
            <div>
              <p>
                <p>
                  <img alt="Short Course" src="/static/img/short_course_icon_25x25.png" />:
                  This is a short term course. <br />
                </p>
                <p>
                  Dates offered:&nbsp;
                  <b>{offeringSample.date_start}</b>
                  <span> to </span>
                  <b>{offeringSample.date_end}</b>
                </p>
              </p>
            </div>
          );
        }
      }
    }

    const sectionGrid = Object.keys(this.props.sectionTypeToSections).sort().map((sType, i) => {
      const sectionTitle = `${getSectionTypeDisplayName(sType)} Sections`;
      const subTitle = i === 0 ? <small>(Hover to see the section on your timetable)</small> : null;
      return (
        <div key={sType}>
          <h3 className="modal-module-header"> {sectionTitle} {subTitle} </h3>
          {this.mapSectionsToSlots(this.props.sectionTypeToSections[sType])}
        </div>
      );
    });

    const { reactions, num_credits: numCredits } = this.props.data;
    // reactions.sort((r1, r2) => {return r1.count < r2.count});

    const cid = this.props.data.id;
    let totalReactions = reactions.map(r => r.count).reduce((x, y) => x + y, 0);
    if (totalReactions === 0) {
      totalReactions = 20;
    }
    const reactionsDisplay = Object.keys(REACTION_MAP).map((title) => {
      const reaction = reactions.find(r => r.title === title);
      if (reaction) {
        return (<Reaction
          key={title} selected={reaction.reacted} react={() => this.sendReact(cid, title)}
          emoji={title}
          count={reaction.count} total={totalReactions}
        />);
      }             // noone has reacted with this emoji yet
      return (<Reaction
        key={title} react={() => this.sendReact(cid, title)} emoji={title} count={0}
        total={totalReactions}
      />);
    });
    reactionsDisplay.sort((r1, r2) => r1.props.count < r2.props.count);

    const integrationList = this.props.data.integrations;
    const evalInfo = this.props.data.evals;
    const relatedCourses = this.props.data.related_courses;
    const { prerequisites, textbooks } = this.props.data;
    const maxColourIndex = COLOUR_DATA.length - 1;

    const similarCourses = relatedCourses.length === 0 ? null :
            (<div className="modal-module">
              <h3 className="modal-module-header">Students Also Take</h3>
              {relatedCourses.map((rc, i) => (<MasterSlot
                key={rc.id} course={rc}
                professors={null}
                colourIndex={Math.min(i, maxColourIndex)}
                onTimetable
                hideCloseButton
                inModal
                fetchCourseInfo={() => this.fetchCourseInfo(rc.id)}
                getShareLink={this.props.getShareLink}
              />))}
            </div>);
    const courseRegex = new RegExp(this.props.schoolSpecificInfo.courseRegex, 'g');
    const matchedCoursesDescription = this.props.data.description.match(courseRegex);
    const description = this.props.data.description === '' ? 'No description available' :
      this.props.data.description.split(courseRegex).map((t, i) => {
        if (matchedCoursesDescription === null) {
          return t;
        }
        if (matchedCoursesDescription.indexOf(t) !== -1 &&
        Object.keys(this.props.data.regexed_courses).indexOf(t) !== -1) {
          return (<SlotHoverTip
            key={t} num={i} code={t}
            name={this.props.data.regexed_courses[t]}
            getShareLinkFromModal={this.props.getShareLinkFromModal}
          />);
        }
        return <span className="textItem" key={`textItem${t.id}`}>{t}</span>;
      });
    const matchedCoursesPrerequisites = prerequisites === null
      ? null : prerequisites.match(courseRegex);
    const newPrerequisites = (prerequisites === '' || prerequisites === null) ? 'None' :
      prerequisites.split(courseRegex).map((t, i) => {
        if (matchedCoursesPrerequisites === null || matchedCoursesPrerequisites.indexOf(t) === -1) {
          return t;
        }
        if (matchedCoursesPrerequisites.indexOf(t) !== -1 &&
          Object.keys(this.props.data.regexed_courses).indexOf(t) !== -1) {
          return (<SlotHoverTip
            key={t} num={i} code={t}
            name={this.props.data.regexed_courses[t]}
            getShareLinkFromModal={this.props.getShareLinkFromModal}
          />);
        }
        return <span className="textItem" key={t}>{t}</span>;
      });
    const prerequisitesDisplay =
            (<div className="modal-module prerequisites">
              <h3 className="modal-module-header">Prerequisites</h3>
              <p>{ newPrerequisites }</p>
            </div>);
    const posTags = (this.props.data.pos && this.props.data.pos.length) ?
      (<div className="modal-module areas">
        <h3 className="modal-module-header">Program of Study Tags</h3>
        <p key={`${cid}-pos`}>{this.props.data.pos.join(', ')}</p>
      </div>) :
      (<div className="modal-module areas">
        <h3 className="modal-module-header">Program of Study Tags</h3>
        <p>None</p>
      </div>);
    const pilotLogoImg = {
      backgroundImage: 'url(/static/img/integrations/pilot.png)',
    };
    const pilotDisplay = integrationList.indexOf('Pilot') > -1 ?
      (<li className="cf">
        <span className="integration-image" style={pilotLogoImg} />
        <h4>Pilot</h4>
        <a href="http://academicsupport.jhu.edu/pilot-learning/" target="_blank" rel="noopener noreferrer">
          Learn More
        </a>
        <p>In the PILOT program, students are organized into study teams consisting of
          6-10 members who meet
          weekly to work problems together.</p>
      </li>) : null;
    const learningDenLogoImg = {
      backgroundImage: 'url(/static/img/integrations/learningDen_books.png)',
    };
    const learningDenDisplay = integrationList.indexOf('LearningDen') > -1 ?
      (<li className="cf">
        <span className="integration-image" style={learningDenLogoImg} />
        <h4>Learning Den</h4>
        <a
          href="https://advising.jhu.edu/tutoring-mentoring/learning-den-tutoring-services/" target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
        <p>The Learning Den is a peer-to-peer, small group tutoring program that
          helps students to improve their understanding of course materials,
          and prepare for exams.</p>
      </li>) : null;
    const academicSupportDisplay = integrationList.indexOf('LearningDen') > -1 || integrationList.indexOf('Pilot') > -1 ?
      (<div className="modal-module academic-support">
        <h3 className="modal-module-header">Academic Support</h3>
        { pilotDisplay }
        { learningDenDisplay }
      </div>) : null;
    let friendCircles = (<div className="loading"><span className="img-icon"><div
      className="loader"
    /></span><p>
            loading...</p></div>);
    let hasTakenCircles = (<div className="loading"><span className="img-icon"><div
      className="loader"
    /></span><p>
            loading...</p></div>);
    if (!this.props.isFetchingClassmates) {
      friendCircles = this.props.classmates.current.length > 0 ?
        this.props.classmates.current.map(c =>
          (<div className="friend" key={c.img_url}>
            <div className="ms-friend" style={{ backgroundImage: `url(${c.img_url})` }} />
            <p title={`${c.first_name} ${c.last_name}`}>{ `${c.first_name} ${c.last_name}` }</p>
          </div>)) :
        <p className="null">No Classmates Found</p>;

      hasTakenCircles = this.props.classmates.past.length > 0 ?
        this.props.classmates.past.map(c =>
          (<div className="friend" key={c.img_url}>
            <div className="ms-friend" style={{ backgroundImage: `url(${c.img_url})` }} />
            <p title={`${c.first_name} ${c.last_name}`}>{ `${c.first_name} ${c.last_name}` }</p>
          </div>)) :
        <p className="null">No Classmates Found</p>;
    }
    let friendDisplay = (<div className="modal-module friends">
      <h3 className="modal-module-header">Friends In This Course</h3>
      <div id="friends-wrapper">
        <div className="friends__inner">
          { friendCircles }
        </div>
      </div>
    </div>);
    let hasTakenDisplay = (<div className="modal-module friends">
      <h3 className="modal-module-header">Friends Who Have Taken This Course</h3>
      <div id="friends-wrapper">
        <div className="friends__inner">
          { hasTakenCircles }
        </div>
      </div>
    </div>);
    if (!this.props.isLoggedIn || !this.props.hasSocial) {
      const conversionText = !this.props.isLoggedIn ?
        'Create an account with Facebook and see which of your Facebook friends are taking or ' +
        'have already taken this class!' :
        'Enable the friend feature to find out who which of your Facebook friends are taking or ' +
        'have already taken this class!';
      const conversionLink = !this.props.isLoggedIn ? (
        <a onClick={this.launchSignupModal}><i
          className="fa fa-facebook"
          aria-hidden="true"
        />Link
              Facebook</a>) :
          (<a onClick={this.enableSocial}><i
            className="fa fa-facebook" aria-hidden="true"
          />Enable Facebook
          </a>
      );
      hasTakenDisplay = null;
      friendDisplay = (<div className="modal-module friends">
        <h3 className="modal-module-header">Friends In This Course or Who Have Taken This
                    Course</h3>
        <div id="friends-wrapper">
          <div className="friends__inner">
            <div className="conversion">
              <div className="conversion-image" />
              <p>{ conversionText }</p>
              { conversionLink }
            </div>
          </div>
        </div>
      </div>);
    }

    const textbooksArray = flatMap(Object.keys(textbooks), sectionCode => textbooks[sectionCode]);
    const textbooksDisplay = !textbooksArray || textbooksArray.length === 0 ? null :
            (<div className="modal-module">
              <h3 className="modal-module-header">Textbooks</h3>
              <div className="modal-textbook-list">
                {
                    textbooksArray.map(t => <Textbook key={t.isbn} tb={t} />)
                }
              </div>
            </div>);

    const creditsSuffix = numCredits === 1 ? ' credit' : ' credits';
    const avgRating = evalInfo.reduce((sum, e) => sum + parseFloat(e.score), 0) / evalInfo.length;
    const showCapacityAttention = this.props.popularityPercent > 60;
    const attentioncapacityTracker = (
      <div className="capacity">
        <div className="capacity__attention">
          <div className="attention__tag">
            <div className="attention__clock-icon">
              <i className="fa fa-clock-o" />
            </div>
            <span>Waitlist Likely</span>
          </div>
          <div className="attention__text">
            <span>
              Over <span className="highlight">{parseInt(this.props.popularityPercent, 10)}%</span>
              of seats added by students on Semesterly!
            </span>
          </div>
        </div>
      </div>
        );
    const capacityTracker = (
      <div className="capacity">
        <div className="capacity__tracker-text">
          <span>{parseInt(this.props.popularityPercent, 10)}% of Seats Added on Semesterly</span>
        </div>
      </div>
        );
    return (
      <div className="modal-body">
        <div className="cf">
          <div className="col-3-16">
            <div className="credits">
              <h3>{ numCredits }</h3>
              <h4>{ creditsSuffix }</h4>
            </div>
            <div className="rating-module">
              <h4>Average Course Rating</h4>
              <div className="sub-rating-wrapper">
                <div className="star-ratings-sprite">
                  <span
                    style={{ width: `${(100 * avgRating) / 5}%` }}
                    className="rating"
                  />
                </div>
              </div>
            </div>
            { !showCapacityAttention &&
                        capacityTracker
                        }
            { showCapacityAttention && this.state.mobile &&
                        attentioncapacityTracker
                        }
            { prerequisitesDisplay }
            { posTags }
            { academicSupportDisplay }
            { friendDisplay }
            { hasTakenDisplay }
          </div>

          <div className="col-8-16">
            { showCapacityAttention && !this.state.mobile &&
                        attentioncapacityTracker
                        }
            <h3 className="modal-module-header">Reactions</h3>
            <p>Check out your classmate&apos;s reactions – click an emoji to add your own
                            opinion!</p>
            <div className="reactions-wrapper">
              <div className="reactions">
                {reactionsDisplay}
              </div>
            </div>
            <div>
              <h3 className="modal-module-header">Course Description</h3>
              <p>{description}</p>
              { shortCourseSection}
            </div>
            <div className="modal-module">
              <h3 className="modal-module-header">Course Evaluations</h3>
              <EvaluationList evalInfo={evalInfo} />
            </div>
            {textbooksDisplay}

          </div>
          <div
            id="modal-section-lists"
            className="col-5-16 cf"
          >
            {sectionGrid}
            {similarCourses}
          </div>
        </div>
      </div>
    );
  }
}

CourseModalBody.defaultProps = {
  data: {},
  hasSocial: false,
  practicalSections: {},
  tutorialSections: {},
  popularityPercent: 0,
  inRoster: false,
  isLoggedIn: false,
  id: null,
};

CourseModalBody.propTypes = {
  // props provided by container
  id: PropTypes.string,
  schoolSpecificInfo: SemesterlyPropTypes.schoolSpecificInfo.isRequired,
  isFetchingClassmates: PropTypes.bool.isRequired,
  classmates: SemesterlyPropTypes.classmates.isRequired,
  sectionTypeToSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.denormalizedSection),
  }).isRequired,
  popularityPercent: PropTypes.number,
  isLoggedIn: PropTypes.bool,
  hasSocial: PropTypes.bool,
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  isSectionOnActiveTimetable: PropTypes.func.isRequired,
  isSectionLocked: PropTypes.func.isRequired,

  openSignUpModal: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  hoverSection: PropTypes.func.isRequired,
  react: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,

  // props provided by parent
  inRoster: PropTypes.bool.isRequired,
  data: PropTypes.oneOfType([SemesterlyPropTypes.normalizedCourse, PropTypes.shape({})]),
  addOrRemoveCourse: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  unHoverSection: PropTypes.func.isRequired,
  getShareLink: PropTypes.func.isRequired,
  getShareLinkFromModal: PropTypes.func.isRequired,
};

export default CourseModalBody;

