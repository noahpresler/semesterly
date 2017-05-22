import React from 'react';
import Modal from 'boron/WaveModal';
import * as PropTypes from '../constants/propTypes';

class SaveCalendarModal extends React.Component {
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
                <div
                  className="header-pic"
                  style={{ backgroundImage: 'url(/static/img/addtocalendarfeature.png)' }}
                />
                <h1>Export calendar</h1>
                <div className="modal-close" onClick={() => this.modal.hide()}>
                  <i className="fa fa-times" />
                </div>
              </div>
            </div>);
    const modalStyle = {
      width: '100%',
    };

    let DownloadIcon = <i className="fa fa-download" />;
    DownloadIcon = this.props.isDownloading ? <div className="loader" /> : DownloadIcon;
    DownloadIcon = this.props.hasDownloaded ? <i className="done fa fa-check" /> : DownloadIcon;
    let UploadIcon = (<img
      alt="google-login"
      className="google-logo"
      src={'https://a0.muscache.com/airbnb/static/signinup/'
      + 'google_icon_2x-745c2280e5004d4c90e3ca4e60e3f677.png'}
    />);
    UploadIcon = this.props.isUploading ? <div className="loader" /> : UploadIcon;
    UploadIcon = this.props.hasUploaded ? <i className="done fa fa-check" /> : UploadIcon;

    let DownloadText = 'Add to Google Calendar';
    DownloadText = this.props.isUploading ? 'One Moment...' : DownloadText;
    DownloadText = this.props.hasUploaded ? 'Added to Your Google Calendar' : DownloadText;

    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="save-calendar-modal abnb-modal max-modal"
        modalStyle={modalStyle}
        onHide={() => {
          this.props.toggleSaveCalendarModal();
          history.replaceState({}, 'Semester.ly', '/');
        }}
      >
        {modalHeader}
        <div className="save-calendar-modal__container">
          <button
            className="btn abnb-btn" onClick={() => {
              if (!this.props.userInfo.isLoggedIn || !this.props.userInfo.GoogleSignedUp ||
                !this.props.userInfo.GoogleLoggedIn) {
                const link = document.createElement('a');
                link.href = `/login/google-oauth2/?next=${location.protocol}//${location.host}
                /callback/google_calendar&student_token=${this.props.userInfo.LoginToken}
                &login_hash=${this.props.userInfo.LoginHash}`;
                document.body.appendChild(link);
                link.click();
              } else {
                this.props.addTTtoGCal();
              }
            }}
          >
            <span className="img-icon">
              { UploadIcon }
            </span>
            <span>{ DownloadText }</span>
          </button>
          <p className="method-details">Add to your Google Calendar in just one click, no
                        downloads. No
                        importing.</p>
          <div className="or-separator">
            <span className="h6 or-separator--text">or</span>
            <hr />
          </div>
          <button
            className="btn abnb-btn secondary" onClick={() => {
              this.props.createICalFromTimetable();
            }}
          >
            <span className="img-icon">
              { DownloadIcon }
            </span>
            <span>Download Calendar</span>
          </button>
          <p className="method-details">Downloads a .ics file which can be uploaded to
                        Google Calendar, loaded
                        in to iCal., or any other calendar application.</p>
        </div>
      </Modal>
    );
  }
}

SaveCalendarModal.propTypes = {
  createICalFromTimetable: React.PropTypes.func.isRequired,
  addTTtoGCal: React.PropTypes.func.isRequired,
  toggleSaveCalendarModal: React.PropTypes.func.isRequired,
  isDownloading: React.PropTypes.bool.isRequired,
  hasDownloaded: React.PropTypes.bool.isRequired,
  isUploading: React.PropTypes.bool.isRequired,
  hasUploaded: React.PropTypes.bool.isRequired,
  userInfo: PropTypes.userInfo.isRequired,
  isVisible: React.PropTypes.bool.isRequired,
};

export default SaveCalendarModal;
