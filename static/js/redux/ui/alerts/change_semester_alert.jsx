import React from 'react';

require('../../../../css/timetable/alert.scss');

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
      <div className="conflict-alert change-semester-alert">
        { this.props.msg }

        <button
          onClick={() => this.handleClick()}
          className="conflict-alert-btn change-semester-btn"
        >
        Change Semester Anyway
      </button>
        <small className="alert-extra">
          Psst – Signing up allows you to save multiple timetables for all semesters!
        </small>

      </div>);
  }
}

ChangeSemesterAlert.propTypes = {
  dismissSelf: React.PropTypes.func.isRequired,
  setSemester: React.PropTypes.func.isRequired,
  desiredSemester: React.PropTypes.number.isRequired,
  msg: React.PropTypes.string.isRequired,
};

export default ChangeSemesterAlert;
