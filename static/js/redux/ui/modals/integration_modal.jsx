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
import { WaveModal } from 'boron-15';
import { addIntegration, delIntegration } from '../../actions/user_actions';

class IntegrationModal extends React.Component {
  constructor(props) {
    super(props);
    this.changeForm = this.changeForm.bind(this);
    this.state = {
      enabled: this.props.enabled,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isVisible !== nextProps.isVisible && this.state.enabled !== this.props.enabled) {
      this.setState({ enabled: this.props.enabled });
    }
  }

  componentDidUpdate() {
    if (this.props.isVisible) {
      this.modal.show();
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
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="integration-modal narrow-modal"
        modalStyle={modalStyle}
        onHide={this.props.toggleIntegrationModal}
      >
        <div className="integration-modal__wrapper">
          <div className="integration-logo" style={integrationLogo} />
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
      </WaveModal>
    );
  }
}

IntegrationModal.defaultProps = {
  course_id: null,
};

IntegrationModal.propTypes = {
  course_id: PropTypes.number,
  toggleIntegrationModal: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  isVisible: PropTypes.bool.isRequired,
};

export default IntegrationModal;

