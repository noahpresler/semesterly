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
import twemoji from 'twemoji';
import {WaveModal} from 'boron-15';
import renderHTML from 'react-render-html';

class SignupModal extends React.Component {
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
    this.props.toggleSignupModal();
  }

  render() {
    const modalHeader =
            (<div className="modal-content">
              <div className="modal-header">
                <div
                  className="pro-pic"
                  style={{ backgroundImage: 'url(/static/img/blank.jpg)' }}
                />
                <h1>That feature requires an account...</h1>
              </div>
            </div>);
    const modalStyle = {
      width: '100%',
    };
    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="signup-modal max-modal"
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        {modalHeader}
        <div className="features">
          <div className="feature-highlight">
            <div className="row">
              <div className="col-1-2">
                <div className="emoji"><i className="fa fa-check" /></div>
                Find classes with friends
                <img className="sample-slot" alt="" src="/static/img/sample_slot.png" />
              </div>
              <div className="col-1-2">
                <div className="emoji"><i className="fa fa-check" /></div>
                Save & name multiple timetables
                <img className="sample-slot" alt="" src="/static/img/multi_tt_sample.png" />
              </div>
            </div>
            <div className="row">
              <div className="col-1-2">
                <div className="emoji"><i className="fa fa-check" /></div>
                Create custom events
                <img
                  alt=""
                  className="sample-slot"
                  src="/static/img/sample_custom_slot_grey.png"
                />
              </div>
              <div className="col-1-2">
                <div className="emoji">
                  {renderHTML(twemoji.parse('\uD83D\uDD25'))}
                </div>
                It&#39;s all free
                <h1>More Burritos!</h1>
              </div>
            </div>
          </div>
          <div className="call-to-action">
            <div className="disclaimer">
              Semester.ly will NEVER post to your timeline. Your course selections
              will not be shared with
              any other user without your permission.
            </div>
            <a href="/login/facebook/">
              <div className="signup-button">
                Signup!
              </div>
            </a>
          </div>
        </div>
      </WaveModal>
    );
  }
}

SignupModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleSignupModal: PropTypes.func.isRequired,
};

export default SignupModal;

