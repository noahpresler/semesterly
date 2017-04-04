import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/WaveModal';
import majors from '../constants/majors.jsx';
import Select from 'react-select';
import classnames from 'classnames';
import { setARegistrationToken, unregisterAToken } from '../actions/user_actions.jsx';

export class UserSettingsModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sw_capable: 'serviceWorker' in navigator
        }
        this.changeForm = this.changeForm.bind(this);
        this.changeMajor = this.changeMajor.bind(this);
        this.changeClassYear = this.changeClassYear.bind(this);
        this.shouldShow = this.shouldShow.bind(this);
        this.isIncomplete = this.isIncomplete.bind(this);
    }
    changeForm() {
        if (this.props.userInfo.FacebookSignedUp) {
            let newUserSettings = {
                social_courses: this.refs.share_all.checked || this.refs.share_courses.checked,
                social_offerings: this.refs.share_all.checked || this.refs.share_sections.checked,
                social_all: this.refs.share_all.checked
            }
            let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
            this.props.changeUserInfo(userSettings);
            this.props.saveSettings();
        }
    }
    componentDidMount() {
        if (this.shouldShow(this.props))
            this.refs.modal.show();
        if(this.isIncomplete(this.props.userInfo.social_courses)) {
            let newUserSettings = { social_courses: true, social_offerings: false, social_all: false };
            let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
            this.props.changeUserInfo(userSettings);
        }
    }

    componentWillReceiveProps(props) {
        if (this.shouldShow(props))
            this.refs.modal.show();
    }
    changeMajor(val) {
        let userSettings = Object.assign({}, this.props.userInfo, {major: val.value});
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings();
    }
    changeClassYear(val) {
        let userSettings = Object.assign({}, this.props.userInfo, {class_year: val.value});
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings();
    }
    shouldShow(props) {
        if (!this.props.userInfo.FacebookSignedUp) {
            return !gcalCallback && props.userInfo.isLoggedIn && (props.showOverrided || this.isIncomplete(props.userInfo.major) || this.isIncomplete(props.userInfo.class_year))
        } else {
            return !gcalCallback && props.userInfo.isLoggedIn && (props.showOverrided || this.isIncomplete(props.userInfo.social_offerings) || this.isIncomplete(props.userInfo.social_courses) || this.isIncomplete(props.userInfo.major) || this.isIncomplete(props.userInfo.class_year));
        }
    }
    isIncomplete(prop) {
        return prop === undefined || prop === "";
    }
    subscribeToNotifications() {
        setARegistrationToken();
    }
    unsubscribeToNotifications() {
        unregisterAToken();
    }
    render() {
        let modalStyle = {
            width: '100%',
        };
        let notifications_button = this.props.tokenRegistered
            ? (<a onClick={this.unsubscribeToNotifications}><h3>Turn Off Notifications</h3></a>)
            : (<a onClick={this.subscribeToNotifications}><h3>Turn On Notifications</h3></a>)
        let notifications = this.state.sw_capable ? (
            <div className={classnames('preference notifications cf', {'preference-attn' : enableNotifs})}>
                <h4>Notifications</h4>
                {notifications_button}
            </div>
        ) :
            <div className={classnames('preference notifications cf', {'preference-attn-yellow' : enableNotifs})}>
                <h3>Use Another Browser To Enable Device Notifications</h3>
            </div>
        ;
        let preferences = !this.props.userInfo.FacebookSignedUp ? null : (
            <div>
                <div className="preference cf">
                    <label className="switch switch-slide">
                        <input ref="share_courses" className="switch-input" type="checkbox" checked={this.props.userInfo.social_courses} onChange={this.changeForm} defaultChecked={true}/>
                        <span className="switch-label" data-on="Yes" data-off="No"></span>
                        <span className="switch-handle"></span>
                    </label>
                    <div className="preference-wrapper">
                        <h3>Would you like to find classes with friends?</h3>
                        <p className="disclaimer">See which Facebook friends will be your classmates! Only friends in your course will see your name.</p>
                    </div>
                </div>
                <div className="preference cf">
                    <label className="switch switch-slide">
                        <input ref="share_sections" className="switch-input" type="checkbox" checked={this.props.userInfo.social_offerings === true} onChange={this.changeForm}/>
                        <span className="switch-label" data-on="Yes" data-off="No"></span>
                        <span className="switch-handle"></span>
                    </label>
                    <div className="preference-wrapper">
                        <h3>Would you like to find sections with friends?</h3>
                        <p className="disclaimer">See which Facebook friends will be in your section! Only friends in your section will see your name.</p>
                    </div>
                </div>
                <div className="preference cf">
                    <label className="switch switch-slide">
                        <input ref="share_all" className="switch-input" type="checkbox" checked={this.props.userInfo.social_all === true} onChange={this.changeForm}/>
                        <span className="switch-label" data-on="Yes" data-off="No"></span>
                        <span className="switch-handle"></span>
                    </label>
                    <div className="preference-wrapper">
                        <h3>Find new friends in your classes!</h3>
                        <p className="disclaimer">Find your peers for this semester. All students in your courses will be able to view your name and public Facebook profile.</p>
                    </div>
                </div>
            </div>
        );
        let googpic = this.props.userInfo.isLoggedIn ? this.props.userInfo.img_url.replace('sz=50','sz=100') : ''
        let propic = this.props.userInfo.FacebookSignedUp ? 'url(https://graph.facebook.com/' + JSON.parse(currentUser).fbook_uid + '/picture?type=normal)' : 'url(' + googpic + ')';
        let fb_upsell = this.props.userInfo.isLoggedIn && !this.props.userInfo.FacebookSignedUp ? (
            <div className={classnames('preference notifications second cf', {'preference-attn' : enableNotifs})}>
                <button className="btn abnb-btn fb-btn" onClick={() => {
                        let link = document.createElement('a');
                        link.href = '/login/facebook?student_token=' + this.props.userInfo.LoginToken + "&login_hash=" + this.props.userInfo.LoginHash
                        document.body.appendChild(link);
                        link.click()
                    }}>
                    <span className="img-icon">
                       <i className="fa fa-facebook" />
                    </span>
                    <span>Continue with Facebook</span>
                </button>
                <p className="disclaimer ctr">Connecting your Facebook allows you to see which of your Facebook friends are in your classes! Only friends in your course will see your name – your information is never shared with any other party.</p>
            </div>) : null;
        return (
            <Modal ref="modal"
                className="welcome-modal max-modal"
                closeOnClick={false}
                keyboard={false}
                modalStyle={modalStyle}
                >
                <div id="modal-content">
                    <div id="modal-header">
                        <div className="pro-pic" style={{backgroundImage: propic}}></div>
                        <h1>Welcome!</h1>
                    </div>
                    <div id="modal-body">
                        <div className="preference cf">
                            <h3>What's your major?</h3>
                            <Select
                                name="form-field-name"
                                value={this.props.userInfo.major}
                                ref="major"
                                options={majors}
                                searchable={true}
                                onChange={this.changeMajor}
                            />
                        </div>
                        <div className="preference cf">
                            <h3>What's your graduating class year?</h3>
                            <Select
                                name="form-field-name"
                                value={this.props.userInfo.class_year}
                                ref="class_year"
                                options={[
                                    {value: 2017, label: 2017},
                                    {value: 2018, label: 2018},
                                    {value: 2019, label: 2019},
                                    {value: 2020, label: 2020},
                                    {value: 2021, label: 2021},
                                    {value: 2022, label: 2022},
                                    {value: 2023, label: 2023},
                                ]}
                                searchable={true}
                                onChange={this.changeClassYear}
                            />
                        </div>
                        { preferences }
                        { notifications }
                        { fb_upsell }
                        <div className="button-wrapper">
                            <button className="signup-button" onClick={() => {
                                this.changeForm();
                                this.props.closeUserSettings();
                                if (!this.shouldShow(Object.assign({}, this.props, { showOverrided: false })))
                                        this.refs.modal.hide();
                            }}>Save</button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}
