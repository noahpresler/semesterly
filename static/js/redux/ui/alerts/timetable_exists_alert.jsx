import PropTypes from 'prop-types';
import React from 'react';

class TimetableExistsAlert extends React.Component {

  componentWillUnmount() {
    this.props.dismissSelf();
  }

  handleClick() {
    this.props.dismissSelf();
  }

  render() {
    return (
      <div className="timetable-exists-alert">
                You already have a timetable with that name!
            </div>);
  }
}

TimetableExistsAlert.propTypes = {
  dismissSelf: PropTypes.func.isRequired,
};

export default TimetableExistsAlert;

