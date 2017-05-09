import React from 'react';
import Modal from 'boron/WaveModal';
import { acceptTOS } from '../actions/user_actions';

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
        <div id="tos-container">
          <h1>Terms of Service and Privacy Policy</h1>
          <h3>
              Our Terms of Service and Privacy Policy have been updated. Please review them here:
          </h3>
          <div>
            <a
              href="/static/termsofservice.html" target="_blank"
              rel="noopener noreferrer" className="legal-links"
            >
              Terms of Service
            <i className="fa fa-external-link" /></a>
            <a
              href="/static/privacypolicy.html" target="_blank"
              rel="noopener noreferrer" className="legal-links"
            >
              Privacy Policy
            <i className="fa fa-external-link" /></a>
          </div>
          <button
            className="accept-tos-btn" onClick={() => {
              acceptTOS();
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
  isVisible: React.PropTypes.bool.isRequired,
};

export default TermsOfServiceModal;
