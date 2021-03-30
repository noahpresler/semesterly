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
import Modal from 'boron/WaveModal';

class SeparateAccountsModal extends React.Component {
  constructor(props) {
    super(props);
    this.hide = this.hide.bind(this);
  }

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

  hide() {
    history.replaceState({}, 'Semester.ly', '/');
    this.props.toggleSeparateAccountsModal();
  }

  render() {
    const modalHeader =
      (<div className="modal-content">
        <div className="modal-header">
          <h1>Separate Accounts Detected!</h1>
        </div>
      </div>);
    const modalBody =
      (
        <div className="modal-body">
          <p>
            Your attempt to connect with another account has failed.
            This most likely occurred if you logged into one account
            without being logged into another. If you wish to connect your
            accounts, you must delete one of the accounts by following these
            three steps:
          </p>
          <ol>
            <li>Log into Semester.ly with the account you want to
              <span className="delete-text"> delete</span>.</li>
            <li>Go to account settings by clicking the button below or
              by the dropdown in the top right.</li>
            <img
              className="center-aligned"
              alt="Account settings"
              src="/static/img/account_settings.PNG"
            />
            <li>Delete your account and all related information.</li>
          </ol>
          <a href="/delete_account">
            <div className="button-wrapper">
              <div className="signup-button center-aligned">
                Settings
            </div>
            </div>
          </a>
        </div>
      );
    const modalStyle = {
      width: '100%',
    };
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="separate-accounts-modal max-modal"
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        {modalHeader}
        {modalBody}
      </Modal>
    );
  }
}

SeparateAccountsModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleSeparateAccountsModal: PropTypes.func.isRequired,
};

export default SeparateAccountsModal;

