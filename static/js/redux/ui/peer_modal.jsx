import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import fetch from 'isomorphic-fetch';
import Modal from 'boron/WaveModal';
import { COLOUR_DATA } from '../constants.jsx';


export class PeerModal extends React.Component {
    constructor(props) {
        super(props);
        this.hide = this.hide.bind(this);
        this.optInAll = this.optInAll.bind(this);
        this.optInSignUp = this.optInSignUp.bind(this);
    }
    hide() {
        this.refs.modal.hide();
        if (this.props.isVisible) {
            this.props.togglePeerModal();
        }
    }
    componentDidMount() {
        if (this.props.isVisible) {
            this.refs.modal.show();
            if (this.props.userInfo.social_all) {
                this.props.fetchFriends();
            }
        }
    }
    componentWillReceiveProps(nextProps) {
        if (!this.props.isVisible && nextProps.isVisible) {
            this.refs.modal.show();
            if (this.props.userInfo.social_all) {
                this.props.fetchFriends();
            }
        }
    }
    optInAll() {
        let newUserSettings = {
            social_courses: true,
            social_offerings: true,
            social_all: true
        }
        let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
        this.props.changeUserInfo(userSettings);
        this.props.saveSettings(() => {this.props.fetchFriends();});
    }
    optInSignUp() {
        this.hide();
        this.props.openSignupModal();
    }
    render() {
        let modalStyle = {
            width: '100%'
        }
        let sideSlots = this.props.liveTimetableCourses.map(c => {
            let professors = [ ...new Set(c.slots.map(s => s.instructors)) ];
            let colourIndex = this.props.courseToColourIndex[c.id] || 0;
            return (
                <div className="pm-side-bar-slot" style={ { backgroundColor: COLOUR_DATA[colourIndex].background }} key={c.id}>
                    <div className="slot-bar" style={ { backgroundColor: COLOUR_DATA[colourIndex].border }} ></div>
                    <div className="master-slot-content">
                        <h3>{ c.code }</h3>
                        <h3>{ c.name }</h3>
                        <h3>{professors.length == 0 ? "No Professor Listed" : professors}</h3>
                    </div>
                </div>)});
        let proPicStyle = !this.props.userInfo.isLoggedIn ? {backgroundImage: 'url("/static/img/blank.jpg")'} : {backgroundImage: 'url(http://graph.facebook.com/' + JSON.parse(currentUser).fbook_uid + '/picture?width=700&height=700)'};
        let sideBar =
            <div id="pm-side-bar">
                <div className="circle-pic" style={proPicStyle}></div>
                <p>Your Courses</p>
                {sideSlots}
            </div>
        let emptyState =
            <div className="peer-card upsell">
                <div className="peer-card-wrapper upsell cf">
                    <h4>Check back later!</h4>
                    <p className="description">Seems you are the first one here! Add some more classes to your timetable or check back later to find peers who have added the same classes as you!</p>
                </div>
            </div>
        let optInClick = this.props.userInfo.isLoggedIn ? this.optInAll : this.optInSignUp;
        let upsell =
            <div className="peer-card upsell">
                <div className="peer-card-wrapper upsell cf">
                    <h4>Study Buddies, Delivered</h4>
                    <p className="description">See who your classmates are this semester! Click below to find Semester.ly users in your courses, message them, or add them on Facebook! <i>By accepting this permission, any Semester.ly students in your courses will be able to view your name and public Facebook profile.</i></p>
                    <button className="lure-accept" onClick={optInClick}>Yes, I'm In</button>
                </div>
            </div>
        let height = this.props.peers[0] && this.props.peers[0].shared_courses ? this.props.peers[0].shared_courses.length * 30 + 95 : 0;
        let peerCards = this.props.peers.map(p => {
            let isFriend = p.is_friend ? <p className="friend-status"><i className="fa fa-check"/> Friends</p> : null;
            let sharedCourses = p.shared_courses.map(sc => {
                    let colourIndex = this.props.courseToColourIndex[sc.course.id] || 0;
                    let inSection = sc.in_section ? <i className="fa fa-check"/> : null;
                    return (<div className="shared-course" key={String(sc.course.id)+p.profile_url}>
                            <div className="course-color-circle" style={{ backgroundColor: COLOUR_DATA[colourIndex].background }}>{inSection}</div>
                            <p className="course-title">{sc.course.code + ' - ' +sc.course.name}</p>
                    </div>)});
            return (<div className="peer-card" key={p.profile_url}>
                <div className="peer-card-wrapper" style={{height}} >
                    <div className="card-hat">
                        <div className="peer-pic" style={{backgroundImage: 'url(' + p.large_img + ')'}}></div>
                        <div className="user-info">
                            <h3>{p.name}</h3>
                            <a href={p.profile_url} target="_blank"><button className="view-profile-btn"><i className="fa fa-facebook-square"></i>View Profile</button></a>
                            {isFriend}
                        </div>
                    </div>
                    <div className="shared-courses">
                      {sharedCourses}
                    </div>
                </div>
            </div>)});
        let ghostCard =
            <div className="ghost peer-card">
                    <div className="peer-card-wrapper">
                        <div className="card-hat">
                            <div className="peer-pic" style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
                            <div className="user-info">
                                <div className="ghost-name">H</div>
                                <button className="view-profile-btn"/>
                            </div>
                        </div>
                        <div className="shared-courses">
                            <div className="shared-course">
                                <div className="course-color-circle"/>
                                <div className="ghost-course-title"></div>
                            </div>
                            <div className="shared-course">
                                <div className="course-color-circle" style={{backgroundColor: 'rgb(92, 204, 242)'}}/>
                                <div className="ghost-course-title"></div>
                            </div>
                            <div className="shared-course">
                                <div className="course-color-circle" style={{backgroundColor: 'rgb(83, 233, 151)'}}/>
                                <div className="ghost-course-title"></div>
                            </div>
                        </div>
                    </div>
                </div>
        let ghostCards = !this.props.userInfo.social_all || peerCards.length == 0 ? <div>{ghostCard}{ghostCard}{ghostCard}{ghostCard}</div> : null;
        let display = (!this.props.isLoading) ?
            <div id="main-modal-wrapper">
                <div id="pm-header">
                    <h4>Your Classmates</h4>
                <div className="key">
                    <div className="key-entry">
                        <div className="course-color-circle" style={{backgroundColor: '#ddd'}}><i className="fa fa-check"/></div>
                          <p>peer is in your class & section</p>
                    </div>
                        <div className="key-entry">
                            <div className="course-color-circle" style={{backgroundColor: '#ddd'}}/> 
                                <p>peer is in your class only</p>
                        </div>
                </div>
                </div>
                    {!this.props.userInfo.social_all ? upsell : null}
                    {peerCards.length == 0 && this.props.userInfo.social_all ? emptyState : null}
                    {this.props.userInfo.social_all ? peerCards : null}
                    {ghostCards}
            </div> :
            <div id="main-modal-wrapper">
                <span className="img-icon">
                        <div className="loader"/>
                </span>
                <div id="pm-header">
                    <h4>Your Classmates</h4>
                </div>
            </div>
        return (
            <Modal ref="modal"
                className='peer-modal'
                onHide={this.hide}
                modalStyle={modalStyle}
                >
                <div id="modal-content">
                    <div id="split-modal-wrapper">
                        {sideBar}
                        {display}
                    </div>
                </div>
            </Modal>
        );
    }
}
