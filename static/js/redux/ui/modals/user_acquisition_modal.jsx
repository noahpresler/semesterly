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
import {WaveModal} from 'boron-15';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';

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
      (<div className="modal-content">
        <div className="modal-header">
          <h1>Login/Signup</h1>
        </div>
      </div>);
    const modalStyle = {
      width: '100%',
    };

    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="user-acquisition-modal abnb-modal max-modal"
        modalStyle={modalStyle}
        onHide={() => {
          this.props.toggleUserAcquisitionModal();
          history.replaceState({}, 'Semester.ly', '/');
        }}
      >

        {modalHeader}


        <div className="user-acquisition-modal__container">
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

          <br />

          <button
            className="btn abnb-btn secondary" onClick={() => {
              const link = document.createElement('a');
              link.href = `/login/azuread-tenant-oauth2/?student_token=${this.props.userInfo.LoginToken}&login_hash=${this.props.userInfo.LoginHash}`;
              document.body.appendChild(link);
              link.click();
            }}
          >
            <span className="img-icon">
              <img
                alt="JHU"
                className="jhu-square"
                src="/static/img/school_logos/jhu-square.png"
              />
            </span>
            <span>Continue with JHED*</span>
          </button>
          <p className="method-details">* Exclusive to JHU students & faculty.</p>

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


          {/* <button
            className="btn abnb-btn secondary eight-px-top" onClick={() => {
              // this.props.createiCalfromTimetable();
            }} disabled
          >
            <span className="img-icon">
              <i className="fa fa-envelope-o" />
            </span>
            <span>Email Coming Soon</span>
          </button> */}
        </div>
      </WaveModal>
    );
  }
}

UserAcquisitionModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleUserAcquisitionModal: PropTypes.func.isRequired,
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
};

export default UserAcquisitionModal;

