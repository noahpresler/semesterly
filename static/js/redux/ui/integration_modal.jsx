import React from 'react';
import Modal from 'boron/WaveModal';
import { addIntegration, delIntegration } from '../actions/user_actions';

class IntegrationModal extends React.Component {
  constructor(props) {
    super(props);
    this.changeForm = this.changeForm.bind(this);
    this.state = {
      enabled: this.props.enabled,
    };
  }

  componentDidUpdate(nextProps) {
    if (this.props.isVisible) {
      this.modal.show();
    }
    if (this.props.isVisible !== nextProps.isVisible && this.state.enabled !== this.props.enabled) {
      this.setState({ enabled: this.props.enabled });
    }
  }

  changeForm() {
    this.setState({ enabled: !this.state.enabled });
  }

  render() {
    const modalStyle = {
      width: '100%',
      top: '40%',
    };
    const integrationLogo = {
      backgroundImage: 'url(/static/img/integrations/pilotLogo.png)',
    };
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="integration-modal narrow-modal"
        modalStyle={modalStyle}
        onHide={this.props.toggleIntegrationModal}
      >
        <div id="integration-modal">
          <div id="integration-logo" style={integrationLogo} />
          <div className="preference cf">
            <label className="switch switch-slide" htmlFor="enable-integration">
              <input
                className="switch-input" type="checkbox" id="enable-integration"
                checked={this.state.enabled} onChange={this.changeForm}
              />
              <span className="switch-label" data-on="Yes" data-off="No" />
              <span className="switch-handle" />
            </label>
            <div className="preference-wrapper">
              <h3>Would you like to enable Pilot for this course?</h3>
            </div>
          </div>
          <div className="button-wrapper">
            <button
              className="signup-button" onClick={() => {
                if (!this.state.enabled) {
                  delIntegration(1, this.props.course_id);
                } else {
                  addIntegration(1, this.props.course_id, '');
                }
                this.modal.hide();
              }}
            >Save
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

IntegrationModal.propTypes = {
  course_id: React.PropTypes.number.isRequired,
  toggleIntegrationModal: React.PropTypes.func.isRequired,
  enabled: React.PropTypes.bool.isRequired,
  isVisible: React.PropTypes.bool.isRequired,
};

export default IntegrationModal;
