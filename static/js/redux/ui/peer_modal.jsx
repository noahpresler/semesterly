import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import fetch from 'isomorphic-fetch';
import Modal from 'boron/DropModal';


export class PeerModal extends React.Component {
    constructor(props) {
        super(props);
        this.hide = this.hide.bind(this);
    }
    hide() {
        this.refs.modal.hide();
    }
    componentDidMount() {
        this.refs.modal.show();
    }
    render() {
        let modalStyle = {
            width: '100%'
        }
        let sideBar =
            <div id="pm-side-bar">
                <div className="circle-pic" style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
                <p>Your Courses</p>
                <div className="pm-side-bar-slot">
                    <div className="slot-bar" style={{backgroundColor: 'rgb(177, 81, 80)'}}></div>
                    <div className="master-slot-content">
                        <h3>{ 'EN.500.650' + ' ' + '(01)' }</h3>
                        <h3>{ 'Calculus II (Biology and Social Sciences' }</h3>
                        <h3>{ 'Professor Name' }</h3>
                    </div>
                </div>
                <div className="pm-side-bar-slot">
                    <div className="slot-bar" style={{backgroundColor: 'rgb(177, 81, 80)'}}></div>
                    <div className="master-slot-content">
                        <h3>{ 'EN.500.650' + ' ' + '(01)' }</h3>
                        <h3>{ 'Calculus II (Biology and Social Sciences' }</h3>
                        <h3>{ 'Professor Name' }</h3>
                    </div>
                </div>
                <div className="pm-side-bar-slot">
                    <div className="slot-bar" style={{backgroundColor: 'rgb(177, 81, 80)'}}></div>
                    <div className="master-slot-content">
                        <h3>{ 'EN.500.650' + ' ' + '(01)' }</h3>
                        <h3>{ 'Calculus II (Biology and Social Sciences' }</h3>
                        <h3>{ 'Professor Name' }</h3>
                    </div>
                </div>
                <div className="pm-side-bar-slot">
                    <div className="slot-bar" style={{backgroundColor: 'rgb(177, 81, 80)'}}></div>
                    <div className="master-slot-content">
                        <h3>{ 'EN.500.650' + ' ' + '(01)' }</h3>
                        <h3>{ 'Calculus II (Biology and Social Sciences' }</h3>
                        <h3>{ 'Professor Name' }</h3>
                    </div>
                </div>
            </div>
        let upsell =
            <div className="peer-card upsell">
                <div className="peer-card-wrapper upsell cf">
                    <h4>Study Buddies, Delivered</h4>
                    <p className="description">Find peers across Semester.ly taking schedules similar to yours, add them on Facebook. Meet new people, make new friends, have a great semester. <i>Accepting this permission will enable all users in your classes to....</i></p>
                    <button className="lure-accept">Yes, I'm In</button>
                </div>
            </div>
        let peerCard =
            <div className="peer-card">
                <div className="peer-card-wrapper">
                    <div className="card-hat">
                        <div className="peer-pic" style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
                        <div className="user-info">
                            <h3>Maxwell Ze Wei Yeo</h3>
                            <button className="view-profile-btn"><i className="fa fa-facebook-square"></i>View Profile</button>
                        </div>
                    </div>
                    <div className="shared-courses">
                        <div className="shared-course">
                            <div className="course-color-circle"><i className="fa fa-check"/></div>
                            <p className="course-title">Calculus II (Biology and Social Sciences)</p>
                        </div>
                        <div className="shared-course">
                            <div className="course-color-circle" style={{backgroundColor: 'rgb(92, 204, 242)'}}/>
                            <p className="course-title">Physics: Electricity & Magnetism</p>
                        </div>
                        <div className="shared-course">
                             <div className="course-color-circle" style={{backgroundColor: 'rgb(83, 233, 151)'}}/>
                            <p className="course-title">Introduction to Business</p>
                        </div>
                    </div>
                </div>
            </div>
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
        return (
            <Modal ref="modal"
                className='peer-modal'
                onHide={this.hide}
                modalStyle={modalStyle}
                >
                <div id="modal-content">
                    <div id="split-modal-wrapper">
                        {sideBar}
                        <div id="main-modal-wrapper">
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
                            {upsell}
                            {peerCard}
                            {peerCard}
                            {peerCard}
                            {peerCard}
                            {peerCard}
                            {peerCard}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}
