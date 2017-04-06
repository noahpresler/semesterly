import React from "react";
import Modal from "boron/WaveModal";

export class SaveCalendarModal extends React.Component {
    componentDidMount() {
        if (this.props.isVisible)
            this.refs.modal.show();
    }

    componentDidUpdate(nextProps) {
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
    }

    render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <div className="header-pic"
                         style={{backgroundImage: 'url(/static/img/addtocalendarfeature.png)'}}></div>
                    <h1>Export calendar</h1>
                    <div id="modal-close" onClick={() => this.refs.modal.hide()}>
                        <i className="fa fa-times"></i>
                    </div>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };

        let DownloadIcon = <i className="fa fa-download"/>;
        DownloadIcon = this.props.isDownloading ? <div className="loader"/> : DownloadIcon;
        DownloadIcon = this.props.hasDownloaded ? <i className="done fa fa-check"/> : DownloadIcon;
        let UploadIcon = <img className="google-logo"
                              src="https://a0.muscache.com/airbnb/static/signinup/google_icon_2x-745c2280e5004d4c90e3ca4e60e3f677.png"/>;
        UploadIcon = this.props.isUploading ? <div className="loader"/> : UploadIcon;
        UploadIcon = this.props.hasUploaded ? <i className="done fa fa-check"/> : UploadIcon;

        let DownloadText = "Add to Google Calendar";
        DownloadText = this.props.isUploading ? "One Moment..." : DownloadText;
        DownloadText = this.props.hasUploaded ? "Added to Your Google Calendar" : DownloadText;

        return (
            <Modal ref="modal"
                   className="save-calendar-modal abnb-modal max-modal"
                   modalStyle={modalStyle}
                   onHide={() => {
                       this.props.toggleSaveCalendarModal();
                       history.replaceState({}, 'Semester.ly', '/');
                   }}
            >
                {modalHeader}
                <div id="save-calendar-container">
                    <button className="btn abnb-btn" onClick={() => {
                        if (!this.props.userInfo.isLoggedIn || !this.props.userInfo.GoogleSignedUp || !this.props.userInfo.GoogleLoggedIn) {
                            let link = document.createElement('a');
                            link.href = '/login/google-oauth2/?next=' + location.protocol + "//" + location.host + "/callback/google_calendar" + '&student_token=' + this.props.userInfo.LoginToken + "&login_hash=" + this.props.userInfo.LoginHash
                            document.body.appendChild(link);
                            link.click()
                        } else {
                            this.props.addTTtoGCal();
                        }
                    }}>
                        <span className="img-icon">
                            { UploadIcon }
                        </span>
                        <span>{ DownloadText }</span>
                    </button>
                    <p className="method-details">Add to your Google Calendar in just one click, no downloads. No
                        importing.</p>
                    <div className="or-separator">
                        <span className="h6 or-separator--text">or</span>
                        <hr />
                    </div>
                    <button className="btn abnb-btn secondary" onClick={() => {
                        this.props.createiCalfromTimetable();
                    }}>
                        <span className="img-icon">
                            { DownloadIcon }
                        </span>
                        <span>Download Calendar</span>
                    </button>
                    <p className="method-details">Downloads a .ics file which can be uploaded to Google Calendar, loaded
                        in to iCal., or any other calendar application.</p>
                </div>
            </Modal>
        );
    }
}
