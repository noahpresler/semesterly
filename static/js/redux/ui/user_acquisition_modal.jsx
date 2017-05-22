import React from 'react';
import Modal from 'boron/WaveModal';
import * as PropTypes from '../constants/propTypes';

class UserAcquisitionModal extends React.Component {
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
    const modalHeader =
            (<div id="modal-content">
              <div className="modal-header">
                <h1>Login/Signup</h1>
              </div>
            </div>);
    const modalStyle = {
      width: '100%',
    };

    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="user-acquisition-modal abnb-modal max-modal"
        modalStyle={modalStyle}
        onHide={() => {
          this.props.toggleUserAcquisitionModal();
          history.replaceState({}, 'Semester.ly', '/');
        }}
      >

        {modalHeader}


        <div id="save-calendar-container">
          <h3>Recommended:</h3>
          <button
            className="btn abnb-btn fb-btn" onClick={() => {
              const link = document.createElement('a');
              link.href = `/login/facebook/?student_token=${this.props.userInfo.LoginToken}` +
                `&login_hash=${this.props.userInfo.LoginHash}`;
              document.body.appendChild(link);
              link.click();
            }}
          >
            <span className="img-icon">
              <i className="fa fa-facebook" />
            </span>
            <span>Continue with Facebook</span>
          </button>
          <p className="method-details">Allows the option to friends in your classes.</p>


          <div className="or-separator">
            <span className="h6 or-separator--text">or</span>
            <hr />
          </div>


          <button
            className="btn abnb-btn secondary" onClick={() => {
              const link = document.createElement('a');
              link.href = `/login/google-oauth2/?student_token=${this.props.userInfo.LoginToken}&login_hash=${this.props.userInfo.LoginHash}`;
              document.body.appendChild(link);
              link.click();
            }}
          >
            <span className="img-icon">
              <img
                alt="Google"
                className="google-logo"
                src="https://a0.muscache.com/airbnb/static/signinup/google_icon_2x-745c2280e5004d4c90e3ca4e60e3f677.png"
              />
            </span>
            <span>Continue with Google</span>
          </button>


          <button
            className="btn abnb-btn secondary eight-px-top" onClick={() => {
                        // this.props.createiCalfromTimetable();
            }} disabled
          >
            <span className="img-icon">
              <i className="fa fa-envelope-o" />
            </span>
            <span>Email Coming Soon</span>
          </button>
        </div>
      </Modal>
    );
  }
}

UserAcquisitionModal.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
  toggleUserAcquisitionModal: React.PropTypes.func.isRequired,
  userInfo: PropTypes.userInfo.isRequired,
};

export default UserAcquisitionModal;
