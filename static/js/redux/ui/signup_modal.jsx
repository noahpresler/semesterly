import React from 'react';
import Modal from 'boron/WaveModal';
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
      <Modal
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
      </Modal>
    );
  }
}

SignupModal.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
  toggleSignupModal: React.PropTypes.func.isRequired,
};

export default SignupModal;
