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

import PropTypes from "prop-types";
import React from "react";

class ChangeSemesterAlert extends React.Component {
  componentWillUnmount() {
    this.props.dismissSelf();
  }

  handleClick() {
    this.props.setSemester(this.props.desiredSemester);
    this.props.dismissSelf();
  }

  render() {
    return (
      <div className="change-semester-alert">
        {this.props.msg}

        <button onClick={() => this.handleClick()} className="conflict-alert-btn">
          Change Semester Anyway
        </button>
        <small className="alert-extra">
          Psst – Signing up allows you to save multiple timetables for all semesters!
        </small>
      </div>
    );
  }
}

ChangeSemesterAlert.propTypes = {
  dismissSelf: PropTypes.func.isRequired,
  setSemester: PropTypes.func.isRequired,
  desiredSemester: PropTypes.number.isRequired,
  msg: PropTypes.string.isRequired,
};

export default ChangeSemesterAlert;
