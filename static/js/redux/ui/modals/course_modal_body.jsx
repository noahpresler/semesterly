import PropTypes from 'prop-types';
import React from 'react';
import Reaction from '../reaction';
import REACTION_MAP from '../../constants/reactions';
import MasterSlot from '../master_slot';
import Textbook from '../textbook';
import COLOUR_DATA from '../../constants/colours';
import EvaluationList from '../evaluation_list';
import CourseModalSection from '../course_modal_section';
import SlotHoverTip from '../slot_hover_tip';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';

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
    if (sections === undefined) {
      return [];
    }

    return Object.keys(sections).sort().map((sec) => {
      const slots = sections[sec];
      const instructors = new Set();
      Array.prototype.forEach.call(slots, (s) => {
        if (!instructors.has(s.instructors)) {
          instructors.add(s.instructors);
        }
      });
      const instructString = Array.from(instructors).join(', ');
      let enrolled = 0;
      if (slots.length > 0) {
        enrolled = slots[0] ? slots[0].enrolment || 0 : 0;
      }
      return (<CourseModalSection
        key={sec}
        section={slots}
        secName={sec}
        instr={instructString}
        enrolled={enrolled}
        waitlist={slots[0].waitlist}
        size={slots[0].size}
        locked={this.props.isSectionLocked(this.props.data.id, sec)}
        isOnActiveTimetable={this.props.isSectionOnActiveTimetable(this.props.data.id, sec)}
        lockOrUnlock={() => this.props.addOrRemoveCourse(this.props.data.id, sec)}
        hoverSection={() => this.props.hoverSection(this.props.data, sec)}
        unHoverSection={this.props.unHoverSection}
        inRoster={this.props.inRoster}
      />);
    });
  }

  fetchCourseInfo(courseId) {
    if (this.props.fetchCourseInfo) {
      this.props.fetchCourseInfo(courseId);
    }
  }

  render() {
    if (this.props.isFetching) {
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
    const lecs = this.mapSectionsToSlots(this.props.lectureSections);
    const tuts = this.mapSectionsToSlots(this.props.tutorialSections);
    const pracs = this.mapSectionsToSlots(this.props.practicalSections);
    let lectureSections = null;
    let tutorialSections = null;
    let practicalSections = null;
    if (lecs.length > 0) {
      lectureSections = (<div>
        <h3 className="modal-module-header">Lecture Sections
                    <small>(Hover to see the section on your timetable)</small>
        </h3>
        {lecs}</div>);
    }
    if (tuts.length > 0) {
      tutorialSections =
        <div><h3 className="modal-module-header">Tutorial Sections</h3>{tuts}</div>;
    }
    if (pracs.length > 0) {
      practicalSections =
        <div><h3 className="modal-module-header">Lab/Practical Sections</h3>{pracs}</div>;
    }
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
    const evalInfo = this.props.data.eval_info;
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
        return <span className="textItem" key={`textItem${t}`}>{t}</span>;
      });
    const matchedCoursesPrerequisites = prerequisites === null
      ? null : prerequisites.match(courseRegex);
    const newPrerequisites = (prerequisites === '' || prerequisites === null) ? 'None' :
      prerequisites.split(courseRegex).map((t, i) => {
        if (matchedCoursesPrerequisites === null) {
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
    const areasDisplay =
            (<div className="modal-module areas">
              <h3 className="modal-module-header">{this.props.schoolSpecificInfo.areasName}</h3>
              <p>{ this.props.data.areas || 'None' }</p>
            </div>);
    const integrationDivStyle = {
      backgroundImage: 'url(/static/img/integrations/pilot.png)',
    };
    const academicSupportDisplay = integrationList.indexOf('Pilot') > -1 ?
            (<div className="modal-module academic-support">
              <h3 className="modal-module-header">Academic Support</h3>
              <li className="cf">
                <span className="integration-image" style={integrationDivStyle} />
                <h4>Pilot</h4>
                <a href="http://academicsupport.jhu.edu/pilot-learning/" target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
                <p>In the PILOT program, students are organized into study teams consisting of
                        6-10 members who meet
                        weekly to work problems together.</p>
              </li>
            </div>) : null;
    let friendCircles = (<div className="loading"><span className="img-icon"><div
      className="loader"
    /></span><p>
            loading...</p></div>);
    let hasTakenCircles = (<div className="loading"><span className="img-icon"><div
      className="loader"
    /></span><p>
            loading...</p></div>);
    if (!this.props.isFetchingClassmates && this.props.classmates.classmates !== undefined) {
      friendCircles = this.props.classmates && this.props.classmates.classmates.length > 0 ?
        this.props.classmates.classmates.map(c =>
          (<div className="friend" key={c.img_url}>
            <div className="ms-friend" style={{ backgroundImage: `url(${c.img_url})` }} />
            <p title={`${c.first_name} ${c.last_name}`}>{ `${c.first_name} ${c.last_name}` }</p>
          </div>)) : <p className="null">No Classmates Found</p>;

      hasTakenCircles = this.props.classmates && this.props.classmates.past_classmates.length > 0 ?
        this.props.classmates.past_classmates.map(c =>
          (<div className="friend" key={c.img_url}>
            <div className="ms-friend" style={{ backgroundImage: `url(${c.img_url})` }} />
            <p title={`${c.first_name} ${c.last_name}`}>{ `${c.first_name} ${c.last_name}` }</p>
          </div>)) : <p className="null">No Classmates Found</p>;
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
    const textbooksDisplay = !textbooks || textbooks.length === 0 ? null :
            (<div className="modal-module">
              <h3 className="modal-module-header">Textbooks</h3>
              <div className="modal-textbook-list">
                {
                    textbooks.map(t => <Textbook key={t.isbn} tb={t} />)
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
            { areasDisplay }
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
            {lectureSections}
            {tutorialSections}
            {practicalSections}
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
};

CourseModalBody.propTypes = {
  inRoster: PropTypes.bool.isRequired,
  popularityPercent: PropTypes.number,
  isLoggedIn: PropTypes.bool,
  hasSocial: PropTypes.bool,
  data: SemesterlyPropTypes.fullCourseDetails,
  addOrRemoveCourse: PropTypes.func.isRequired,
  react: PropTypes.func.isRequired,
  classmates: SemesterlyPropTypes.classmates.isRequired,
  hideModal: PropTypes.func.isRequired,
  openSignUpModal: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  isFetchingClassmates: PropTypes.bool.isRequired,
  isFetching: PropTypes.bool.isRequired,
  hoverSection: PropTypes.func.isRequired,
  unHoverSection: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  isSectionLocked: PropTypes.func.isRequired,
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  isSectionOnActiveTimetable: PropTypes.func.isRequired,
  lectureSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.section),
  }).isRequired,
  practicalSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.section),
  }),
  tutorialSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.section),
  }),
  schoolSpecificInfo: SemesterlyPropTypes.schoolSpecificInfo.isRequired,
  getShareLink: PropTypes.func.isRequired,
  getShareLinkFromModal: PropTypes.func.isRequired,
};

export default CourseModalBody;

