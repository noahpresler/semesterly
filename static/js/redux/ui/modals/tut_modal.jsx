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
import { browserSupportsLocalStorage } from '../../util';

class TutModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tutPosition: 1 };
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this.hide = this.hide.bind(this);
  }

  componentDidMount() {
    const tutorial = JSON.parse(localStorage.getItem('tutorial'));
    if ((!tutorial || !tutorial.modalTutShown) && !(this.props.textbookModalVisible ||
      this.props.signUpModalVisible || this.props.courseModalVisible ||
      this.props.settingModalVisible || this.props.finalExamModalVisible)) {
      this.modal.show();
    }
    $(document.body).on('keydown', (e) => {
      e.stopPropagation();
    });
  }

  next() {
    this.setState({ tutPosition: this.state.tutPosition + 1 });
  }

  prev() {
    this.setState({ tutPosition: this.state.tutPosition - 1 });
  }

  hide() {
    this.modal.hide();
    if (browserSupportsLocalStorage()) {
      localStorage.setItem('tutorial', JSON.stringify({ modalTutShown: true }));
    }
  }

  render() {
    const contentStyle = {
      maxWidth: '500px',
      maxHeight: '550px',
    };
    const left = this.state.tutPosition > 1 ?
      <i className="action fa fa-chevron-left" onClick={this.prev} /> : null;
    let right = this.state.tutPosition < 4 ?
      <i className="action fa fa-chevron-right" onClick={this.next} /> : null;
    right = this.state.tutPosition === 4 ?
      <h4 className="action" onClick={this.hide}>Done</h4> : right;
    switch (this.state.tutPosition) {
      case 1:
        contentStyle.backgroundColor = '#FC7372';
        break;
      case 2:
        contentStyle.backgroundColor = '#35DDBA';
        break;
      case 3:
        contentStyle.backgroundColor = '#5BCBF1';
        break;
      case 4:
        contentStyle.backgroundColor = '#FED361';
        break;
      default:
        contentStyle.backgroundColor = '#FC7372';
    }
    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="tut-modal max-modal"
        closeOnClick={false}
        keyboard={false}
        contentStyle={contentStyle}
      >
        <div className="tut-modal__wrapper">
          <div className="tut-modal__nav">
            { left }
            <p>Welcome to Semester.ly</p>
            { right }
          </div>
          <img
            className="tut-img" alt="Step 1!" src={'/static/img/tutorial/step1.png'}
            style={{
              display: this.state.tutPosition === 1 ? 'inline' : 'none',
              opacity: this.state.tutPosition === 1 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" alt="Step 2!" src={'/static/img/tutorial/step2.png'}
            style={{
              display: this.state.tutPosition === 2 ? 'inline' : 'none',
              opacity: this.state.tutPosition === 2 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" alt="Step 3!" src={'/static/img/tutorial/step3.png'}
            style={{
              display: this.state.tutPosition === 3 ? 'inline' : 'none',
              opacity: this.state.tutPosition === 3 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" alt="Step 4!" src={'/static/img/tutorial/step4.png'}
            style={{
              display: this.state.tutPosition === 4 ? 'inline' : 'none',
              opacity: this.state.tutPosition === 4 ? '1' : '0',
            }}
            width="100%"
          />
        </div>
      </WaveModal>
    );
  }
}

TutModal.propTypes = {
  textbookModalVisible: PropTypes.bool.isRequired,
  signUpModalVisible: PropTypes.bool.isRequired,
  courseModalVisible: PropTypes.bool.isRequired,
  finalExamModalVisible: PropTypes.bool.isRequired,
  settingModalVisible: PropTypes.bool.isRequired,
};

export default TutModal;

