import React from 'react';
import Modal from 'boron/WaveModal';
import { browserSupportsLocalStorage } from '../util';

export class TutModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tutPosition: 1 };
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this.hide = this.hide.bind(this);
  }

  componentDidMount(nextProps) {
    const tutorial = JSON.parse(localStorage.getItem('tutorial'));
    if ((!tutorial || !tutorial.modalTutShown) && !(this.props.textbookModalVisible || this.props.signUpModalVisible || this.props.courseModalVisible || this.props.courseModalVisible || this.props.finalExamModalVisible)) {
      this.refs.modal.show();
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
    this.refs.modal.hide();
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
    right = this.state.tutPosition == 4 ?
      <h4 className="action" onClick={this.hide}>Done</h4> : right;
    let backgroundColor;
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
    }
    return (
      <Modal
        ref="modal"
        className="tut-modal max-modal"
        closeOnClick={false}
        keyboard={false}
        contentStyle={contentStyle}
      >
        <div id="tut-wrapper">
          <div id="tut-nav">
            { left }
            <p>Welcome to Semester.ly</p>
            { right }
          </div>
          <img
            className="tut-img" src={'/static/img/tutorial/step1.png'}
            style={{
              display: this.state.tutPosition == 1 ? 'inline' : 'none',
              opacity: this.state.tutPosition == 1 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" src={'/static/img/tutorial/step2.png'}
            style={{
              display: this.state.tutPosition == 2 ? 'inline' : 'none',
              opacity: this.state.tutPosition == 2 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" src={'/static/img/tutorial/step3.png'}
            style={{
              display: this.state.tutPosition == 3 ? 'inline' : 'none',
              opacity: this.state.tutPosition == 3 ? '1' : '0',
            }}
            width="100%"
          />
          <img
            className="tut-img" src={'/static/img/tutorial/step4.png'}
            style={{
              display: this.state.tutPosition == 4 ? 'inline' : 'none',
              opacity: this.state.tutPosition == 4 ? '1' : '0',
            }}
            width="100%"
          />
        </div>
      </Modal>
    );
  }
}
