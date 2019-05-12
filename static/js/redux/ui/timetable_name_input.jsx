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
import classnames from 'classnames';

class TimetableNameInput extends React.Component {
  constructor(props) {
    super(props);
    this.alterTimetableName = this.alterTimetableName.bind(this);
    this.setTimetableName = this.setTimetableName.bind(this);
    this.showSignupModal = this.showSignupModal.bind(this);
    this.state = { name: this.props.activeLoadedTimetableName };
  }

  componentWillMount() {
    $(document.body).on('keydown', (e) => {
      if (e.key === 'Enter') {
        this.setTimetableName();
        $('input.timetable-name').blur();
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ name: nextProps.activeLoadedTimetableName });
  }

  setTimetableName() {
    const newName = this.state.name;
    if (newName.length === 0) {
      this.setState({ name: this.props.activeLoadedTimetableName });
    } else if (newName !== this.props.activeLoadedTimetableName) {
      this.props.changeTimetableName(newName);
    }
  }

  showSignupModal() {
    if (!this.props.isLoggedIn) {
      this.props.openSignUpModal();
    }
  }

  alterTimetableName(event) {
    this.setState({ name: event.target.value });
  }

  render() {
    return (<div  >
      {this.props.isOfficial && <img alt='logo' className='official-course-icon-large' src='/static/img/official_course_icon.png/'/>}
      {!this.props.isOfficial ? <input
      className={classnames('timetable-name', { unsaved: !this.props.upToDate })}
      value={this.state.name}
      onChange={this.alterTimetableName}
      onBlur={this.setTimetableName}
      onClick={this.showSignupModal}
    /> : <input
          className={classnames('timetable-name', 'ninety-width', 'small-left-pad', { unsaved: !this.props.upToDate })}
          value={this.state.name}
          style={{pointerEvents : 'none'}}
      />
      }
      </div>);
  }
}

TimetableNameInput.propTypes = {
  activeLoadedTimetableName: PropTypes.string.isRequired,
  openSignUpModal: PropTypes.func.isRequired,
  upToDate: PropTypes.bool.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  changeTimetableName: PropTypes.func.isRequired
};


export default TimetableNameInput;

