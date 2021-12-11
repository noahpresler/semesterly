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

class NewTimetableAlert extends React.Component {
  componentWillUnmount() {
    this.props.dismissSelf();
  }

  handleClick() {
    this.props.createNewTimetable();
    this.props.dismissSelf();
  }

  render() {
    return (
      <div className="conflict-alert change-semester-alert">
        { this.props.msg }

        <button
          onClick={() => this.handleClick()}
          className="conflict-alert-btn change-semester-btn"
        >
          Create Anyway
        </button>

      </div>);
  }
}

NewTimetableAlert.propTypes = {
  dismissSelf: PropTypes.func.isRequired,
  createNewTimetable: PropTypes.func.isRequired,
  msg: PropTypes.string.isRequired,
};

export default NewTimetableAlert;

