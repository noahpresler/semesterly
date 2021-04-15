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
import Cookie from 'js-cookie';
import TopBarAdvisingContainer from './containers/top_bar_advising_container';
import CommentForumContainer from './containers/comment_forum_container';
import AdvisingScheduleContainer from './containers/advising_schedule_container';
import UserSettingsModalContainer from './containers/modals/user_settings_modal_container';
import SignupModalContainer from './containers/modals/signup_modal_container';
import JHUSignupModalContainer from './containers/modals/jhu_signup_modal_container';
import UserAcquisitionModalContainer from './containers/modals/user_acquisition_modal_container';
import { getTranscriptCommentsBySemester, getRetrievedSemesters } from '../constants/endpoints';
import SISImportDataModalContainer from './containers/modals/SIS_import_data_modal_container';


class Advising extends React.Component {
  constructor(props) {
    super(props);
    const mql = window.matchMedia('(orientation: portrait)');
    this.state = {
      orientation: !mql.matches ? 'landscape' : 'portrait',
      selected_semester: null,
      transcript: null,
      displayed_semesters: null,
    };
    this.updateOrientation = this.updateOrientation.bind(this);
    this.callbackFunction = this.callbackFunction.bind(this);
    this.addRemoveAdvisor = this.addRemoveAdvisor.bind(this);
  }

  componentWillMount() {
    // $(document.body).on('keydown', (e) => {
    //   if (parseInt(e.keyCode, 10) === 39) {
    //     if (this.props.PgActive + 1 < this.props.PgCount) {
    //       this.props.setPgActive(this.props.PgActive + 1);
    //     }
    //   } else if (parseInt(e.keyCode, 10) === 37) {
    //     if (this.props.PgActive > 0) {
    //       this.props.setPgActive(this.props.PgActive - 1);
    //     }
    //   }
    // });
    // $(document.body).bind('keydown', (e) => {
    //   if (e.ctrlKey || e.metaKey) {
    //     switch (String.fromCharCode(e.which).toLowerCase()) {
    //       case 's':
    //         e.preventDefault();
    //         this.props.saveTimetable();
    //         break;
    //       default:
    //         break;
    //     }
    //   }
    // });
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
    this.fetchSemesters();
  }

  fetchSemesters() {
    const semesters = [`${this.props.semester.name} ${this.props.semester.year}`];
    fetch(getRetrievedSemesters())
      .then(response => response.json())
      .then((data) => {
        this.setState({ displayed_semesters: semesters.concat(data.retrievedSemesters) });
      });
  }

  fetchTranscript(newSelectedSemester) {
    if (newSelectedSemester !== null) {
      const semesterName = newSelectedSemester.toString().split(' ')[0];
      const semesterYear = newSelectedSemester.toString().split(' ')[1];

      fetch(getTranscriptCommentsBySemester(semesterName, semesterYear))
        .then(response => response.json())
        .then((data) => {
          this.setState({ transcript: data.transcript });
        });
      this.setState({ selected_semester: newSelectedSemester });
    } else {
      this.setState({ selected_semester: null });
      this.setState({ transcript: null });
    }
  }

  addRemoveAdvisor(advisor, added) {
    if (this.state.selected_semester !== null) {
      const semesterName = this.state.selected_semester.toString().split(' ')[0];
      const semesterYear = this.state.selected_semester.toString().split(' ')[1];

      fetch(getTranscriptCommentsBySemester(semesterName, semesterYear, advisor), {
        method: 'PATCH',
        headers: {
          'X-CSRFToken': Cookie.get('csrftoken'),
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jhed: advisor,
          action: !added ? 'add' : 'remove',
        }),
      }).then(response => response.json())
      .then((data) => {
        this.setState({ transcript: data.transcript });
      });
    }
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

  callbackFunction(childSemesterData) {
    this.fetchTranscript(childSemesterData);
  }


  render() {
    const footer = (
      <footer className="footer navbar no-print">
        <p className="data-last-updated no-print">Data last
          updated: { this.props.dataLastUpdated && this.props.dataLastUpdated.length && this.props.dataLastUpdated !== 'null' ? this.props.dataLastUpdated : null }</p>
        <ul className="nav nav-pills no-print">
          <li className="footer-button" role="presentation">
            <a href="/termsofservice">Terms</a>
          </li>
          <li className="footer-button" role="presentation">
            <a href="/privacypolicy">Privacy</a>
          </li>
          <li className="footer-button" role="presentation">
            <a href="mailto:contact@semester.ly?Subject=Semesterly">
              Contact us
            </a>
          </li>
          <li className="footer-button" role="presentation">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="http://goo.gl/forms/YSltU2YI54PC9sXw1"
            >
              Feedback
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
    );

    return (
      <div className="page-wrapper">
        <TopBarAdvisingContainer />
        <UserSettingsModalContainer />
        <UserAcquisitionModalContainer />
        <SignupModalContainer />
        <JHUSignupModalContainer />
        <SISImportDataModalContainer />
        <div className="all-cols">
          <div className="main-advising">
            <div className="advising-schedule">
              <AdvisingScheduleContainer
                parentCallback={this.callbackFunction}
                selected_semester={this.state.selected_semester}
                displayed_semesters={this.state.displayed_semesters}
              />
              {footer}
            </div>
          </div>
          <div className="advising-schedule">
            <CommentForumContainer
              addRemoveAdvisor={this.addRemoveAdvisor}
              selected_semester={this.state.selected_semester}
              transcript={this.state.transcript}
            />
          </div>
        </div>
      </div>);
  }
}

Advising.propTypes = {
  dataLastUpdated: PropTypes.string.isRequired,
  semester: PropTypes.shape({
    name: PropTypes.string.isRequired,
    year: PropTypes.string.isRequired,
  }).isRequired,
};

export default Advising;
