import React from 'react';
import Modal from 'boron/WaveModal';
// import { acceptTOS } from '../actions/user_actions';

class TermsOfServiceBanner extends React.Component {
  componentDidMount() {
    if (this.props.isVisible) {
      // this.refs.modal.show();
    }
  }

  componentDidUpdate() {
    if (this.props.isVisible) {
      // this.refs.modal.show();
    }
  }

  render() {
    const modalStyle = {
      width: '100%',
    };
    return (
      <Modal
        // ref="modal"
        className="terms-of-service-banner-modal max-modal"
        modalStyle={modalStyle}
        closeOnClick={false}
      >
        <div id="tos-banner-container">
          <h1>Terms of Service and Privacy Policy</h1>
          <p className="method-details">
              You must accept the new Terms of Service to continue using Semester.ly.
          </p>
        </div>
      </Modal>
    );
  }
}

TermsOfServiceBanner.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
};

export default TermsOfServiceBanner;
