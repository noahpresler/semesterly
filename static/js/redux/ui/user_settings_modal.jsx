import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';

export class UserSettingsModal extends React.Component {
    changeForm() {
        let userSettings = {
            major: this.refs.major.value,
            class_year: this.refs.year.value,
            social_courses: this.refs.share_courses.value,
            social_offerings: this.refs.share_sections.value
        }
        this.props.changeUserInfo(userSettings)
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.userInfo.isLoggedIn && (nextProps.userInfo.social_offerings == null || nextProps.userInfo.social_courses == null || nextProps.userInfo.major == null)) {
            this.refs.modal.show();
        }
    }
    render() {
        return (
            <Modal ref="modal" className="course-modal" closeOnClick={false} keyboard={false}>
                <form onSubmit={this.props.saveSettings}>
                    <label> Major:
                        <input ref="major" onChange={this.changeForm.bind(this)} value={this.props.userInfo.major}/>
                    </label>
                     <label> Class Year:
                        <input ref="year" onChange={this.changeForm.bind(this)} value={this.props.userInfo.class_year}/>
                    </label>
                     <label> Share Courses:
                        <input ref="share_courses" onChange={this.changeForm.bind(this)} value={this.props.userInfo.social_courses}/>
                    </label>
                     <label> Share Sections:
                        <input ref="share_sections" onChange={this.changeForm.bind(this)} value={this.props.userInfo.social_offerings}/>
                    </label>
                    <button type="submit">Save</button>
                </form>
            </Modal>
        );
    }
}
