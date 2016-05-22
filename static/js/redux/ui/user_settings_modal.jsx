import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';
import Select from 'react-select';
import majors from '../majors.jsx';

export class UserSettingsModal extends React.Component {
    constructor(props) {
        super(props);
        this.changeForm = this.changeForm.bind(this);
        this.changeMajor = this.changeMajor.bind(this);
        this.changeClassYear = this.changeClassYear.bind(this);
        this.shouldShow = this.shouldShow.bind(this);
        this.isIncomplete = this.isIncomplete.bind(this);
    }
    changeForm() {
        let newUserSettings = {
            social_courses: this.refs.share_courses.checked,
            social_offerings: this.refs.share_sections.checked
        }
        let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings();
    }
    componentDidMount() {
        if (this.shouldShow(this.props))
            this.refs.modal.show();
        if(this.isIncomplete(this.props.userInfo.social_courses)) {
            let newUserSettings = { social_courses: true, social_offerings: false };
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
        return props.userInfo.isLoggedIn && (this.isIncomplete(props.userInfo.social_offerings) || this.isIncomplete(props.userInfo.social_courses) || this.isIncomplete(props.userInfo.major) || this.isIncomplete(props.userInfo.class_year));
    }
    isIncomplete(prop) {
        return prop === undefined || prop === null || prop === "";
    }
    render() {
        return (
            <Modal ref="modal" className="welcome-modal" closeOnClick={false} keyboard={false}>
                <div id="modal-header">
                    <div className="pro-pic" style={{backgroundImage: 'url(' + this.props.userInfo.img_url + ')'}}></div>
                    <h1>Welcome!</h1>
                </div>
                <div id="modal-content">
                    <p>Welcome to Semester.ly, we just have a few quick questions!</p>
                    <h3>What's your major?</h3>
                    <Select
                        name="form-field-name"
                        value={this.props.userInfo.major}
                        ref="major"
                        options={majors}
                        onChange={this.changeMajor}
                    />
                    <h3>What's your graduating class year?</h3>
                    <Select
                        name="form-field-name"
                        value={this.props.userInfo.class_year}
                        ref="class_year"
                        options={[
                            {value: 2013, label: 2013},
                            {value: 2014, label: 2014},
                            {value: 2015, label: 2015},
                            {value: 2016, label: 2016},
                            {value: 2017, label: 2017},
                            {value: 2018, label: 2018},
                            {value: 2019, label: 2019},
                            {value: 2021, label: 2021},
                            {value: 2022, label: 2022},
                            {value: 2023, label: 2023}
                        ]}
                        onChange={this.changeClassYear}
                    />
                    <div className="preference">
                        <div className="preference-wrapper">
                            <h3>Would you like to find classes with friends?</h3>
                            <p className="disclaimer">Find classes with your friends, and allow your friends to find classes with you.</p>
                        </div>
                        <label className="switch switch-slide" onClick={this.changeForm}>
                            <input ref="share_courses" className="switch-input" type="checkbox" checked={this.props.userInfo.social_courses === true}/>
                            <span className="switch-label" data-on="Yes" data-off="No"></span>
                            <span className="switch-handle"></span>
                        </label>
                    </div>
                    <div className="preference">
                        <div className="preference-wrapper">
                            <h3>Would you like to find sections with friends?</h3>
                            <p className="disclaimer">Find specific sections with your friends, and allow your friends to find sections with you.</p>
                        </div>
                        <label className="switch switch-slide" onClick={this.changeForm}>
                            <input ref="share_sections" className="switch-input" type="checkbox" checked={this.props.userInfo.social_offerings === true}/>
                            <span className="switch-label" data-on="Yes" data-off="No"></span>
                            <span className="switch-handle"></span>
                        </label>
                    </div>
                    <button className="signup-button" onClick={() => {
                        this.props.saveSettings();
                        if (!this.shouldShow(this.props))
                                this.refs.modal.hide();
                    }}>Save</button>
                </div>
            </Modal>
        );
    }
}
