import React from 'react';
import Modal from 'boron/WaveModal';
import COLOUR_DATA from '../constants/colours';
import { ShareLink } from './master_slot';
import getExamShareLink from '../helpers/exam_helpers';
import * as PropTypes from '../constants/propTypes';

const InSlot = (props) => {
  let displayTime = (props.time) ? <h3 className="time">{ props.time }</h3> : null;
  const displayCode = (props.code) ? <h3 className="code">{ props.code }</h3> : null;

  if (displayTime) {
    const time = (props.time.split(' '))[1];
    let beginTime = (time.split('-'))[0];
    beginTime += beginTime > 8 && beginTime < 12 ? 'am' : 'pm';
    let endTime = (time.split('-'))[1];
    endTime += 'pm';
    displayTime = <h3 className="time">{ `${beginTime}-${endTime}` }</h3>;
  }

  return (
    <div
      className={`master-slot${(props.numberOfFinalsAtThisTime > 1) ? ' conflict' : ''}`}
      style={{
        backgroundColor: COLOUR_DATA[props.color].background,
        width: `${(1 / props.numberOfFinalsAtThisTime) * 100}%`,
      }}
    >
      <div
        className="slot-bar"
        style={{ backgroundColor: COLOUR_DATA[props.color].border }}
      />
      <div className="master-slot-content">
        { displayTime }
        { displayCode }
        <h3 className="name">{ props.name }</h3>
      </div>
    </div>
  );
};

InSlot.defaultProps = {
  code: null,
  color: null,
  time: '',
  numberOfFinalsAtThisTime: null,
};

InSlot.propTypes = {
  code: React.PropTypes.oneOfType([React.PropTypes.number,
    React.PropTypes.string]),
  time: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  color: React.PropTypes.oneOfType([React.PropTypes.number,
    React.PropTypes.string]),
  numberOfFinalsAtThisTime: React.PropTypes.number,
};

export default class FinalExamsModal extends React.Component {

  static generateWeekHeaders(dates) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mobileDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];// ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const html = dates.map((date, index) => <h3 key={date}><span
      className="day"
    >{($(window).width() > 766) ? days[index] : mobileDays[index]}</span><span
      className="date"
    >{date}</span></h3>);
    return (<div id="final-exam-calender-days" className="cf">
      { html }
    </div>);
  }

  static findDaysOfWeek(d, days) {
    let i;
    const week = [];
    let firstDay = d - (d.getDay() * 24 * 60 * 60 * 1000);
    for (i = 0; i < days.length; i++) {
      week.push(`${(new Date(firstDay)).getMonth() + 1}/${(new Date(firstDay)).getDate()}`);
      firstDay += (24 * 60 * 60 * 1000);
    }
    return week;
  }

  constructor(props) {
    super(props);
    this.hide = this.hide.bind(this);
    this.noTimeFinals = [];
    this.finalsToRender = {};
    const mql = window.matchMedia('(orientation: portrait)');
    this.state = {
      orientation: !mql.matches ? 'landscape' : 'portrait',
      shareLinkShown: false,
    };
    this.updateOrientation = this.updateOrientation.bind(this);
    this.toggleShareLink = this.toggleShareLink.bind(this);
  }

  componentWillMount() {
    window.addEventListener('orientationchange', () => {
      this.updateOrientation();
    });
    window.addEventListener('resize', () => {
      if (!$('.search-bar__input-wrapper input').is(':focus')) {
        this.updateOrientation();
      }
    });
  }

  componentDidMount() {
    if (this.props.isVisible) {
      this.props.logFinalExamView();
      if (!this.props.isShare) {
        this.props.fetchFinalExamSchedule();
      }
      this.noTimeFinals = [];
      this.finalsToRender = {};
      this.modal.show();
      history.replaceState({}, 'Semester.ly', '/final_exams');
    }
  }

  componentWillUpdate() {
    this.noTimeFinals = [];
    this.finalsToRender = {};
  }

  componentDidUpdate(nextProps) {
    if (this.props.isVisible && !nextProps.isVisible) {
      this.hide();
    }
    if (this.props.courses !== nextProps.courses && this.props.isVisible && !this.props.isShare) {
      this.props.fetchFinalExamSchedule();
    }
    if (this.props.isVisible && !nextProps.isVisible) {
      if (!this.props.isShare) {
        this.props.fetchFinalExamSchedule();
      }
      this.props.logFinalExamView();
      this.noTimeFinals = [];
      this.finalsToRender = {};
      this.modal.show();
      history.replaceState({}, 'Semester.ly', '/final_exams');
    }
  }

  toggleShareLink() {
    this.setState({ shareLinkShown: !this.state.shareLinkShown });
  }

  updateOrientation() {
    let orientation = 'portrait';
    if (window.matchMedia('(orientation: portrait)').matches) {
      orientation = 'portrait';
    }
    if (window.matchMedia('(orientation: landscape)').matches) {
      orientation = 'landscape';
    }
    if (orientation !== this.state.orientation) {
      this.setState({ orientation });
    }
  }

  hide() {
    this.modal.hide();
    history.replaceState({}, 'Semester.ly', '/');
    if (this.props.isVisible) {
      this.props.hideFinalExamsModal();
    }
  }

  findNextFinalToRender(finalStack) {
    let minDate = Infinity;
    this.noTimeFinals = [];
    const finals = finalStack || this.finalsToRender;
    Object.keys(finals).forEach((course) => {
      const m = finals[course].split(' ')[0].split('/')['0'];
      const d = finals[course].split(' ')[0].split('/')['1'];
      minDate = (new Date(2017, Number(m - 1), Number(d)) < minDate) ?
        new Date(2017, Number(m - 1), Number(d)) : minDate;
      if (finals[course].includes('Exam time not found')) {
        this.noTimeFinals.push(course);
        delete finals[course];
      }
    });
    return minDate;
  }

  finalListHTML() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const finalExamDays = [];
    const finalStack = $.extend(true, {}, this.finalsToRender);
    while (Object.keys(finalStack).length > 0) {
      const day = this.findNextFinalToRender(finalStack);
      const html = [];
      const conflictTime = {};
      Object.keys(finalStack).forEach((final) => {
        if (finalStack[final].includes(`${day.getMonth() + 1}/${day.getDate()}`)) {
          conflictTime[finalStack[final].split(' ')[1]] =
            (conflictTime[finalStack[final].split(' ')[1]] === undefined) ? [final] :
              $.merge(conflictTime[finalStack[final].split(' ')[1]], [final]);
        }
      });
      Object.keys(conflictTime).forEach((timeFrame) => {
        Object.keys(conflictTime[timeFrame]).forEach((final) => {
          html.push(<InSlot
            name={this.props.courseDetails[conflictTime[timeFrame][final]].name}
            color={this.props.courseToColourIndex[conflictTime[timeFrame][final]]}
            time={finalStack[conflictTime[timeFrame][final]]}
            key={conflictTime[timeFrame][final]}
            numberOfFinalsAtThisTime={conflictTime[timeFrame].length}
          />);
          delete finalStack[conflictTime[timeFrame][final]];
        });
      });
      finalExamDays.push(<div key={day} className="final-exam-day">
        <h3 className="modal-module-header">{ `${days[day.getDay()]} ${day.getMonth() + 1}/${day.getDate()}` }</h3>
        { html }
      </div>);
    }
    return finalExamDays;
  }

  loadFinalsToDivs(mobile) {
    const days = ['N', 'M', 'T', 'W', 'R', 'F', 'S'];
    this.finalsToRender = $.extend(true, {}, this.props.finalExamSchedule);
    let day = this.findNextFinalToRender();

    const unscheduledFinalCtn = this.noTimeFinals.length > 0 ?
      (<div id="final-exam-sidebar">
        <h3 className="modal-module-header">Schedule Unavailable</h3>
        {this.noTimeFinals.map(final => <InSlot
          code={this.props.courseDetails[final].code}
          name={this.props.courseDetails[final].name}
          color={this.props.courseToColourIndex[final]}
          key={`final${this.props.courseDetails[final].code}`}
        />)}
      </div>) : null;

    const finalsWeeks = [];
    const finalList = this.finalListHTML();
    while (Object.keys(this.finalsToRender).length > 0) {
      finalsWeeks.push(<div key={day}>{ this.renderWeek(day, days) }</div>);
      day = new Date(day.getTime() + (7 * 24 * 60 * 60 * 1000));
    }

    const disclaimer = (<p className="final-exam-disclaimer">
      Some courses do not have finals, check with your syllabus or instructor to confirm.
      <a
        href="http://web.jhu.edu/registrar/forms-pdfs/Final_Exam_Schedule_Spring_2017.pdf"
        target="_blank" rel="noopener noreferrer"
      >
        <i className="fa fa-link" aria-hidden="true" />
        Link to registar&apos;s final exams schedule
      </a>
    </p>);
    return (mobile) ?
      <div id="final-exam-calendar-ctn" className="mobile">
        { disclaimer }
        <div id="final-exam-main">
          { finalList }
        </div>
        { unscheduledFinalCtn }
      </div> :
      <div id="final-exam-calendar-ctn">
        <div
          id="final-exam-main"
          className={(unscheduledFinalCtn === null) ? 'main-full' : ''}
        >
          { finalsWeeks }
        </div>
        { unscheduledFinalCtn }
        { disclaimer }
      </div>;
  }

  renderWeek(day, days) {
    const finalExamDays = [];
    const daysOfWeek = FinalExamsModal.findDaysOfWeek(day, days);
    const weekHeadersHtml = FinalExamsModal.generateWeekHeaders(daysOfWeek);
    Object.keys(daysOfWeek).forEach((d) => {
      const html = [];
      const conflictTime = {};
      Object.keys(this.finalsToRender).forEach((final) => {
        if (this.finalsToRender[final].includes(daysOfWeek[d])) {
          conflictTime[this.finalsToRender[final].split(' ')[1]] =
            (conflictTime[this.finalsToRender[final].split(' ')[1]] === undefined) ? [final] :
              $.merge(conflictTime[this.finalsToRender[final].split(' ')[1]], [final]);
        }
      });
      Object.keys(conflictTime).forEach((timeFrame) => {
        Object.keys(conflictTime[timeFrame]).forEach((final) => {
          html.push(<InSlot
            name={this.props.courseDetails[conflictTime[timeFrame][final]].name}
            color={this.props.courseToColourIndex[conflictTime[timeFrame][final]]}
            time={this.finalsToRender[conflictTime[timeFrame][final]]}
            key={conflictTime[timeFrame][final]}
            numberOfFinalsAtThisTime={conflictTime[timeFrame].length}
          />);
          delete this.finalsToRender[conflictTime[timeFrame][final]];
        });
      });
      finalExamDays.push(<div key={d} className="final-exam-day">{ html }</div>);
    });
    return (<div className="final-exam-week">
      { weekHeadersHtml }
      <div className="final-exam-days-ctn">{ finalExamDays }</div>
    </div>);
  }

  render() {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shareLink = this.state.shareLinkShown && this.props.shareLink ?
      (<ShareLink
        link={getExamShareLink(this.props.shareLink)}
        onClickOut={this.toggleShareLink}
      />) :
      null;
    const modalHeader =
      (<div className="modal-header">
        <h1>Final Exam Schedule</h1>
        <h2>{ this.props.activeLoadedTimetableName }</h2>
        <div className="modal-share">
          <i
            className="fa fa-share-alt" onClick={() => {
              if (!this.state.shareLinkShown && !this.props.shareLink) {
                this.props.getFinalExamShareLink();
              }
              this.toggleShareLink();
            }}
          />
        </div>
        { shareLink }
        <div className="modal-close" onClick={() => this.hide()}>
          <i className="fa fa-times" />
        </div>
      </div>);
    const modalStyle = {
      width: '100%',
    };
    let display =
      (<div id="final-exam-loader-wrapper">
        <span className="img-icon">
          <div className="loader" />
        </span>
      </div>);
    const signin = !this.props.userInfo.isLoggedIn ? (
      <div>
        <button
          className="btn abnb-btn fb-btn" onClick={() => {
            this.hide();
            this.props.launchUserAcquisitionModal();
          }}
        >
          <span>Sign In</span>
        </button>
        <div className="or-separator">
          <span className="h6 or-separator--text">or</span>
          <hr />
        </div>
      </div>) : null;
    if (this.props.loading) {
      // Leave as is
    } else if (this.props.hasNoCourses && !this.props.loadingCachedTT) {
      display =
        (<div className="peer-card upsell">
          <div className="peer-card-wrapper upsell cf">
            <h4>You Have No Courses Yet</h4>
            <p className="description">Add courses to find your final exams in a simple
              and intuitive
              calendar form or sign in to find your schedule from the cloud.</p>
            { signin }
            <button
              className="btn abnb-btn add-courses-button secondary"
              onClick={this.hide}
            >
              <span>Close & Add Courses</span>
            </button>
          </div>
        </div>);
    } else if (this.props.hasRecievedSchedule && !this.props.loadingCachedTT) {
      display = mobile && $(window).width() < 767 && this.state.orientation === 'portrait' ? this.loadFinalsToDivs(true) : this.loadFinalsToDivs(false);
    }
    return (
      <Modal
        ref={(c) => {
          this.modal = c;
        }}
        className={`final-exam-modal max-modal${(mobile) ? ' is-mobile' : ''}`}
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        <div className="modal-content">
          { modalHeader }
          <div className="modal-body">
            { display }
          </div>
        </div>
      </Modal>
    );
  }
}

FinalExamsModal.defaultProps = {
  shareLink: '',
  loadingCachedTT: false,
  finalExamSchedule: null,
};

FinalExamsModal.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
  finalExamSchedule: React.PropTypes.shape({
    '*': React.PropTypes.string,
  }),
  hasRecievedSchedule: React.PropTypes.bool.isRequired,
  loading: React.PropTypes.bool.isRequired,
  courseToColourIndex: React.PropTypes.shape({
    id: React.PropTypes.string,
  }).isRequired,
  courseDetails: React.PropTypes.shape({
    '*': React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      code: React.PropTypes.string.isRequired,
    }),
  }).isRequired,
  activeLoadedTimetableName: React.PropTypes.string.isRequired,
  hasNoCourses: React.PropTypes.bool.isRequired,
  courses: React.PropTypes.arrayOf(PropTypes.course).isRequired,
  loadingCachedTT: React.PropTypes.bool.isRequired,
  userInfo: PropTypes.userInfo.isRequired,
  shareLink: React.PropTypes.string,
  hideFinalExamsModal: React.PropTypes.func.isRequired,
  logFinalExamView: React.PropTypes.func.isRequired,
  fetchFinalExamSchedule: React.PropTypes.func.isRequired,
  getFinalExamShareLink: React.PropTypes.func.isRequired,
  launchUserAcquisitionModal: React.PropTypes.func.isRequired,
  isShare: React.PropTypes.bool.isRequired,
};
