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
import TopBarAdvisingContainer from './containers/top_bar_advising_container';
import CommentForumContainer from './containers/comment_forum_container';
import AdvisingScheduleContainer from './containers/advising_schedule_container';
import UserSettingsModalContainer from './containers/modals/user_settings_modal_container';
import SignupModalContainer from './containers/modals/signup_modal_container';
import UserAcquisitionModalContainer from './containers/modals/user_acquisition_modal_container';


class Advising extends React.Component {
    constructor(props) {
        super(props);
        const mql = window.matchMedia('(orientation: portrait)');
        this.state = {
            orientation: !mql.matches ? 'landscape' : 'portrait',
            selected_semester: this.props.semester.name + ' ' + this.props.semester.year,
        };
        this.updateOrientation = this.updateOrientation.bind(this);
    }

    componentWillMount() {
        $(document.body).on('keydown', (e) => {
            if (parseInt(e.keyCode, 10) === 39) {
                if (this.props.PgActive + 1 < this.props.PgCount) {
                    this.props.setPgActive(this.props.PgActive + 1);
                }
            } else if (parseInt(e.keyCode, 10) === 37) {
                if (this.props.PgActive > 0) {
                    this.props.setPgActive(this.props.PgActive - 1);
                }
            }
        });
        $(document.body).bind('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (String.fromCharCode(e.which).toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.props.saveTimetable();
                        break;
                    default:
                        break;
                }
            }
        });
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
        if (childSemesterData !== this.state.selected_semester) {
             this.setState({selected_semester: childSemesterData});
        }
    }


    render() {
        //const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        //const cal = mobile && $(window).width() < 767 && this.state.orientation === 'portrait' ?
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
        )

        return (
            <div className="page-wrapper">
                <TopBarAdvisingContainer />
                <UserSettingsModalContainer />
                <UserAcquisitionModalContainer />
                <SignupModalContainer />
                <div className="all-cols">
                    <div className="main-advising">
                        <AdvisingScheduleContainer
                          parentCallback = {this.callbackFunction.bind(this)}
                          selected_semester = {this.state.selected_semester}
                        />
                        {footer}
                    </div>
                    <CommentForumContainer selected_semester = {this.state.selected_semester} />
                </div>
            </div>);
    }
}

Advising.propTypes = {
    dataLastUpdated: PropTypes.string.isRequired,
    alertChangeSemester: PropTypes.bool.isRequired,
    alertConflict: PropTypes.bool.isRequired,
    alertEnableNotifications: PropTypes.bool.isRequired,
    alertFacebookFriends: PropTypes.bool.isRequired,
    alertNewTimetable: PropTypes.bool.isRequired,
    alertTimetableExists: PropTypes.bool.isRequired,
    saveTimetable: PropTypes.func.isRequired,
    setPgActive: PropTypes.func.isRequired,
    semester: PropTypes.shape({
        name: PropTypes.string.isRequired,
        year: PropTypes.string.isRequired,
    }).isRequired,
};

export default Advising;

