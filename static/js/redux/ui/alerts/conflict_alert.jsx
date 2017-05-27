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
  message: React.PropTypes.string.isRequired,
  dismissSelf: React.PropTypes.func.isRequired,
  turnConflictsOn: React.PropTypes.func.isRequired,
  addLastAddedCourse: React.PropTypes.func.isRequired,
};

export default ConflictAlert;
