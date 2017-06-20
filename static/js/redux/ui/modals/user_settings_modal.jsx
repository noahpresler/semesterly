import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';
import classnames from 'classnames';
import Modal from 'boron/WaveModal';
import majors from '../../constants/majors';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';
import { isIncomplete } from '../../util';

class UserSettingsModal extends React.Component {

  static isIncomplete(prop) {
    return prop === undefined || prop === '';
  }

  constructor(props) {
    super(props);
    this.state = {
      sw_capable: 'serviceWorker' in navigator,
      signingUp: this.props.signingUp,
    };
    this.changeForm = this.changeForm.bind(this);
    this.changeMajor = this.changeMajor.bind(this);
    this.changeClassYear = this.changeClassYear.bind(this);
    this.shouldShow = this.shouldShow.bind(this);
  }

  componentDidMount() {
    if (this.shouldShow(this.props)) {
      this.modal.show();
      this.props.setVisible();
    }
    if (UserSettingsModal.isIncomplete(this.props.userInfo.social_courses)) {
      const newUserSettings = {
        social_courses: true,
        social_offerings: false,
        social_all: false,
      };
      const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
      this.props.changeUserInfo(userSettings);
    }
  }

  componentWillReceiveProps(props) {
    if (this.shouldShow(props)) {
      this.modal.show();
      this.props.setVisible();
    }
  }

  changeForm() {
    if (this.props.userInfo.FacebookSignedUp) {
      const newUserSettings = {
        social_courses: this.shareAll.checked || this.shareCourses.checked,
        social_offerings: this.shareAll.checked || this.shareSections.checked,
        social_all: this.shareAll.checked,
      };
      const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
      this.props.changeUserInfo(userSettings);
    }
  }

  changeMajor(val) {
    const userSettings = Object.assign({}, this.props.userInfo, { major: val.value });
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings();
  }

  changeClassYear(val) {
    const userSettings = Object.assign({}, this.props.userInfo, { class_year: val.value });
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings();
  }

  shouldShow(props) {
    return props.userInfo.isLoggedIn && (!props.hideOverrided && (
        props.showOverrided ||
        this.props.userPreferencesIncomplete)
      );
  }

  render() {
    const modalStyle = {
      width: '100%',
    };
    const tos = this.state.signingUp ? (<div
      className="preference welcome-modal__notifications cf"
    >
      <h4>Terms of Service</h4>
      <p>You must agree to our terms of service.</p>
      <label className="switch switch-slide" htmlFor="tos-agreed-input">
        <input
          ref={(c) => { this.tosAgreed = c; }} id="tos-agreed-input"
          className="switch-input" type="checkbox"
          checked={!isIncomplete(this.props.userInfo.timeAcceptedTos)}
          disabled={!isIncomplete(this.props.userInfo.timeAcceptedTos)}
          onChange={() => {
            this.props.acceptTOS();
            this.props.changeUserInfo(Object.assign(
              {},
              this.props.userInfo,
              { timeAcceptedTos: String(new Date()) },
            ));
          }}
        />
        <span className="switch-label" data-on="ACCEPTED" data-off="CLICK TO ACCEPT" />
        <span className="switch-handle" />
      </label>
    </div>) : null;
    const notificationsButton = this.props.tokenRegistered
        ? (<a onClick={this.props.unsubscribeToNotifications}><h3>Turn Off Notifications</h3></a>)
        : (<a onClick={this.props.subscribeToNotifications}><h3>Turn On Notifications</h3></a>);
    const notifications = this.state.sw_capable ? (
      <div
        className={classnames('preference welcome-modal__notifications cf',
          { 'preference-attn': this.props.highlightNotifs })}
      >
        <h4>Notifications</h4>
        {notificationsButton}
      </div>
            ) :
                (<div
                  className={classnames('preference welcome-modal__notifications cf', {
                    'preference-attn-yellow': this.props.highlightNotifs,
                  })}
                >
                  <h3>Use Another Browser To Enable Device Notifications</h3>
                </div>)
        ;
    const preferences = !this.props.userInfo.FacebookSignedUp ? null : (
      <div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="social-courses-input">
            <input
              ref={(c) => { this.shareCourses = c; }} id="social-courses-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_courses} onChange={this.changeForm}
              defaultChecked
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Would you like to find classes with friends?</h3>
            <p className="disclaimer">See which Facebook friends will be your
                            classmates! Only friends in
                            your course will see your name.</p>
          </div>
        </div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="share-sections-input">
            <input
              ref={(c) => { this.shareSections = c; }} id="share-sections-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_offerings === true}
              onChange={this.changeForm}
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Would you like to find sections with friends?</h3>
            <p className="disclaimer">See which Facebook friends will be in your
                            section! Only friends in
                            your section will see your name.</p>
          </div>
        </div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="social-all-input">
            <input
              ref={(c) => { this.shareAll = c; }} id="social-all-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_all === true}
              onChange={this.changeForm}
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Find new friends in your classes!</h3>
            <p className="disclaimer">Find your peers for this semester. All students in
                            your courses will
                            be able to view your name and public Facebook profile.</p>
          </div>
        </div>
      </div>
        );
    const googpic = this.props.userInfo.isLoggedIn ?
      this.props.userInfo.img_url.replace('sz=50', 'sz=100') : '';
    const propic = this.props.userInfo.FacebookSignedUp ?
      `url(https://graph.facebook.com/${this.props.userInfo.fbook_uid}/picture?type=normal)` :
      `url(${googpic})`;
    const fbUpsell = this.props.userInfo.isLoggedIn
      && !this.props.userInfo.FacebookSignedUp ? (
        <div
          className={classnames('preference welcome-modal__notifications second cf',
            { 'preference-attn': this.props.highlightNotifs })}
        >
          <button
            className="btn abnb-btn fb-btn" onClick={() => {
              const link = document.createElement('a');
              link.href = `/login/facebook?student_token=${this.props.userInfo.LoginToken}&login_hash=${this.props.userInfo.LoginHash}`;
              document.body.appendChild(link);
              link.click();
            }}
          >
            <span className="img-icon">
              <i className="fa fa-facebook" />
            </span>
            <span>Continue with Facebook</span>
          </button>
          <p className="disclaimer ctr">Connecting your Facebook allows you to see which of
                    your Facebook friends
                    are in your classes! Only friends in your course will see your name – your
                    information is never
                    shared with any other party.</p>
        </div>) : null;
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="welcome-modal max-modal"
        closeOnClick={false}
        keyboard={false}
        modalStyle={modalStyle}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div className="pro-pic" style={{ backgroundImage: propic }} />
            <h1>Welcome!</h1>
          </div>
          <div className="modal-body">
            <div className="preference cf">
              <h3>What&#39;s your major?</h3>
              <Select
                name="form-field-name"
                value={this.props.userInfo.major}
                options={majors}
                searchable
                onChange={this.changeMajor}
              />
            </div>
            <div className="preference cf">
              <h3>What&#39;s your graduating class year?</h3>
              <Select
                name="form-field-name"
                value={this.props.userInfo.class_year}
                options={[
                                    { value: 2017, label: 2017 },
                                    { value: 2018, label: 2018 },
                                    { value: 2019, label: 2019 },
                                    { value: 2020, label: 2020 },
                                    { value: 2021, label: 2021 },
                                    { value: 2022, label: 2022 },
                                    { value: 2023, label: 2023 },
                ]}
                searchable
                onChange={this.changeClassYear}
              />
            </div>
            { preferences }
            { !this.state.signingUp ? notifications : null }
            { fbUpsell }
            { tos }
            <div className="button-wrapper">
              <button
                className="signup-button" onClick={() => {
                  this.changeForm();
                  if (!this.props.userPreferencesIncomplete) {
                    this.modal.hide();
                    this.props.setHidden();
                    this.props.closeUserSettings();
                  }
                }}
              >Save
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

UserSettingsModal.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  closeUserSettings: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  tokenRegistered: PropTypes.bool.isRequired,
  unsubscribeToNotifications: PropTypes.func.isRequired,
  subscribeToNotifications: PropTypes.func.isRequired,
  highlightNotifs: PropTypes.bool.isRequired,
  userPreferencesIncomplete: PropTypes.bool.isRequired,
  signingUp: PropTypes.bool.isRequired,
  acceptTOS: PropTypes.func.isRequired,
  setVisible: PropTypes.func.isRequired,
  setHidden: PropTypes.func.isRequired,
};

export default UserSettingsModal;

