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
                Adding that course causes a conflict!
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
};

export default ConflictAlert;

