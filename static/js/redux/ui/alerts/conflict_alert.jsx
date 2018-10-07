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

class ConflictAlert extends React.Component {
  componentWillUnmount() {
    this.props.dismissSelf();
  }

  handleClick() {
    this.props.turnConflictsOn();
    this.props.addLastAddedCourse();
    this.props.dismissSelf();
  }

  render() {
    return (
      <div className="conflict-alert">
        Adding that {this.props.message} causes a conflict!
        <button
          onClick={() => this.handleClick()}
          className="conflict-alert-btn"
        >
            Allow Conflicts!
        </button>
      </div>);
  }
}

ConflictAlert.propTypes = {
  addLastAddedCourse: PropTypes.func.isRequired,
  dismissSelf: PropTypes.func.isRequired,
  turnConflictsOn: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
};

export default ConflictAlert;

