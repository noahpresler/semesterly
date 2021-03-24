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
          <h1>You are trying to connect two separate accounts.</h1>
        </div>
      </div>);
    const modalStyle = {
      width: '100%',
    };
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="signup-modal max-modal"
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        {modalHeader}
        <a href="/delete_account">
          <div className="signup-button">
            Settings
          </div>
        </a>
      </Modal>
    );
  }
}

SeparateAccountsModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleSeparateAccountsModal: PropTypes.func.isRequired,
};

export default SeparateAccountsModal;

