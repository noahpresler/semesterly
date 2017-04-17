import React from 'react';

class ConflictAlert extends React.Component {
  componentWillUnmount() {
    this.props.dismissSelf();
  }

  handleClick() {
    this.props.turnConflictsOn();
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
  dismissSelf: React.PropTypes.func.isRequired,
  turnConflictsOn: React.PropTypes.func.isRequired,
};

export default ConflictAlert;
