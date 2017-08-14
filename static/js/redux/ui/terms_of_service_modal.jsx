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

import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'boron/WaveModal';

class TermsOfServiceModal extends React.Component {
  componentDidMount() {
    if (this.props.isVisible) {
      this.modal.show();
    }
  }

  componentDidUpdate() {
    if (this.props.isVisible) {
      this.modal.show();
    }
  }

  render() {
    const modalStyle = {
      width: '100%',
    };
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="terms-of-service-modal max-modal"
        modalStyle={modalStyle}
        closeOnClick={false}
      >
        <div className="tos-modal-container">
          <h1>Terms of Service and Privacy Policy</h1>
          <h3>
              Our Terms of Service and Privacy Policy have been updated. Please review them here:
          </h3>
          <div>
            <a
              href="/termsofservice" target="_blank"
              rel="noopener noreferrer" className="legal-links"
            >
              Terms of Service
            <i className="fa fa-external-link" /></a>
            <a
              href="/privacypolicy" target="_blank"
              rel="noopener noreferrer" className="legal-links"
            >
              Privacy Policy
            <i className="fa fa-external-link" /></a>
          </div>
          <button
            className="accept-tos-btn" onClick={() => {
              this.props.acceptTOS();
              this.modal.hide();
            }}
          >
            <i className="fa fa-check" />
            <span>I accept the Terms of Service</span>
          </button>
          <p className="method-details">
            You must accept the new Terms of Service to continue using Semester.ly.
          </p>
        </div>
      </Modal>
    );
  }
}

TermsOfServiceModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  acceptTOS: PropTypes.func.isRequired,
};

export default TermsOfServiceModal;
